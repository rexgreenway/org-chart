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
