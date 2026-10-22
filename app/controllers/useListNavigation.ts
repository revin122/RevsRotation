import { useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { ListNavigationEntry } from '../types/listNavigation';
import { getRepository } from '../models/storage';

export function useListNavigation({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'RevRotation'>) {
  const [visible, setVisible] = useState(false);
  const [entries, setEntries] = useState<ListNavigationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );

  const close = () => {
    generation.current++;
    setVisible(false);
  };
  const open = async () => {
    const path = route.params.path;
    if (!path.length) return;
    Keyboard.dismiss();
    const request = ++generation.current;
    setVisible(true);
    setLoading(true);
    setError(null);
    setEntries([]);
    try {
      const repo = await getRepository();
      const lists = await Promise.all(path.map(id => repo.loadList(id)));
      if (request !== generation.current) return;
      if (lists.some(list => !list))
        throw new Error('A list in this path is no longer available.');
      setEntries([
        { id: 'root', name: 'Main', path: [] },
        ...lists.map((list, index) => ({
          id: list!.id,
          name: list!.name,
          path: path.slice(0, index + 1),
        })),
      ]);
    } catch (reason) {
      if (request === generation.current)
        setError(
          reason instanceof Error
            ? reason.message
            : 'Could not load navigation.',
        );
    } finally {
      if (request === generation.current) setLoading(false);
    }
  };
  const select = (path: string[]) => {
    if (
      path.length >= route.params.path.length ||
      !path.every((id, index) => id === route.params.path[index])
    )
      return;
    close();
    // Rebuild the ancestor stack so Back continues toward Main after a jump.
    navigation.reset({
      index: path.length,
      routes: Array.from({ length: path.length + 1 }, (_, index) => ({
        name: 'RevRotation',
        params: { path: path.slice(0, index) },
      })),
    });
  };
  return { visible, entries, loading, error, open, close, select };
}
