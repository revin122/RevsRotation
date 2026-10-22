import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { ListData } from '../types/list';
import { getRepository } from '../models/storage';
import { ROOT_ID } from '../models/storage/repository';
import { setCopiedList } from '../models/listClipboard';
import { useCopiedList } from './useCopiedList';

export function useStoredListController({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'RevRotation'>) {
  const clipboard = useCopiedList();
  const [notice, setNotice] = useState<{ text: string } | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(timer);
  }, [notice]);
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
        setNotice({ text: 'List copied' });
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

  return {
    notice: notice?.text,
    data,
    loading,
    error,
    saving,
    path,
    retry: () => setRetry(value => value + 1),
    back: () => navigation.goBack(),
    navigate: (newPath: string[]) =>
      navigation.push('RevRotation', { path: newPath }),
    save,
    copy: () => copyOrPaste('copy'),
    paste: () => copyOrPaste('paste'),
    copiedListName: clipboard?.name,
    canPaste: !!clipboard?.items.length,
  };
}
