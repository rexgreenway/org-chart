import * as d3 from "d3";
import { SimulationLinkDatum, SimulationNodeDatum, Simulation } from "d3";

import { useRef, useEffect, useLayoutEffect, useState } from "react";

const TEST_IMAGE =
  "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fimages.pexels.com%2Fphotos%2F2380794%2Fpexels-photo-2380794.jpeg%3Fcs%3Dsrgb%26dl%3Dpexels-kevin-bidwell-2380794.jpg%26fm%3Djpg&f=1&nofb=1&ipt=e28da8ebf542691592482e3345e9067106b14c646134c0d7b58919eb1725df6b&ipo=images";

const NODE_RADIUS = 20;

enum NodeType {
  Person = "person",
  Team = "team",
}

// Person Node cannot have children but has a picture and radius
type PersonNode = SimulationNodeDatum & {
  id: string;
  name: string;
  type: NodeType.Person;
  pictureURL: string;
  // radius is used here as r is already set by the simulation NodeDatum
  radius: number;
};

// Team Node can have children and no picture or radius
type TeamNode = SimulationNodeDatum & {
  id: string;
  name: string;
  type: NodeType.Team;
  children: PersonNode[];

  childSim?: Simulation<PersonNode, SimulationLinkDatum<PersonNode>>;
};

type Node = PersonNode | TeamNode;

const TEST_NODES: Node[] = [
  {
    id: "1",
    name: "BIG BOSS",
    type: NodeType.Person,
    pictureURL: TEST_IMAGE,
    radius: NODE_RADIUS,
  },
  {
    id: "2",
    name: "SUB BOSS",
    type: NodeType.Person,
    radius: NODE_RADIUS,
    pictureURL: TEST_IMAGE,
  },
  {
    id: "3",
    name: "A-TEAM",
    type: NodeType.Team,
    children: [
      {
        id: "3-1",
        name: "TEAM LEAD",
        type: NodeType.Person,
        pictureURL: TEST_IMAGE,
        radius: NODE_RADIUS,
      },
      {
        id: "3-2",
        name: "TEAM MEMBER",
        type: NodeType.Person,
        pictureURL: TEST_IMAGE,
        radius: NODE_RADIUS,
      },
    ],
  },
  {
    id: "4",
    name: "B-TEAM",
    type: NodeType.Team,
    children: [
      {
        id: "4-1",
        name: "HELLO",
        type: NodeType.Person,
        pictureURL: TEST_IMAGE,
        radius: NODE_RADIUS,
      },
      {
        id: "4-2",
        name: "BANANA",
        type: NodeType.Person,
        pictureURL: TEST_IMAGE,
        radius: NODE_RADIUS,
      },
      {
        id: "4-3",
        name: "OTHER",
        type: NodeType.Person,
        pictureURL: TEST_IMAGE,
        radius: NODE_RADIUS,
      },
      {
        id: "4-4",
        name: "OTHER",
        type: NodeType.Person,
        pictureURL: TEST_IMAGE,
        radius: NODE_RADIUS,
      },
    ],
  },
];

type Link = SimulationLinkDatum<Node>;

const TEST_LINKS: Link[] = [
  { source: "1", target: "2" },
  { source: "1", target: "3" },
  { source: "1", target: "4" },
];

/**
 * Network ....
 *
 */
