
export type Node = { type: 'item'; value: string } | { type: 'list'; children: Node[] };
