export type ListNavigationEntry = { id: string; name: string; path: string[] };

export type ListNavigationMenuProps = {
  visible: boolean;
  entries: ListNavigationEntry[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
  onSelect: (path: string[]) => void;
};
