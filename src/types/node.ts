import {
  hierarchy,
  HierarchyLink,
  HierarchyNode,
  SimulationLinkDatum,
  SimulationNodeDatum,
} from "d3";

export type Node = SimulationNodeDatum & {
  id: number | string;
  name: string;
  picture_url?: string;
  team?: string;
  parent?: number;
  children?: Node[];
  r?: number; // Radius for collision detection
};

/**
 * Builds a hierarchical tree structure from a flat array of nodes.
 *
 * Each node in the input array should have an `id` and may have a `parent` property
 * referencing the `id` of its parent node. The function organizes nodes into a tree
 * by assigning children to their respective parent nodes. The root node is identified
 * as the node without a parent or whose parent is not present in the array.
 *
 * @param nodes - An array of `Node` objects representing the flat list of nodes.
 * @returns The root `Node` of the constructed tree, or `null` if no root is found.
 */
const buildTree = (nodes: Node[]): Record<number, Node> => {
  const nodeMap: Record<number | string, Node> = {};
  const roots: Record<number | string, Node> = {};

  // Type: Person vs. Team
  // Need to add team Nodes to group people at the bottom of the hierarchy

  nodes.forEach((node) => {
    nodeMap[node.id] = node;

    // if node has a team:
    // 1. Create a new team node entry
    // 2. Add the team

    if (node.parent && nodeMap[node.parent]) {
      const children = nodeMap[node.parent].children;
      if (children) {
        children.push(node);
      } else {
        nodeMap[node.parent].children = [node];
      }
    } else {
      roots[node.id] = node;
    }
  });

  return roots;
};

const GetNodesAndLinks = (
  data: Node[]
): [Node[], SimulationLinkDatum<Node>[]] => {
  const roots = buildTree(data);

  const nodes: HierarchyNode<Node>[] = [];
  const links: HierarchyLink<Node>[] = [];

  Object.values(roots).forEach((rootNode) => {
    const root = hierarchy(rootNode);
    nodes.push(...root.descendants());
    links.push(...root.links());
  });

  const transformedNodes = nodes.map((n) => ({
    id: n.data.id,
    name: n.data.name,
    picture_url: n.data.picture_url,
    team: n.data.team,
    parent: n.data.parent,
  }));
  const transformedLinks = links.map((l) => ({
    source: l.source.data.id,
    target: l.target.data.id,
  }));

  return [transformedNodes, transformedLinks];
};

export { GetNodesAndLinks };
