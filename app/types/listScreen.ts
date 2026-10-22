import { ListData } from './list';

export type ListScreenProps = {
  data: ListData;
  busy?: boolean;
  onCopy?: () => void;
  onPaste?: () => void;
  canPaste?: boolean;
  copiedListName?: string;
  path: string[];
  onDataUpdate: (newData: ListData) => Promise<boolean>;
  onNavigate: (newPath: string[]) => void;
  onBack: () => void;
  isRoot: boolean;
};
