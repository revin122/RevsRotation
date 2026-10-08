const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { mkdtempSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const ts = require('typescript');
const compiled = ts.transpileModule(
  readFileSync(join(__dirname, '../app/storage/repository.ts'), 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  },
);
const exportsForTest = {};
new Function('exports', compiled.outputText)(exportsForTest);
const { ListRepository } = exportsForTest;

function connect(path) {
  const sqlite = new DatabaseSync(path);
  // Match the native driver's async result shape while executing actual SQLite.
  const execute = async (sql, params = []) => {
    const stmt = sqlite.prepare(sql);
    return { rows: stmt.all(...params) };
  };
  const db = {
    execute,
    transaction: async work => {
      sqlite.exec('BEGIN');
      try {
        await work({ execute });
        sqlite.exec('COMMIT');
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
  return { sqlite, repo: new ListRepository(db) };
}
const draft = name => ({ id: `draft-${name}`, name, hasChildren: false });

test('persists names, IDs, nesting and sibling order across reopening; cascades deletion', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'revsrotation-'));
  const path = join(directory, 'test.sqlite');
  let connection = connect(path);
  try {
    let { repo } = connection;
    await repo.initialize();
    let root = await repo.loadList('root');
    assert.deepEqual(root.children, []);
    root = await repo.saveChildren(root, [draft('A'), draft('B'), draft('C')]);
    const [a, b, c] = root.children;
    assert.notEqual(a.id, 'draft-A');
    let aList = await repo.loadList(a.id);
    aList = await repo.saveChildren(aList, [draft('Child')]);
    const child = aList.children[0];
    let childList = await repo.loadList(child.id);
    childList = await repo.saveChildren(childList, [draft('Grandchild')]);
    const grandchild = childList.children[0];
    root = await repo.loadList('root');
    assert.equal(root.children[0].hasChildren, true);
    root = await repo.saveChildren(root, [
      c,
      { ...root.children[0], name: "A's renamed list" },
      b,
    ]);
    connection.sqlite.close();
    connection = connect(path);
    repo = connection.repo;
    await repo.initialize();
    root = await repo.loadList('root');
    assert.deepEqual(
      root.children.map(item => item.id),
      [c.id, a.id, b.id],
    );
    assert.equal(root.children[1].name, "A's renamed list");
    assert.equal((await repo.loadList(child.id)).children[0].id, grandchild.id);
    await repo.saveChildren(
      root,
      root.children.filter(item => item.id !== a.id),
    );
    assert.equal(await repo.loadList(a.id), null);
    assert.equal(await repo.loadList(child.id), null);
    assert.equal(await repo.loadList(grandchild.id), null);
    assert.ok(await repo.loadList(b.id));
    assert.ok(await repo.loadList(c.id));
  } finally {
    connection.sqlite.close();
    rmSync(directory, { recursive: true });
  }
});

test('rolls back a failed multi-row edit and rejects stale snapshots and invalid parents', async () => {
  const { sqlite, repo } = connect(':memory:');
  try {
    await repo.initialize();
    let root = await repo.loadList('root');
    root = await repo.saveChildren(root, [draft('A'), draft('B')]);
    const old = root;
    // Deletion runs first, but invalid later insertion must roll the deletion back.
    await assert.rejects(repo.saveChildren(root, [draft(' ')]));
    assert.deepEqual(await repo.loadList('root'), old);
    root = await repo.saveChildren(root, root.children.slice().reverse());
    await assert.rejects(repo.saveChildren(old, []), /changed/);
    assert.deepEqual(await repo.loadList('root'), root);
    assert.throws(() =>
      sqlite
        .prepare(
          'INSERT INTO items(parent_id, name, position) VALUES (?, ?, ?)',
        )
        .run('missing', 'Orphan', 0),
    );
    assert.deepEqual(sqlite.prepare('PRAGMA foreign_key_check').all(), []);
  } finally {
    sqlite.close();
  }
});

test('loads only immediate children using the parent index and refuses future schemas', async () => {
  const { sqlite, repo } = connect(':memory:');
  try {
    await repo.initialize();
    let root = await repo.loadList('root');
    root = await repo.saveChildren(root, [draft('Parent')]);
    let list = await repo.loadList(root.children[0].id);
    await repo.saveChildren(list, [draft('Nested')]);
    root = await repo.loadList('root');
    assert.equal(root.children.length, 1);
    assert.equal(root.children[0].hasChildren, true);
    assert.equal(root.children[0].children, undefined);
    const plan = sqlite
      .prepare(
        'EXPLAIN QUERY PLAN SELECT * FROM items WHERE parent_id = ? ORDER BY position, id',
      )
      .all('root');
    assert.ok(plan.some(row => row.detail.includes('items_parent_position')));
    sqlite.exec('PRAGMA user_version = 2');
    await assert.rejects(repo.initialize(), /newer version/);
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM items').get().n, 3);
  } finally {
    sqlite.close();
  }
});