const Network = () => {
  // divRef: references plot's container
  const divRef = useRef(null);
  // svgRef: references the d3 svg (necessary as React and D3 manipulate the DOM)
  const svgRef = useRef(null);

  // Responsive plot sizing
  const [width, SetWidth] = useState(300);
  const [height, SetHeight] = useState(300);
  const handleResize = () => {
    SetWidth(divRef.current ? divRef.current["offsetWidth"] : 300);
    SetHeight(divRef.current ? divRef.current["offsetHeight"] : 300);
  };

  // Hook watching for window resizing
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  });

  // Nested simulation: outer for top-level nodes, inner for team children
  useLayoutEffect(() => {
    handleResize();

    // COPYING DATA AS D3 MANIPULATES DATA IN PLACE
    const links = TEST_LINKS.map((d) => ({ ...d }));
    const nodes = TEST_NODES.map((d) => ({ ...d }));

    // Outer simulation for top-level nodes
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink<Node, Link>(links).id((d) => d.id)
      )
      .force("charge", d3.forceManyBody<Node>())
      // Colliding force between nodes but
      .force(
        "collide",
        d3.forceCollide<Node>(
          (d) =>
            (d.type === NodeType.Team
              ? d.children.length * NODE_RADIUS
              : NODE_RADIUS) + 20
        )
      )
      // Use forceCenter to keep the simulation centered at (0,0)
      .force("center", d3.forceCenter<Node>(0, 0));

    // For each team, create a simulation for its children
    nodes.forEach((n) => {
      if (n.type === NodeType.Team) {
        // Adding r here is necessary for this to work....?
        n.children = n.children.map((d) => ({ ...d, r: d.radius }));
        const childSim = d3
          .forceSimulation(n.children)
          .force("x", d3.forceX(0))
          .force("y", d3.forceY(0))
          .force("collide", d3.forceCollide(NODE_RADIUS + 2))
          .stop();
        for (let i = 0; i < 60; ++i) childSim.tick();
      }
    });

    // Select the svg
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // Add a line for each link
    const link = svg
      .selectAll("line")
      .data<Link>(links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2);

    // Define patterns for each node with an image
    svg.select("defs").remove();
    const defs = svg.append("defs");
    nodes.forEach((d) => {
      // Each person node -> create an image pattern
      if (d.type === NodeType.Person) {
        defs
          .append("pattern")
          .attr("id", `node-image-${d.id}`)
          .attr("width", NODE_RADIUS * 2)
          .attr("height", NODE_RADIUS * 2)
          .append("image")
          .attr("href", d.pictureURL)
          .attr("width", NODE_RADIUS * 2)
          .attr("height", NODE_RADIUS * 2);
      }
      if (d.type === NodeType.Team) {
        d.children.forEach((c) => {
          defs
            .append("pattern")
            .attr("id", `node-image-${c.id}`)
            .attr("width", NODE_RADIUS * 2)
            .attr("height", NODE_RADIUS * 2)
            .append("image")
            .attr("href", c.pictureURL)
            .attr("width", NODE_RADIUS * 2)
            .attr("height", NODE_RADIUS * 2);
        });
      }
    });

    // Join <g> for each node
    const node = svg
      .selectAll("g.node")
      .data<Node>(nodes)
      .join("g")
      .attr("class", "node");

    // For each node, update its children or self
    node.each(function (d: Node) {
      const group = d3.select(this);
      group.selectAll("circle.team-bound").remove();
      group.selectAll("text.team-label").remove();
      if (d.type === NodeType.Team) {
        // Compute bounding radius for children
        const boundingRadius = d3.packEnclose(d.children).r + 6;

        // Draw white BOUNDING CIRCLE first
        group
          .append("circle")
          .attr("class", "team-bound")
          .attr("r", boundingRadius)
          .attr("fill", "#fff")
          .attr("cx", 0)
          .attr("cy", 0);

        // Draw TEAM NAME label above the bounding circle
        group
          .append("text")
          .attr("class", "team-label")
          .attr("x", 0)
          .attr("y", -boundingRadius - 5)
          .attr("text-anchor", "middle")
          .attr("font-size", 18)
          .attr("font-family", "sans-serif")
          .attr("fill", "#333")
          .text(d.name || "");

        // Draw bubble children
        group
          .selectAll("circle.child")
          .data(d.children)
          .join("circle")
          .attr("class", "child")
          .attr("r", (d) => d.radius)
          .attr("fill", (c) =>
            c.pictureURL ? `url(#node-image-${c.id})` : "#eee"
          )
          .attr("stroke", "#e70000ff")
          .attr("stroke-width", 1.5)
          .attr("cx", (c) => c.x!)
          .attr("cy", (c) => c.y!)
          .raise();
      } else {
        group
          .selectAll("circle.child")
          .data([d])
          .join("circle")
          .attr("class", "child")
          .attr("r", (d) => d.radius)
          .attr("fill", d.pictureURL ? `url(#node-image-${d.id})` : "#eee")
          .attr("stroke", "#e70000ff")
          .attr("stroke-width", 1.5);
      }
    });

    // On each tick, update positions
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as Node).x ?? 0)
        .attr("y1", (d) => (d.source as Node).y ?? 0)
        .attr("x2", (d) => (d.target as Node).x ?? 0)
        .attr("y2", (d) => (d.target as Node).y ?? 0);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });
  }, [height, width]);

  return (
    <div
      style={{ height: "80vh", border: "solid black 2px", background: "#666" }}
      ref={divRef}
    >
      <svg className="m-auto" ref={svgRef} />
    </div>
  );
};

export default Network;
