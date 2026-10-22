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
import ListRowItem from './ListRowItem';
import ListActionsMenu from './ListActionsMenu';

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
    changeRenameText,
  } = useListEditor(props, ROW_HEIGHT);

  return (
    <SafeAreaProvider>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        // Android uses the activity's adjustResize; avoid a second height adjustment.
        enabled={Platform.OS === 'ios'}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
              <TouchableOpacity
                style={styles.editButton}
                disabled={!!drag || busy}
                accessibilityRole="button"
                accessibilityLabel={editing ? 'Done editing' : 'List actions'}
                onPress={editing ? toggleEditing : showMenu}
              >
                <Text style={styles.backButtonText}>
                  {editing ? 'Done' : '⋯'}
                </Text>
              </TouchableOpacity>
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
            renderItem={({ item, index }) => (
              <ListRowItem
                item={item}
                index={index}
                itemCount={current.children.length}
                editing={editing}
                busy={busy}
                drag={drag}
                dragFrom={dragFrom}
                dragTo={dragTo}
                confirmDelete={confirmDelete}
                openItem={openItem}
                moveItem={moveItem}
                startDrag={startDrag}
                updateDrag={updateDrag}
                finishDrag={finishDrag}
                cancelDrag={cancelDrag}
              />
            )}
          />
          <TouchableOpacity
            style={[
              styles.rotateButton,
              (busy || !!drag || current.children.length < 2) &&
                styles.disabledControl,
            ]}
            accessibilityRole="button"
            accessibilityLabel="ROTATE"
            accessibilityHint="Moves the first item to the bottom of this list"
            accessibilityState={{
              disabled: busy || !!drag || current.children.length < 2,
            }}
            disabled={busy || !!drag || current.children.length < 2}
            onPress={rotate}
          >
            <Text style={styles.rotateButtonText}>ROTATE</Text>
          </TouchableOpacity>
          <View style={styles.addRow}>
            <TextInput
              key={inputReset.generation}
              ref={newItemInput}
              autoFocus={inputReset.focus}
              style={[styles.input, styles.addInput]}
              placeholder="Enter item text"
              value={newText}
              onChangeText={changeNewText}
              editable={!drag && !busy}
            />
            <Button
              title="+"
              accessibilityLabel="Add item"
              onPress={addSublist}
              disabled={!!drag || busy || !newText.trim()}
            />
          </View>
          <ListActionsMenu
            visible={menuVisible}
            onClose={closeMenu}
            canEdit={current.children.length > 0}
            busy={busy || !!drag}
            canPaste={canPaste}
            copiedListName={copiedListName}
            onEdit={toggleEditing}
            onCopy={onCopy}
            onPaste={onPaste}
          />
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
