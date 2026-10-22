import { CopiedList } from '../types/clipboard';

// An app-local snapshot, retained while navigating but cleared on app restart.
let copied: CopiedList | null = null;
const listeners = new Set<() => void>();
export function setCopiedList(value: CopiedList) {
  copied = value;
  listeners.forEach(listener => listener());
}
export function subscribeToClipboard(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function getCopiedList() {
  return copied;
}
