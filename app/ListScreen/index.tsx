import React, { useState } from 'react'
import { View, Text, FlatList, Button, TouchableOpacity, TextInput, StyleSheet } from 'react-native'
import { Node } from '../types'
import { getNodeAtPath } from '../utils'
import { produce } from 'immer'
import { styles } from './views'

type Props = {
  data: Node
  path: number[]
  onDataUpdate: (newData: Node) => void
  onNavigate: (newPath: number[]) => void
  onBack: () => void
  isRoot: boolean
  onNextLeaf: () => void
  onPrevLeaf: () => void
  leafIndex: number
  maxLeafIndex: number
};

const ListScreen: React.FC<Props> = ({
  data,
  path,
  onDataUpdate,
  onNavigate,
  onBack,
  isRoot,
  onNextLeaf,
  onPrevLeaf,
  leafIndex,
  maxLeafIndex
}) => {
  const current = getNodeAtPath(data, path)
  const [newText, setNewText] = useState('')

  if (current.type !== 'list') return null

  const addItem = () => {
    if (!newText.trim()) return
    const updated = produce(data, (draft) => {
      const node = getNodeAtPath(draft, path)
      if (node.type === 'list') {
        node.children.push({ type: 'item', value: newText })
      }
    })
    onDataUpdate(updated)
    setNewText('')
  }

  const addSublist = () => {
    const updated = produce(data, (draft) => {
      const node = getNodeAtPath(draft, path)
      if (node.type === 'list') {
        node.children.push({ type: 'list', children: [] });
      }
    })
    onDataUpdate(updated)
  }

  return (
    <View style={styles.container}>
      {!isRoot && <Button title="🔙 Back" onPress={onBack} />}
      <Text style={styles.header}>📂 Current List</Text>

      <FlatList
        data={current.children}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => item.type === 'list' && onNavigate([...path, index])}
          >
            <Text>
              {item.type === 'list'
                ? `Sublist ${index + 1}`
                : `${item.value}`}
            </Text>
          </TouchableOpacity>
        )}
      />

      <TextInput
        style={styles.input}
        placeholder="Enter item text"
        value={newText}
        onChangeText={setNewText}
      />
      <Button title="+ Add Item" onPress={addItem} />
      <Button title="+ Add Sublist" onPress={addSublist} />

      <View style={styles.navButtons}>
        <Button title="Prev" onPress={onPrevLeaf} disabled={leafIndex === 0} />
        <Button title="Next" onPress={onNextLeaf} disabled={leafIndex >= maxLeafIndex} />
      </View>
    </View>
  );
};



export default ListScreen;
