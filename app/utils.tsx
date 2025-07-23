import { Node } from './types'

export function getNodeAtPath(root: Node, path: number[]): Node {
  return path.reduce((node, index) => {
    if (node.type === 'list') 
        return node.children[index]
    else
        return node
  }, root)
}

export function flattenLeafPaths(node: Node, prefix: number[] = []): number[][] {
  if (node.type === 'item') 
    return [prefix]
  else
    return node.children.flatMap((child, i) =>
        flattenLeafPaths(child, [...prefix, i])
    )
}
