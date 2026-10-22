import React from 'react';
import {
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
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useListEditor } from '../../controllers/useListEditor';
import { ListScreenProps } from '../../types/listScreen';
import { styles, ROW_HEIGHT } from './styles';
import ReorderHandle from './ReorderHandle';

const ListScreen: React.FC<ListScreenProps> = props => {
  const {
    busy = false,
    onCopy,
    onPaste,
    canPaste = false,
    copiedListName,
    onBack,
    isRoot,
  } = props;
  const {
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
    toggleEditing,
    openItem,
    startDrag,
    updateDrag,
    finishDrag,
    cancelDrag,
    cancelRename,
    changeNewText,
    changeRenameText,
  } = useListEditor(props, ROW_HEIGHT);

  return (
    <SafeAreaProvider>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.container}>
          {/* Android fullscreen prevents adjustResize from making room for the keyboard. */}
          <StatusBar hidden={Platform.OS === 'ios'} />
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
                  onPress={toggleEditing}
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
              Tap a name to rename. Drag ≡ to reorder or use the arrow to move
              to bottom.
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
                      onPress={() => openItem(item)}
                    >
                      <Text numberOfLines={1}>{item.name}</Text>
                    </TouchableOpacity>
                    {editing && (
                      <TouchableOpacity
                        style={styles.rowControl}
                        disabled={
                          !!drag ||
                          busy ||
                          index === current.children.length - 1
                        }
                        accessibilityRole="button"
                        accessibilityLabel={`Move ${item.name} to bottom`}
                        accessibilityState={{
                          disabled:
                            !!drag ||
                            busy ||
                            index === current.children.length - 1,
                        }}
                        onPress={() =>
                          moveItem(item.id, current.children.length - 1 - index)
                        }
                      >
                        <Text
                          style={[
                            styles.moveBottomText,
                            (busy ||
                              !!drag ||
                              index === current.children.length - 1) &&
                              styles.disabledControl,
                          ]}
                        >
                          ↓↓
                        </Text>
                      </TouchableOpacity>
                    )}
                    {editing && (
                      <ReorderHandle
                        name={item.name}
                        onStart={() => startDrag(item.id)}
                        onMove={distance =>
                          updateDrag(item.id, index, distance)
                        }
                        onEnd={distance => finishDrag(item.id, distance)}
                        onCancel={cancelDrag}
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
            onChangeText={changeNewText}
            editable={!drag && !busy}
          />
          <Button
            title="+ Add Item"
            onPress={addSublist}
            disabled={!!drag || busy}
          />
          <View style={styles.clipboardActions}>
            {onCopy && (
              <Button
                title="Copy List"
                onPress={onCopy}
                disabled={busy || !!drag || current.children.length === 0}
              />
            )}
            {onPaste && (
              <Button
                title="Paste"
                onPress={onPaste}
                disabled={busy || !!drag || !canPaste}
                accessibilityLabel={
                  copiedListName
                    ? `Paste contents of ${copiedListName}`
                    : 'Paste'
                }
              />
            )}
          </View>
          {canPaste && (
            <Text style={styles.editHint} numberOfLines={1}>
              Copied: {copiedListName}
            </Text>
          )}
          <Modal
            visible={renameId !== null}
            transparent
            animationType="fade"
            onRequestClose={cancelRename}
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
                  onChangeText={changeRenameText}
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
                    onPress={cancelRename}
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
