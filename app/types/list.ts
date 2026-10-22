export type Node = {
  id: string;
  name: string;
  children: Node[];
};

// A loaded list contains only its immediate children, not the entire tree.
export type ListItem = {
  id: string;
  name: string;
  hasChildren: boolean;
};

export type ListData = {
  id: string;
  name: string;
  children: ListItem[];
};
