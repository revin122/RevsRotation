import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Alert, Button, TouchableOpacity } from 'react-native';
import ListScreen from '../app/ListScreen';
import ReorderHandle from '../app/ListScreen/ReorderHandle';
import { Node } from '../app/types';

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaProvider: View, SafeAreaView: View };
});

test('edits, cancels deletion, deletes a subtree, reorders, and returns to browsing', async () => {
  let data: Node = {
    id: 'root',
    name: 'Root',
    children: [
      {
        id: 'a',
        name: 'Alpha',
        children: [{ id: 'nested', name: 'Nested', children: [] }],
      },
      { id: 'b', name: 'Beta', children: [] },
      { id: 'c', name: 'Gamma', children: [] },
    ],
  };
  const navigate = jest.fn();
  let screen!: TestRenderer.ReactTestRenderer;
  const render = () => (
    <ListScreen
      data={data}
      path={[]}
      isRoot
      onBack={jest.fn()}
      onNavigate={navigate}
      onDataUpdate={next => {
        data = next;
        screen.update(render());
      }}
    />
  );
  await act(async () => {
    screen = TestRenderer.create(render());
  });
  const press = async (label: string) => {
    await act(async () => {
      screen.root
        .findAllByType(TouchableOpacity)
        .find(node => node.props.accessibilityLabel === label)!
        .props.onPress();
    });
  };
  await act(async () => {
    screen.root
      .findAllByType(TouchableOpacity)
      .find(node => !node.props.accessibilityLabel)!
      .props.onPress();
  });
  await press('Rename Alpha');
  await act(async () => {
    screen.root
      .findByProps({ accessibilityLabel: 'Item name' })
      .props.onChangeText('  Renamed  ');
  });
  await act(async () => {
    screen.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Save')!
      .props.onPress();
  });
  expect(data.children[0].name).toBe('Renamed');
  expect(data.children[0].id).toBe('a');
  expect(data.children[0].children[0].id).toBe('nested');

  await act(async () => {
    screen.root.findAllByType(ReorderHandle)[0].props.onEnd(128);
  });
  expect(data.children.map(item => item.id)).toEqual(['b', 'c', 'a']);

  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await press('Delete Renamed');
  expect(alert.mock.calls[0][1]).toContain('all items inside');
  expect(alert.mock.calls[0][2]![0].style).toBe('cancel');
  expect(data.children).toHaveLength(3);
  await act(async () => {
    alert.mock.calls[0][2]![1].onPress!();
  });
  expect(data.children.map(item => item.id)).toEqual(['b', 'c']);
  alert.mockRestore();

  await act(async () => {
    screen.root
      .findAllByType(TouchableOpacity)
      .find(node => !node.props.accessibilityLabel)!
      .props.onPress();
  });
  expect(screen.root.findAllByType(ReorderHandle)).toHaveLength(0);
  await press('Open Beta');
  expect(navigate).toHaveBeenCalledWith(['b']);
  await act(async () => {
    screen.unmount();
  });
}, 30000);
