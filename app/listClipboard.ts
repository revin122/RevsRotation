import { useSyncExternalStore } from 'react';
import { CopiedList } from './storage/repository';

// An app-local snapshot, retained while navigating but cleared on app restart.
let copied: CopiedList | null = null;
const listeners = new Set<() => void>();
export function setCopiedList(value: CopiedList) {
  copied = value;
  listeners.forEach(listener => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function useCopiedList() {
  return useSyncExternalStore(subscribe, () => copied);
}
