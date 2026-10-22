export type CopiedList = {
  sourceId: string;
  name: string;
  items: { id: string; parentId: string; name: string; position: number }[];
};

