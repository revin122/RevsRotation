import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ListScreen from './ListScreen';
import { ListData } from './types';
import { getRepository } from './storage';
import { setCopiedList, useCopiedList } from './listClipboard';
import { ROOT_ID } from './storage/repository';

export type RootStackParamList = { RevRotation: { path: string[] } };

export default function StoredListScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'RevRotation'>) {
  const clipboard = useCopiedList();
  const path = route.params.path;
  const id = path[path.length - 1] ?? ROOT_ID;
  const [data, setData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const generation = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const request = ++generation.current;
      setLoading(true);
      setError(null);
      getRepository()
        .then(repo => repo.loadList(id))
        .then(list => {
          if (request !== generation.current) return;
          if (!list) {
            if (id === ROOT_ID) {
              throw new Error('The main list is missing from the database.');
            }
            navigation.reset({
              index: 0,
              routes: [{ name: 'RevRotation', params: { path: [] } }],
            });
            return;
          }
          setData(list);
        })
        .catch(reason => {
          if (request === generation.current)
            setError(
              reason instanceof Error
                ? reason.message
                : 'Could not load your list.',
            );
        })
        .finally(() => {
          if (request === generation.current) setLoading(false);
        });
      return () => {
        generation.current++;
      };
    }, [id, navigation, retry]),
  );

  const save = async (next: ListData): Promise<boolean> => {
    if (!data || savingRef.current) return false;
    const request = generation.current;
    savingRef.current = true;
    setSaving(true);
    try {
      const repo = await getRepository();
      const saved = await repo.saveChildren(data, next.children);
      if (request === generation.current) setData(saved);
      return true;
    } catch (reason) {
      Alert.alert(
        'Could not save changes',
        reason instanceof Error ? reason.message : 'Please try again.',
      );
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const copyOrPaste = async (operation: 'copy' | 'paste') => {
    if (savingRef.current || !data) return;
    const request = generation.current;
    savingRef.current = true;
    setSaving(true);
    try {
      const repo = await getRepository();
      if (operation === 'copy') {
        const snapshot = await repo.copyList(id);
        setCopiedList(snapshot);
        Alert.alert(
          'List copied',
          'Open another list or sublist and tap Paste. Its existing items will be kept.',
        );
      } else if (clipboard) {
        const saved = await repo.pasteList(id, clipboard);
        if (request === generation.current) setData(saved);
      }
    } catch (reason) {
      Alert.alert(
        operation === 'copy' ? 'Could not copy list' : 'Could not paste list',
        reason instanceof Error ? reason.message : 'Please try again.',
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (loading || error || !data) {
    return (
      <View style={styles.status}>
        {loading ? (
          <>
            <ActivityIndicator />
            <Text>Loading your list…</Text>
          </>
        ) : (
          <>
            <Text accessibilityRole="alert">
              {error ?? 'List unavailable.'}
            </Text>
            <Button
              title="Retry"
              onPress={() => setRetry(value => value + 1)}
            />
            {path.length > 0 && (
              <Button title="Back" onPress={() => navigation.goBack()} />
            )}
          </>
        )}
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <ListScreen
        data={data}
        path={path}
        isRoot={path.length === 0}
        busy={saving}
        copiedListName={clipboard?.name}
        canPaste={!!clipboard?.items.length}
        onCopy={() => copyOrPaste('copy')}
        onPaste={() => copyOrPaste('paste')}
        onDataUpdate={save}
        onBack={() => navigation.goBack()}
        onNavigate={newPath =>
          navigation.push('RevRotation', { path: newPath })
        }
      />
      {saving && (
        <View style={styles.saving} pointerEvents="none">
          <Text>Working…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  status: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  saving: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    backgroundColor: 'white',
    padding: 4,
  },
});
