import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Modal, TouchableOpacity } from 'react-native';
import { useListNavigation } from '../app/controllers/useListNavigation';
import ListNavigationMenu from '../app/views/ListScreen/ListNavigationMenu';
import { getRepository } from '../app/models/storage';

jest.mock('../app/models/storage', () => ({ getRepository: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
}));

test('loads current ancestor names, jumps to a parent with the correct Back stack, and handles dismissal and retry', async () => {
  const loadList = jest.fn(async (id: string) => ({
    id,
    name: id === 'work' ? 'Work renamed' : 'Weekly',
    children: [],
  }));
  (getRepository as jest.Mock).mockResolvedValue({ loadList });
  const reset = jest.fn();
  let controller!: ReturnType<typeof useListNavigation>;
  function Harness() {
    controller = useListNavigation({
      navigation: { reset },
      route: { params: { path: ['work', 'weekly'] } },
    } as any);
    return (
      <ListNavigationMenu
        {...controller}
        onClose={controller.close}
        onRetry={controller.open}
        onSelect={controller.select}
      />
    );
  }
  let screen!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    screen = TestRenderer.create(<Harness />);
  });
  expect(loadList).not.toHaveBeenCalled();
  await act(async () => {
    await controller.open();
  });
  expect(controller.entries.map(entry => entry.name)).toEqual([
    'Main',
    'Work renamed',
    'Weekly',
  ]);
  const action = (label: string) =>
    screen.root
      .findAllByType(TouchableOpacity)
      .find(node => node.props.accessibilityLabel === label)!;
  expect(action('Weekly, current list').props.disabled).toBe(true);
  await act(async () => {
    action('Go to Work renamed').props.onPress();
  });
  expect(reset).toHaveBeenCalledWith({
    index: 1,
    routes: [
      { name: 'RevRotation', params: { path: [] } },
      { name: 'RevRotation', params: { path: ['work'] } },
    ],
  });
  expect(controller.visible).toBe(false);
  await act(async () => {
    await controller.open();
  });
  await act(async () => {
    screen.root.findByType(Modal).props.onRequestClose();
  });
  expect(controller.visible).toBe(false);
  (getRepository as jest.Mock).mockRejectedValueOnce(
    new Error('Storage unavailable'),
  );
  await act(async () => {
    await controller.open();
  });
  expect(controller.error).toBe('Storage unavailable');
  await act(async () => {
    await controller.open();
  });
  expect(controller.error).toBeNull();
  await act(async () => {
    action('Go to Main').props.onPress();
  });
  expect(reset).toHaveBeenLastCalledWith({
    index: 0,
    routes: [{ name: 'RevRotation', params: { path: [] } }],
  });
  await act(async () => screen.unmount());
});
