import React from 'react';
import {
  ActivityIndicator,
  Button,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListNavigationMenuProps } from '../../types/listNavigation';

export default function ListNavigationMenu({
  visible,
  entries,
  loading,
  error,
  onClose,
  onRetry,
  onSelect,
}: ListNavigationMenuProps) {
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
          accessibilityLabel="Dismiss list navigation"
        />
        <View style={styles.panel} accessibilityViewIsModal>
          <Text style={styles.heading} accessibilityRole="header">
            Go to list
          </Text>
          <ScrollView>
            {loading && (
              <ActivityIndicator
                accessibilityLabel="Loading list navigation"
                style={styles.status}
              />
            )}
            {error && (
              <View style={styles.status}>
                <Text accessibilityRole="alert">{error}</Text>
                <Button title="Retry" onPress={onRetry} />
              </View>
            )}
            {!loading &&
              !error &&
              entries.map((entry, index) => {
                const current = index === entries.length - 1;
                return (
                  <TouchableOpacity
                    key={entry.id}
                    style={[
                      styles.row,
                      { paddingLeft: 16 + Math.min(index, 5) * 12 },
                    ]}
                    disabled={current}
                    accessibilityRole="button"
                    accessibilityLabel={
                      current
                        ? `${entry.name}, current list`
                        : `Go to ${entry.name}`
                    }
                    accessibilityState={{
                      selected: current,
                      disabled: current,
                    }}
                    onPress={() => onSelect(entry.path)}
                  >
                    <Text style={[styles.label, current && styles.current]}>
                      {index > 0 ? '› ' : ''}
                      {entry.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
          <Button title="Cancel" onPress={onClose} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  panel: {
    width: 340,
    maxWidth: '100%',
    maxHeight: '85%',
    marginTop: 12,
    paddingBottom: 8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  heading: { fontSize: 18, fontWeight: '600', color: '#222', padding: 16 },
  status: { padding: 16 },
  row: {
    minHeight: 48,
    paddingVertical: 14,
    paddingRight: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
  },
  label: { fontSize: 17, color: '#007AFF' },
  current: { color: '#333', fontWeight: '600' },
});
