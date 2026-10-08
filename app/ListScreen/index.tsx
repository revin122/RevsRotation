import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Text, FlatList, Button, TouchableOpacity, TextInput, StatusBar } from 'react-native'
import { Node } from '../types'
import { createNode, getNodeAtPath } from '../utils'
import { produce } from 'immer'
import { styles } from './views'
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context'

type Props = {
  data: Node
  path: string[]
  onDataUpdate: (newData: Node) => void
  onNavigate: (newPath: string[]) => void
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
      node.children.push(createNode(newText));
    })
    onDataUpdate(updated)
  }

  return (
    <SafeAreaProvider>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={styles.container}>
          <StatusBar
            hidden={true}
          />
          {!isRoot && <Button title='Back' onPress={onBack} />}
          <Text style={styles.header}>{isRoot ? 'Main' : current.name}</Text>

          <FlatList
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            data={current.children}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => onNavigate([...path, item.id])}
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
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  )
}



export default ListScreen;
