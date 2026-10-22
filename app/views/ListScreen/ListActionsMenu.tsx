import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListActionsMenuProps } from '../../types/listActionsMenu';

export default function ListActionsMenu({
  visible,
  onClose,
  busy,
  canEdit,
  canPaste,
  copiedListName,
  onEdit,
  onCopy,
  onPaste,
}: ListActionsMenuProps) {
  const actions = [
    ...(canEdit
      ? [{ label: 'Edit List', disabled: busy, action: onEdit }]
      : []),
    {
      label: 'Copy List',
      disabled: busy || !canEdit || !onCopy,
      action: onCopy,
    },
    {
      label: 'Paste List',
      disabled: busy || !canPaste || !onPaste,
      action: onPaste,
    },
  ];
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss list actions"
        />
        <View style={styles.panel} accessibilityViewIsModal>
          <ScrollView>
            <Text style={styles.heading} accessibilityRole="header">
              List actions
            </Text>
            {actions.map(({ label, disabled, action }) => (
              <TouchableOpacity
                key={label}
                style={styles.action}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={() => {
                  onClose();
                  action?.();
                }}
              >
                <Text style={[styles.label, disabled && styles.disabled]}>
                  {label}
                </Text>
                {label === 'Paste List' && canPaste && (
                  <Text style={styles.detail} numberOfLines={1}>
                    From {copiedListName}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.action}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close list actions"
            >
              <Text style={styles.label}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
  },
  panel: {
    width: 260,
    maxWidth: '100%',
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  heading: { fontSize: 15, color: '#555', padding: 16 },
  action: {
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
  },
  label: { fontSize: 17, color: '#007AFF' },
  disabled: { color: '#999' },
  detail: { fontSize: 13, color: '#666', marginTop: 4 },
});
