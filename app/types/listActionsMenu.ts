export type ListActionsMenuProps = {
  visible: boolean;
  onClose: () => void;
  busy: boolean;
  canEdit: boolean;
  canPaste: boolean;
  copiedListName?: string;
  onEdit: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
};
