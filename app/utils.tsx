import { Node } from './types'

export function getNodeAtPath(root: Node, path: number[]): Node {
  return path.reduce((node, index) => {
    return node.children[index]
  }, root)
}

export function flattenLeafPaths(node: Node, prefix: number[] = []): number[][] {
    if (node.children.length === 0) {
        return prefix.length > 0 ? [prefix] : []
    }

    return node.children.flatMap((child, i) =>
        flattenLeafPaths(child, [...prefix, i])
    )
}
