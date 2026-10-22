import React, { useRef } from 'react';
import { PanResponder, Text, View } from 'react-native';
import { styles } from './styles';

import type { ReorderHandleProps } from '../../types/reorderHandle';

export default function ReorderHandle(props: ReorderHandleProps) {
  const latest = useRef(props);
  latest.current = props;
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => latest.current.onStart(),
      onPanResponderMove: (_, gesture) => latest.current.onMove(gesture.dy),
      onPanResponderRelease: (_, gesture) => latest.current.onEnd(gesture.dy),
      onPanResponderTerminate: () => latest.current.onCancel(),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  return (
    <View
      {...responder.panHandlers}
      style={styles.rowControl}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`Reorder ${props.name}`}
      accessibilityHint="Drag up or down. Accessibility actions move the item one position."
      accessibilityActions={[
        { name: 'increment', label: 'Move down' },
        { name: 'decrement', label: 'Move up' },
      ]}
      onAccessibilityAction={({ nativeEvent }) => {
        if (nativeEvent.actionName === 'increment') props.onStep(1);
        if (nativeEvent.actionName === 'decrement') props.onStep(-1);
      }}
    >
      <Text style={styles.handleText}>≡</Text>
    </View>
  );
}
