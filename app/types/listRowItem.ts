import { ListItem } from './list';

export type ListRowItemProps = {
  item: ListItem;
  index: number;
  itemCount: number;
  editing: boolean;
  busy: boolean;
  drag: { id: string; distance: number } | null;
  dragFrom: number;
  dragTo: number;
  confirmDelete: (item: ListItem) => void;
  openItem: (item: ListItem) => void;
  moveItem: (id: string, steps: number) => void;
  startDrag: (id: string) => void;
  updateDrag: (id: string, index: number, distance: number) => void;
  finishDrag: (id: string, distance: number) => void;
  cancelDrag: () => void;
};
