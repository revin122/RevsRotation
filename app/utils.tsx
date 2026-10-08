import { Node } from './types'

let nextNodeId = 0

export function createNode(name: string): Node {
  nextNodeId += 1
  return { id: `node-${Date.now()}-${nextNodeId}`, name, children: [] }
}

export function getNodeAtPath(root: Node, path: string[]): Node {
  return path.reduce((node, id) => {
    const child = node.children.find(item => item.id === id)
    if (!child) {
      throw new Error(`Node not found at path: ${path.join('/')}`)
    }
    return child
  }, root)
}

export function flattenLeafPaths(node: Node, prefix: string[] = []): string[][] {
    if (node.children.length === 0) {
        return prefix.length > 0 ? [prefix] : []
    }

    return node.children.flatMap(child =>
        flattenLeafPaths(child, [...prefix, child.id])
    )
}
