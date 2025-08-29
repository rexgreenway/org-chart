import { Simulation, SimulationLinkDatum, SimulationNodeDatum } from "d3";

export const DEFAULT_NODE_RADIUS = 12;

export enum NodeType {
  Person = "person",
  Team = "team",
}

export enum NodeLocation {
  London = "London",
  Malmo = "Malmo",
}

/*
 * PersonNode defines nodes in the network representing individuals.
 */
type PersonNode = SimulationNodeDatum & {
  id: string;
  name: string;
  type: NodeType.Person;
  location?: NodeLocation;
  team?: string;
  pictureURL: string;
  // radius is used here as r is already set by the simulation NodeDatum
  radius: number;
};

/*
 * TeamNode defines nodes in the network representing teams with PersonNodes as children.
 */
type TeamNode = SimulationNodeDatum & {
  id: string;
  name: string;
  type: NodeType.Team;
  children: PersonNode[];

  childSim?: Simulation<PersonNode, SimulationLinkDatum<PersonNode>>;
};

export type Node = PersonNode | TeamNode;

export type Link = SimulationLinkDatum<Node>;

export type RawNode = {
  id: string;
  name: string;
  pictureURL: string;
  location: string;
  team?: string;
  parent?: string;
};

const GetNodesAndLinks = (data: RawNode[]): [Node[], Link[]] => {
  const nodeMap: { [key: string]: Node } = {};
  const linkMap: { [key: string]: Link } = {};

  for (const item of data) {
    const personNode: Node = {
      id: item.id,
      name: item.name,
      type: NodeType.Person,
      team: item.team,
      pictureURL: item.pictureURL,
      radius: DEFAULT_NODE_RADIUS,
      location:
        item.location === "london"
          ? NodeLocation.London
          : item.location === "malmo"
          ? NodeLocation.Malmo
          : undefined,
    };

    const link = {
      source: item.id,
      target: item.parent ? item.parent : "",
    };

    // Create Team Node with Children
    if (item.team) {
      let teamNode: Node;
      const teamID = `team-${item.team.replace(/\s+/g, "-")}`;

      if (teamID in nodeMap) {
        teamNode = nodeMap[teamID];
      } else {
        teamNode = {
          id: teamID,
          name: item.team,
          type: NodeType.Team,
          children: [],
        };
        nodeMap[teamNode.id] = teamNode;
      }

      if (teamNode.type === NodeType.Team) {
        teamNode.children.push(personNode);
      }

      // Amend link to point to team node
      if (link) {
        link.source = teamID;
      }
    }

    nodeMap[personNode.id] = personNode;

    // Only add the links that have a target
    if (link.target) {
      const linkID = `${link.source}-${link.target}`;
      linkMap[linkID] = link;
    }
  }

  // Return only top-level nodes
  const nodes = Object.values(nodeMap).filter((d) =>
    d.type === NodeType.Team ? true : !d.team
  );
  const links = Object.values(linkMap);

  return [nodes, links];
};

export { GetNodesAndLinks };
