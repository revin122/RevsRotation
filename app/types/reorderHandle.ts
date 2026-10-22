export type ReorderHandleProps = {
  name: string;
  onStart: () => void;
  onMove: (distance: number) => void;
  onEnd: (distance: number) => void;
  onCancel: () => void;
  onStep: (direction: number) => void;
};

