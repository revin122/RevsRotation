import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ListRowItemProps } from '../../types/listRowItem';
import { styles, ROW_HEIGHT } from './styles';
import ReorderHandle from './ReorderHandle';

export default function ListRowItem({
  item,
  index,
  itemCount,
  editing,
  busy,
  drag,
  dragFrom,
  dragTo,
  confirmDelete,
  openItem,
  moveItem,
  startDrag,
  updateDrag,
  finishDrag,
  cancelDrag,
}: ListRowItemProps) {
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
          accessibilityLabel={`${editing ? 'Rename' : 'Open'} ${item.name}`}
          onPress={() => openItem(item)}
        >
          <View style={styles.itemLabel}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.name}
            </Text>
            {!editing && (
              <Text style={styles.chevron} accessible={false}>
                ›
              </Text>
            )}
          </View>
        </TouchableOpacity>
        {editing && (
          <TouchableOpacity
            style={styles.rowControl}
            disabled={!!drag || busy || index === itemCount - 1}
            accessibilityRole="button"
            accessibilityLabel={`Move ${item.name} to bottom`}
            accessibilityState={{
              disabled: !!drag || busy || index === itemCount - 1,
            }}
            onPress={() => moveItem(item.id, itemCount - 1 - index)}
          >
            <Text
              style={[
                styles.moveBottomText,
                (busy || !!drag || index === itemCount - 1) &&
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
            onMove={distance => updateDrag(item.id, index, distance)}
            onEnd={distance => finishDrag(item.id, distance)}
            onCancel={cancelDrag}
            onStep={direction => moveItem(item.id, direction)}
          />
        )}
      </View>
    </View>
  );
}
