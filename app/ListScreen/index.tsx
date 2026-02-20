import React, { useState } from 'react'
import { View, Text, FlatList, Button, TouchableOpacity, TextInput, StatusBar } from 'react-native'
import { Node } from '../types'
import { getNodeAtPath } from '../utils'
import { produce } from 'immer'
import { styles } from './views'
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context'

type Props = {
  data: Node
  path: number[]
  onDataUpdate: (newData: Node) => void
  onNavigate: (newPath: number[]) => void
  onBack: () => void
  isRoot: boolean
}

const ListScreen: React.FC<Props> = ({
  data,
  path,
  onDataUpdate,
  onNavigate,
  onBack,
  isRoot,
}) => {
  const current = getNodeAtPath(data, path)
  const [newText, setNewText] = useState('')

  // if (current.type !== 'list') return null

  // const addItem = () => {
  //   if (!newText.trim()) return
  //   const updated = produce(data, (draft) => {
  //     const node = getNodeAtPath(draft, path)
  //     if (node.type === 'list') {
  //       node.children.push({ type: 'item', value: newText })
  //     }
  //   })
  //   onDataUpdate(updated)
  //   setNewText('')
  // }

  const addSublist = () => {
    if (!newText.trim()) return
    const updated = produce(data, (draft) => {
      const node = getNodeAtPath(draft, path)
      node.children.push({ name: newText, children: [] });
    })
    onDataUpdate(updated)
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar
          hidden={true}
        />
        {!isRoot && <Button title='Back' onPress={onBack} />}
        <Text style={styles.header}>{isRoot ? 'Main' : current.name}</Text>

        <FlatList
          data={current.children}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => onNavigate([...path, index])}
            >
              <Text>
                {item.name}
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
        <Button title="+ Add Item" onPress={addSublist} />

      </SafeAreaView>
    </SafeAreaProvider>
  )
}



export default ListScreen;
