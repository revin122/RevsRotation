import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Alert, Button, TouchableOpacity } from 'react-native';
import ListScreen from '../app/views/ListScreen';
import ReorderHandle from '../app/views/ListScreen/ReorderHandle';
import { ListData } from '../app/types/list';

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaProvider: View, SafeAreaView: View };
});

test('edits, cancels deletion, deletes a subtree, reorders, and returns to browsing', async () => {
  let data: ListData = {
    id: 'root',
    name: 'Root',
    children: [
      {
        id: 'a',
        name: 'Alpha',
        hasChildren: true,
      },
      { id: 'b', name: 'Beta', hasChildren: false },
      { id: 'c', name: 'Gamma', hasChildren: false },
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
      onDataUpdate={async next => {
        data = next;
        screen.update(render());
        return true;
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
  await press('List actions');
  await press('Edit List');
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
  expect(data.children[0].hasChildren).toBe(true);

  await act(async () => {
    screen.root.findAllByType(ReorderHandle)[0].props.onEnd(128);
  });
  expect(data.children.map(item => item.id)).toEqual(['b', 'c', 'a']);

  await press('Move Beta to bottom');
  expect(data.children.map(item => item.id)).toEqual(['c', 'a', 'b']);
  expect(
    screen.root
      .findAllByType(TouchableOpacity)
      .find(node => node.props.accessibilityLabel === 'Move Beta to bottom')!
      .props.disabled,
  ).toBe(true);
  await press('Move Gamma to bottom');
  expect(data.children.map(item => item.id)).toEqual(['a', 'b', 'c']);

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

  await press('Done editing');
  expect(screen.root.findAllByType(ReorderHandle)).toHaveLength(0);
  await press('Open Beta');
  expect(navigate).toHaveBeenCalledWith(['b']);
  await act(async () => {
    screen.unmount();
  });
}, 30000);

test.each([true, false])(
  'add input clears only after a successful save (success=%s)',
  async success => {
    let resolveSave!: (saved: boolean) => void;
    const onDataUpdate = jest.fn(
      (_next: ListData) =>
        new Promise<boolean>(resolve => {
          resolveSave = resolve;
        }),
    );
    let screen!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      screen = TestRenderer.create(
        <ListScreen
          data={{ id: 'root', name: 'Main', children: [] }}
          path={[]}
          isRoot
          onBack={jest.fn()}
          onNavigate={jest.fn()}
          onDataUpdate={onDataUpdate}
        />,
      );
    });
    const input = () =>
      screen.root.findByProps({ placeholder: 'Enter item text' });
    await act(async () => {
      input().props.onChangeText('New item');
    });
    const previousInput = input();
    const delayedChange = previousInput.props.onChangeText;
    let pending!: Promise<void>;
    await act(async () => {
      pending = screen.root
        .findAllByType(Button)
        .find(button => button.props.accessibilityLabel === 'Add item')!
        .props.onPress();
    });
    expect(input().props.value).toBe('New item');
    expect(onDataUpdate.mock.calls[0][0].children[0].name).toBe('New item');
    await act(async () => {
      resolveSave(success);
      await pending;
    });
    expect(input().props.value).toBe(success ? '' : 'New item');
    if (success) {
      expect(input()).not.toBe(previousInput);
      await act(async () => delayedChange('New item'));
      expect(input().props.value).toBe('');
      await act(async () => input().props.onChangeText('Next item'));
      expect(input().props.value).toBe('Next item');
    } else {
      expect(input()).toBe(previousInput);
    }
    await act(async () => screen.unmount());
  },
);

test('list menu hides Edit for empty lists and enables paste only with a clipboard', async () => {
  const onPaste = jest.fn();
  let screen!: TestRenderer.ReactTestRenderer;
  const render = (canPaste: boolean) => (
    <ListScreen
      data={{ id: 'root', name: 'Main', children: [] }}
      path={[]}
      isRoot
      onBack={jest.fn()}
      onNavigate={jest.fn()}
      onDataUpdate={jest.fn()}
      onPaste={onPaste}
      onCopy={jest.fn()}
      canPaste={canPaste}
      copiedListName="Source"
    />
  );
  await act(async () => {
    screen = TestRenderer.create(render(false));
  });
  const action = (label: string) =>
    screen.root
      .findAllByType(TouchableOpacity)
      .find(node => node.props.accessibilityLabel === label);
  await act(async () => {
    action('List actions')!.props.onPress();
  });
  expect(action('Edit List')).toBeUndefined();
  expect(action('Copy List')!.props.disabled).toBe(true);
  expect(action('Paste List')!.props.disabled).toBe(true);
  await act(async () => {
    screen.update(render(true));
  });
  expect(action('Paste List')!.props.disabled).toBe(false);
  await act(async () => {
    action('Paste List')!.props.onPress();
  });
  expect(onPaste).toHaveBeenCalledTimes(1);
  expect(action('Paste List')).toBeUndefined();
  await act(async () => screen.unmount());
});

test('ROTATE saves the first item at the bottom, preserving IDs and sublists', async () => {
  let data: ListData = {
    id: 'parent',
    name: 'Sublist',
    children: [
      { id: 'a', name: 'Alpha', hasChildren: true },
      { id: 'b', name: 'Beta', hasChildren: false },
      { id: 'c', name: 'Gamma', hasChildren: false },
    ],
  };
  const original = data.children;
  let busy = false;
  let screen!: TestRenderer.ReactTestRenderer;
  const save = jest.fn(async (next: ListData) => {
    data = next;
    screen.update(render());
    return true;
  });
  const render = () => (
    <ListScreen
      data={data}
      path={['parent']}
      isRoot={false}
      busy={busy}
      onBack={jest.fn()}
      onNavigate={jest.fn()}
      onDataUpdate={save}
    />
  );
  await act(async () => {
    screen = TestRenderer.create(render());
  });
  const button = () =>
    screen.root
      .findAllByType(TouchableOpacity)
      .find(node => node.props.accessibilityLabel === 'ROTATE')!;
  await act(async () => {
    button().props.onPress();
  });
  expect(data.children).toEqual([original[1], original[2], original[0]]);
  expect(data.id).toBe('parent');
  busy = true;
  await act(async () => {
    screen.update(render());
  });
  expect(button().props.disabled).toBe(true);
  await act(async () => {
    button().props.onPress();
  });
  expect(save).toHaveBeenCalledTimes(1);
  busy = false;
  for (const children of [[], [original[0]]]) {
    data = { ...data, children };
    await act(async () => {
      screen.update(render());
    });
    expect(button().props.disabled).toBe(true);
    await act(async () => {
      button().props.onPress();
    });
  }
  expect(save).toHaveBeenCalledTimes(1);
  await act(async () => screen.unmount());
});
