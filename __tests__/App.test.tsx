import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Alert, Button } from 'react-native';
import App from '../app/index';
import ListScreen from '../app/ListScreen';
import { getRepository } from '../app/storage';

jest.mock('../app/storage', () => ({ getRepository: jest.fn() }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaProvider: View, SafeAreaView: View };
});
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    NavigationContainer: ({ children }: any) => children,
    useFocusEffect: (effect: any) => React.useEffect(effect, [effect]),
  };
});
jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  const navigation = { push: jest.fn(), goBack: jest.fn(), reset: jest.fn() };
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: any) => children,
      Screen: ({ component: Component, initialParams }: any) =>
        React.createElement(Component, {
          navigation,
          route: { params: initialParams },
        }),
    }),
  };
});

const root = { id: 'root', name: 'Main', children: [] };
const flush = async () => {
  await act(async () => {});
};

afterEach(() => jest.restoreAllMocks());

test('startup waits for storage and retries failed loads without writing empty data', async () => {
  const saveChildren = jest.fn();
  const loadList = jest
    .fn()
    .mockRejectedValueOnce(new Error('Disk unavailable'))
    .mockResolvedValue(root);
  (getRepository as jest.Mock).mockResolvedValue({ loadList, saveChildren });
  let screen!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    screen = TestRenderer.create(<App />);
  });
  await flush();
  expect(screen.root.findAllByType(ListScreen)).toHaveLength(0);
  expect(saveChildren).not.toHaveBeenCalled();
  await act(async () => {
    screen.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Retry')!
      .props.onPress();
  });
  await flush();
  expect(screen.root.findByType(ListScreen).props.data).toEqual(root);
  expect(loadList).toHaveBeenCalledWith('root');
  expect(saveChildren).not.toHaveBeenCalled();
  await act(async () => screen.unmount());
}, 30000);

test('failed saves preserve the displayed list; successful saves use persisted IDs', async () => {
  const saved = {
    ...root,
    children: [{ id: 'durable-id', name: 'New item', hasChildren: false }],
  };
  const saveChildren = jest
    .fn()
    .mockRejectedValueOnce(new Error('Disk full'))
    .mockResolvedValue(saved);
  (getRepository as jest.Mock).mockResolvedValue({
    loadList: jest.fn().mockResolvedValue(root),
    saveChildren,
  });
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  let screen!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    screen = TestRenderer.create(<App />);
  });
  await flush();
  const next = {
    ...root,
    children: [{ id: 'draft', name: 'New item', hasChildren: false }],
  };
  let result;
  await act(async () => {
    result = await screen.root.findByType(ListScreen).props.onDataUpdate(next);
  });
  expect(result).toBe(false);
  expect(alert).toHaveBeenCalledWith('Could not save changes', 'Disk full');
  expect(screen.root.findByType(ListScreen).props.data).toEqual(root);
  await act(async () => {
    result = await screen.root.findByType(ListScreen).props.onDataUpdate(next);
  });
  expect(result).toBe(true);
  expect(screen.root.findByType(ListScreen).props.data).toEqual(saved);
  await act(async () => screen.unmount());
}, 30000);

test('copy snapshot remains available after screen remount and paste shows committed contents', async () => {
  const source = {
    id: 'root',
    name: 'Main',
    children: [{ id: 'source-item', name: 'Item', hasChildren: false }],
  };
  const snapshot = {
    sourceId: 'root',
    name: 'Main',
    items: [{ id: 'source-item', parentId: 'root', name: 'Item', position: 0 }],
  };
  const pasted = {
    ...source,
    children: [
      ...source.children,
      { id: 'new-id', name: 'Item', hasChildren: false },
    ],
  };
  const copyList = jest.fn().mockResolvedValue(snapshot);
  const pasteList = jest.fn().mockResolvedValue(pasted);
  (getRepository as jest.Mock).mockResolvedValue({
    loadList: jest.fn().mockResolvedValue(source),
    copyList,
    pasteList,
  });
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  let screen!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    screen = TestRenderer.create(<App />);
  });
  await flush();
  await act(async () => {
    await screen.root.findByType(ListScreen).props.onCopy();
  });
  expect(copyList).toHaveBeenCalledWith('root');
  await act(async () => screen.unmount());
  await act(async () => {
    screen = TestRenderer.create(<App />);
  });
  await flush();
  expect(screen.root.findByType(ListScreen).props.canPaste).toBe(true);
  await act(async () => {
    await screen.root.findByType(ListScreen).props.onPaste();
  });
  expect(pasteList).toHaveBeenCalledWith('root', snapshot);
  expect(screen.root.findByType(ListScreen).props.data).toEqual(pasted);
  await act(async () => screen.unmount());
});
