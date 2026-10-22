import { useSyncExternalStore } from 'react';
import { getCopiedList, subscribeToClipboard } from '../models/listClipboard';

export function useCopiedList() {
  return useSyncExternalStore(subscribeToClipboard, getCopiedList);
}
