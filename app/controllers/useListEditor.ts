import { useRef, useState } from 'react';
import { Alert, Keyboard, TextInput } from 'react-native';
import { produce } from 'immer';
import { ListItem } from '../types/list';
import { createNode } from '../models/tree';
import { ListScreenProps } from '../types/listScreen';

export function useListEditor(
  { data, busy = false, path, onDataUpdate, onNavigate }: ListScreenProps,
  rowHeight: number,
) {
  const current = data;
  const [newText, setNewText] = useState('');
  const newItemInput = useRef<TextInput>(null);
  const inputGeneration = useRef(0);
  const [inputReset, setInputReset] = useState({ generation: 0, focus: false });
  const [editing, setEditing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [drag, setDrag] = useState<{ id: string; distance: number } | null>(
    null,
  );

  const updateChildren = (update: (children: ListItem[]) => void) => {
    if (busy) return Promise.resolve(false);
    return onDataUpdate(produce(data, draft => update(draft.children)));
  };

  const addSublist = async () => {
    if (!newText.trim()) return;
    const restoreFocus = newItemInput.current?.isFocused() ?? false;
    const saved = await updateChildren(children => {
      const { id, name } = createNode(newText.trim());
      children.push({ id, name, hasChildren: false });
    });
    if (saved) {
      // Replace the native input after saving, and ignore any delayed text
      // events from the old input (for example keyboard composition events).
      inputGeneration.current += 1;
      setNewText('');
      setInputReset({
        generation: inputGeneration.current,
        focus: restoreFocus,
      });
    }
  };

  const rename = async () => {
    if (!renameText.trim() || !renameId) return;
    const saved = await updateChildren(children => {
      const item = children.find(child => child.id === renameId);
      if (item) item.name = renameText.trim();
    });
    if (saved) setRenameId(null);
  };

  const confirmDelete = (item: ListItem) => {
    Alert.alert(
      `Delete “${item.name}”?`,
      item.hasChildren
        ? 'This will delete this sublist and all items inside it. This cannot be undone.'
        : 'This item will be deleted. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            updateChildren(children => {
              const index = children.findIndex(child => child.id === item.id);
              if (index >= 0) children.splice(index, 1);
            });
          },
        },
      ],
    );
  };

  const moveItem = (id: string, steps: number) => {
    if (steps === 0) return;
    updateChildren(children => {
      const from = children.findIndex(item => item.id === id);
      if (from < 0) return;
      const to = Math.max(0, Math.min(children.length - 1, from + steps));
      const [item] = children.splice(from, 1);
      children.splice(to, 0, item);
    });
  };

  const rotate = () => {
    if (busy || drag || current.children.length < 2) return;
    moveItem(current.children[0].id, current.children.length - 1);
  };

  const dragFrom = drag
    ? current.children.findIndex(item => item.id === drag.id)
    : -1;
  const dragTo = drag
    ? Math.max(
        0,
        Math.min(
          current.children.length - 1,
          dragFrom + Math.round(drag.distance / rowHeight),
        ),
      )
    : -1;

  const showMenu = () => {
    Keyboard.dismiss();
    setMenuVisible(true);
  };
  const closeMenu = () => setMenuVisible(false);
  const toggleEditing = () => {
    closeMenu();
    Keyboard.dismiss();
    setEditing(!editing);
  };
  const openItem = (item: ListItem) => {
    if (editing) {
      setRenameText(item.name);
      setRenameId(item.id);
    } else onNavigate([...path, item.id]);
  };
  const startDrag = (id: string) => {
    if (busy) return;
    Keyboard.dismiss();
    setDrag({ id, distance: 0 });
  };
  const updateDrag = (id: string, index: number, distance: number) =>
    setDrag({
      id,
      distance: Math.max(
        -index * rowHeight,
        Math.min((current.children.length - 1 - index) * rowHeight, distance),
      ),
    });
  const finishDrag = (id: string, distance: number) => {
    moveItem(id, Math.round(distance / rowHeight));
    setDrag(null);
  };
  const cancelDrag = () => setDrag(null);
  const cancelRename = () => {
    if (!busy) setRenameId(null);
  };
  const changeNewText = (text: string) => {
    if (inputReset.generation === inputGeneration.current) setNewText(text);
  };
  return {
    menuVisible,
    showMenu,
    closeMenu,
    current,
    newText,
    newItemInput,
    inputReset,
    editing,
    renameId,
    renameText,
    drag,
    dragFrom,
    dragTo,
    addSublist,
    rename,
    confirmDelete,
    moveItem,
    rotate,
    toggleEditing,
    openItem,
    startDrag,
    updateDrag,
    finishDrag,
    cancelDrag,
    cancelRename,
    changeNewText,
    changeRenameText: setRenameText,
  };
}
