import { createNode, flattenLeafPaths, getNodeAtPath } from '../app/utils';

test('creates distinct IDs even for items added at the same time with the same name', () => {
  const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
  try {
    const first = createNode('Item');
    const second = createNode('Item');
    expect(first.id).not.toBe(second.id);
    expect(first.children).toEqual([]);
  } finally {
    clock.mockRestore();
  }
});

test('keeps paths pointing to the same item after rename, reorder, and sibling deletion', () => {
  const root = createNode('Root');
  const sibling = createNode('Sibling');
  const group = createNode('Group');
  const leaf = createNode('Leaf');
  root.children.push(sibling, group);
  group.children.push(leaf);
  const path = [group.id, leaf.id];

  expect(getNodeAtPath(root, [])).toBe(root);
  expect(getNodeAtPath(root, path)).toBe(leaf);
  group.name = 'Renamed';
  root.children.reverse();
  expect(getNodeAtPath(root, path)).toBe(leaf);
  root.children = root.children.filter(item => item.id !== sibling.id);
  expect(getNodeAtPath(root, path)).toBe(leaf);
});

test('returns leaf ID paths in current list order and excludes an empty root', () => {
  const root = createNode('Root');
  expect(flattenLeafPaths(root)).toEqual([]);
  const first = createNode('First');
  const group = createNode('Group');
  const nested = createNode('Nested');
  group.children.push(nested);
  root.children.push(first, group);
  expect(flattenLeafPaths(root)).toEqual([[first.id], [group.id, nested.id]]);
  root.children.reverse();
  expect(flattenLeafPaths(root)).toEqual([[group.id, nested.id], [first.id]]);
});

test('rejects a missing ID instead of selecting another item', () => {
  expect(() => getNodeAtPath(createNode('Root'), ['missing'])).toThrow('Node not found');
});
