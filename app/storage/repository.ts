import { ListData, ListItem } from '../types';

// Small adapter interface also allows exercising the same SQL against real
// SQLite in tests without requiring the native React Native runtime.
export type SqlExecutor = {
  execute: (
    sql: string,
    params?: (string | number | null)[],
  ) => Promise<{
    rows: Record<string, any>[];
  }>;
};
export type SqlDatabase = SqlExecutor & {
  transaction: (work: (tx: SqlExecutor) => Promise<void>) => Promise<void>;
};

export const ROOT_ID = 'root';

export class ListRepository {
  constructor(private db: SqlDatabase) {}

  async initialize() {
    // Foreign keys must be enabled outside a transaction, on this connection.
    await this.db.execute('PRAGMA foreign_keys = ON');
    const foreignKeys = await this.db.execute('PRAGMA foreign_keys');
    if (Number(foreignKeys.rows[0]?.foreign_keys) !== 1) {
      throw new Error('SQLite foreign key enforcement is unavailable.');
    }
    await this.db.transaction(async tx => {
      const version = Number(
        (await tx.execute('PRAGMA user_version')).rows[0].user_version,
      );
      if (version > 1)
        throw new Error(
          'This database requires a newer version of RevsRotation.',
        );
      if (version === 0) {
        await tx.execute(`CREATE TABLE items (
          id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
          parent_id TEXT REFERENCES items(id) ON DELETE CASCADE,
          name TEXT NOT NULL CHECK(length(trim(name)) > 0),
          position INTEGER NOT NULL CHECK(position >= 0),
          CHECK((id = 'root' AND parent_id IS NULL) OR (id <> 'root' AND parent_id IS NOT NULL))
        )`);
        await tx.execute(
          'CREATE INDEX items_parent_position ON items(parent_id, position, id)',
        );
        await tx.execute(
          "INSERT INTO items(id, parent_id, name, position) VALUES ('root', NULL, 'Main', 0)",
        );
        await tx.execute('PRAGMA user_version = 1');
      }
    });
  }

  private async readList(
    tx: SqlExecutor,
    id: string,
  ): Promise<ListData | null> {
    const parent = (
      await tx.execute('SELECT id, name FROM items WHERE id = ?', [id])
    ).rows[0];
    if (!parent) return null;
    const result = await tx.execute(
      `SELECT item.id, item.name,
      EXISTS(SELECT 1 FROM items child WHERE child.parent_id = item.id) AS has_children
      FROM items item WHERE item.parent_id = ? ORDER BY item.position, item.id`,
      [id],
    );
    return {
      id: String(parent.id),
      name: String(parent.name),
      children: result.rows.map(row => ({
        id: String(row.id),
        name: String(row.name),
        hasChildren: !!row.has_children,
      })),
    };
  }

  async loadList(id: string): Promise<ListData | null> {
    let list: ListData | null = null;
    await this.db.transaction(async tx => {
      list = await this.readList(tx, id);
    });
    return list;
  }

  // Diff only the current list. Unchanged rows and deeper sublists are untouched.
  // The transaction makes multi-row reorder/deletion all-or-nothing.
  async saveChildren(
    before: ListData,
    children: ListItem[],
  ): Promise<ListData> {
    let saved!: ListData;
    await this.db.transaction(async tx => {
      const current = await this.readList(tx, before.id);
      if (!current) throw new Error('This list no longer exists.');
      const signature = (items: ListItem[]) =>
        JSON.stringify(items.map(item => [item.id, item.name]));
      if (signature(current.children) !== signature(before.children)) {
        throw new Error(
          'This list changed. Go back and reopen it before editing.',
        );
      }
      if (new Set(children.map(item => item.id)).size !== children.length) {
        throw new Error('Duplicate item IDs are not allowed.');
      }
      const previous = new Map(
        current.children.map((item, index) => [item.id, { item, index }]),
      );
      const retained = new Set(children.map(item => item.id));
      for (const item of current.children) {
        if (!retained.has(item.id)) {
          await tx.execute('DELETE FROM items WHERE id = ? AND parent_id = ?', [
            item.id,
            before.id,
          ]);
        }
      }
      for (let position = 0; position < children.length; position++) {
        const item = children[position];
        const name = item.name.trim();
        if (!name) throw new Error('Item names cannot be empty.');
        const old = previous.get(item.id);
        if (!old) {
          // SQLite generates durable random IDs. The UI's draft ID is never persisted.
          await tx.execute(
            'INSERT INTO items(parent_id, name, position) VALUES (?, ?, ?)',
            [before.id, name, position],
          );
        } else if (old.item.name !== name || old.index !== position) {
          await tx.execute(
            'UPDATE items SET name = ?, position = ? WHERE id = ? AND parent_id = ?',
            [name, position, item.id, before.id],
          );
        }
      }
      saved = (await this.readList(tx, before.id))!;
    });
    return saved;
  }
}
