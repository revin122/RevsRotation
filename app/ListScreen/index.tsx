import React, { useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  View,
  Text,
  FlatList,
  Button,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { ListData, ListItem } from '../types';
import { createNode } from '../utils';
import { produce } from 'immer';
import { styles, ROW_HEIGHT } from './views';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import ReorderHandle from './ReorderHandle';

type Props = {
  data: ListData;
  busy?: boolean;
  path: string[];
  onDataUpdate: (newData: ListData) => Promise<boolean>;
  onNavigate: (newPath: string[]) => void;
  onBack: () => void;
  isRoot: boolean;
};

const ListScreen: React.FC<Props> = ({
  data,
  busy = false,
  path,
  onDataUpdate,
  onNavigate,
  onBack,
  isRoot,
}) => {
  const current = data;
  const [newText, setNewText] = useState('');
  const newItemInput = useRef<TextInput>(null);
  const inputGeneration = useRef(0);
  const [inputReset, setInputReset] = useState({generation: 0, focus: false});
  const [editing, setEditing] = useState(false);
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
      setInputReset({generation: inputGeneration.current, focus: restoreFocus});
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

  const dragFrom = drag
    ? current.children.findIndex(item => item.id === drag.id)
    : -1;
  const dragTo = drag
    ? Math.max(
        0,
        Math.min(
          current.children.length - 1,
          dragFrom + Math.round(drag.distance / ROW_HEIGHT),
        ),
      )
    : -1;

  return (
    <SafeAreaProvider>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={styles.container}>
          <StatusBar hidden />
          <View style={styles.headerRow}>
            <View style={styles.headerSide}>
              {!isRoot && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={onBack}
                  disabled={!!drag || busy}
                  accessibilityRole="button"
                  accessibilityLabel="Back"
                >
                  <Text style={styles.backButtonText}>‹ Back</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text
              style={styles.header}
              numberOfLines={1}
              accessibilityRole="header"
            >
              {isRoot ? 'Main' : current.name}
            </Text>
            <View style={styles.headerSide}>
              {(current.children.length > 0 || editing) && (
                <TouchableOpacity
                  style={styles.editButton}
                  disabled={!!drag || busy}
                  accessibilityRole="button"
                  onPress={() => {
                    Keyboard.dismiss();
                    setEditing(!editing);
                  }}
                >
                  <Text style={styles.backButtonText}>
                    {editing ? 'Done' : 'Edit'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {editing && (
            <Text style={styles.editHint}>
              Tap a name to rename. Drag ≡ to reorder.
            </Text>
          )}
          <FlatList
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!drag}
            data={current.children}
            extraData={{ editing, drag }}
            keyExtractor={item => item.id}
            getItemLayout={(_, index) => ({
              length: ROW_HEIGHT,
              offset: ROW_HEIGHT * index,
              index,
            })}
            renderItem={({ item, index }) => {
              const active = drag?.id === item.id;
              const shift = active
                ? drag.distance
                : drag && index > dragFrom && index <= dragTo
                ? -ROW_HEIGHT
                : drag && index < dragFrom && index >= dragTo
                ? ROW_HEIGHT
                : 0;
              return (
                <View
                  style={[
                    styles.row,
                    active && styles.draggedRow,
                    { transform: [{ translateY: shift }] },
                  ]}
                >
                  <View style={styles.listItem}>
                    {editing && (
                      <TouchableOpacity
                        style={styles.rowControl}
                        disabled={!!drag || busy}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${item.name}`}
                        onPress={() => confirmDelete(item)}
                      >
                        <Text style={styles.deleteText}>⊖</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.itemName}
                      disabled={!!drag || busy}
                      accessibilityRole="button"
                      accessibilityLabel={`${editing ? 'Rename' : 'Open'} ${
                        item.name
                      }`}
                      onPress={() => {
                        if (editing) {
                          setRenameText(item.name);
                          setRenameId(item.id);
                        } else onNavigate([...path, item.id]);
                      }}
                    >
                      <Text numberOfLines={1}>{item.name}</Text>
                    </TouchableOpacity>
                    {editing && (
                      <ReorderHandle
                        name={item.name}
                        onStart={() => {
                          if (busy) return;
                          Keyboard.dismiss();
                          setDrag({ id: item.id, distance: 0 });
                        }}
                        onMove={distance =>
                          setDrag({
                            id: item.id,
                            distance: Math.max(
                              -index * ROW_HEIGHT,
                              Math.min(
                                (current.children.length - 1 - index) *
                                  ROW_HEIGHT,
                                distance,
                              ),
                            ),
                          })
                        }
                        onEnd={distance => {
                          moveItem(item.id, Math.round(distance / ROW_HEIGHT));
                          setDrag(null);
                        }}
                        onCancel={() => setDrag(null)}
                        onStep={direction => moveItem(item.id, direction)}
                      />
                    )}
                  </View>
                </View>
              );
            }}
          />
          <TextInput
            key={inputReset.generation}
            ref={newItemInput}
            autoFocus={inputReset.focus}
            style={styles.input}
            placeholder="Enter item text"
            value={newText}
            onChangeText={text => {
              if (inputReset.generation === inputGeneration.current) {
                setNewText(text);
              }
            }}
            editable={!drag && !busy}
          />
          <Button
            title="+ Add Item"
            onPress={addSublist}
            disabled={!!drag || busy}
          />
          <Modal
            visible={renameId !== null}
            transparent
            animationType="fade"
            onRequestClose={() => {
              if (!busy) setRenameId(null);
            }}
          >
            <KeyboardAvoidingView
              style={styles.modalOverlay}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <View style={styles.dialog} accessibilityViewIsModal>
                <Text style={styles.dialogTitle}>Rename item</Text>
                <TextInput
                  style={styles.input}
                  editable={!busy}
                  value={renameText}
                  onChangeText={setRenameText}
                  autoFocus
                  selectTextOnFocus
                  accessibilityLabel="Item name"
                  returnKeyType="done"
                  onSubmitEditing={rename}
                />
                <View style={styles.dialogButtons}>
                  <Button
                    title="Cancel"
                    disabled={busy}
                    onPress={() => setRenameId(null)}
                  />
                  <Button
                    title="Save"
                    onPress={rename}
                    disabled={busy || !renameText.trim()}
                  />
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
};

export default ListScreen;
