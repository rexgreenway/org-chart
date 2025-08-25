import * as d3 from "d3";
import { SimulationLinkDatum, SimulationNodeDatum, Simulation } from "d3";

import { useRef, useEffect, useLayoutEffect, useState } from "react";

import { Node as BaseNode } from "../types/node";

// Extend Node type for simulation
type SimNode = BaseNode & {
  r: number;
  type?: string;
  children?: SimNode[];
  childSim?: Simulation<SimNode, undefined>;
  x?: number;
  y?: number;
};

export type Node = SimulationNodeDatum & {
  id: number | string;
  name: string;
  picture_url?: string;
  team?: string;

  parent?: number;

  children?: Node[];
  childSim?: Simulation<Node, undefined>;
  r: number;
};

/**
 * Network ....
 *
 */
const Simple = ({
  data,
}: {
  data: {
    nodes: SimNode[];
    links: SimulationLinkDatum<SimNode>[];
  };
}) => {
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

  const nodeRadius = 20;

  const TEST_IMAGE =
    "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fimages.pexels.com%2Fphotos%2F2380794%2Fpexels-photo-2380794.jpeg%3Fcs%3Dsrgb%26dl%3Dpexels-kevin-bidwell-2380794.jpg%26fm%3Djpg&f=1&nofb=1&ipt=e28da8ebf542691592482e3345e9067106b14c646134c0d7b58919eb1725df6b&ipo=images";
  const testData = {
    nodes: [
      {
        id: "1",
        name: "BIG BOSS",
        type: "person",
        picture_url: TEST_IMAGE,
        r: nodeRadius,
      },
      {
        id: "2",
        name: "SUB BOSS",
        type: "person",
        r: nodeRadius,
        picture_url: TEST_IMAGE,
      },
      {
        id: "3",
        name: "A-TEAM",
        type: "team",
        children: [
          {
            id: "3-1",
            name: "TEAM LEAD",
            type: "person",
            picture_url: TEST_IMAGE,
            r: nodeRadius,
          },
          {
            id: "3-2",
            name: "TEAM MEMBER",
            type: "person",
            picture_url: TEST_IMAGE,
            r: nodeRadius,
          },
        ],
      },
      {
        id: "4",
        name: "B-TEAM",
        type: "team",
        children: [
          {
            id: "4-1",
            name: "HELLO",
            type: "person",
            picture_url: TEST_IMAGE,
            r: nodeRadius,
          },
          {
            id: "4-2",
            name: "BANANA",
            type: "person",
            picture_url: TEST_IMAGE,
            r: nodeRadius,
          },
          {
            id: "4-3",
            name: "OTHER",
            type: "person",
            picture_url: TEST_IMAGE,
            r: nodeRadius,
          },
          {
            id: "4-4",
            name: "OTHER",
            type: "person",
            picture_url: TEST_IMAGE,
            r: nodeRadius,
          },
        ],
      },
    ],
    links: [
      { source: "1", target: "2" },
      { source: "1", target: "3" },
      { source: "1", target: "4" },
    ],
  };

  // Nested simulation: outer for top-level nodes, inner for team children
  useLayoutEffect(() => {
    handleResize();

    // Prepare data
    const links: SimulationLinkDatum<SimNode>[] = testData.links.map((d) => ({
      ...d,
    }));
    // Top-level nodes (teams and people)
    const nodes: SimNode[] = testData.nodes.map((d) => ({
      ...d,
      r: nodeRadius,
    }));

    // Outer simulation for top-level nodes
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimulationLinkDatum<SimNode>>(links)
          .id((d) => d.id)
      )
      .force("charge", d3.forceManyBody<SimNode>().strength(nodeRadius))
      .force(
        "collide",
        d3.forceCollide<SimNode>(
          (d) =>
            (d.type === "team"
              ? (d.children?.length || 1) * nodeRadius
              : nodeRadius) + 20
        )
      )
      // Use forceCenter to keep the simulation centered at (0,0)
      .force("center", d3.forceCenter(0, 0));

    // For each team, create a simulation for its children
    nodes.forEach((n) => {
      if (n.children && Array.isArray(n.children)) {
        n.children = n.children.map((c, i) => ({
          ...c,
          r: nodeRadius,
        }));
        // Simulate children in a small cluster around the team node
        (n as any).childSim = d3
          .forceSimulation(n.children)
          .force("x", d3.forceX(0))
          .force("y", d3.forceY(0))
          // .force("center", d3.forceCenter(n.x, n.y))
          .force("collide", d3.forceCollide(nodeRadius + 2))
          .stop();
        for (let i = 0; i < 60; ++i) (n as any).childSim.tick();
      }
    });

    // Select the svg
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto;")
      .attr("fill", "#838383ff");

    // Add background
    let bgRect = svg.select("rect");
    if (bgRect.empty()) {
      bgRect = svg.insert("rect", ":first-child");
    }
    bgRect
      .attr("x", -width / 2)
      .attr("y", -height / 2)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#666");

    // Select existing <g> or append if not present
    let linkGroup: any = svg.select("g.links");
    if (linkGroup.empty()) {
      linkGroup = svg.append("g").attr("class", "links");
    }

    let nodeGroup: any = svg.select("g.nodes");
    if (nodeGroup.empty()) {
      nodeGroup = svg.append("g").attr("class", "nodes");
    }

    // Add a line for each link
    const link = linkGroup
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", Math.sqrt(2));

    // Define patterns for each node with an image
    svg.select("defs").remove();
    const defs = svg.append("defs");
    nodes.forEach((d) => {
      if (d.picture_url) {
        defs
          .append("pattern")
          .attr("id", `node-image-${d.id}`)
          .attr("patternUnits", "objectBoundingBox")
          .attr("width", nodeRadius * 2)
          .attr("height", nodeRadius * 2)
          .append("image")
          .attr("href", d.picture_url)
          .attr("width", nodeRadius * 2)
          .attr("height", nodeRadius * 2)
          .attr("x", 0)
          .attr("y", 0);
      }
      if (d.children) {
        d.children.forEach((c) => {
          if (c.picture_url) {
            defs
              .append("pattern")
              .attr("id", `node-image-${c.id}`)
              .attr("patternUnits", "objectBoundingBox")
              .attr("width", nodeRadius * 2)
              .attr("height", nodeRadius * 2)
              .append("image")
              .attr("href", c.picture_url)
              .attr("width", nodeRadius * 2)
              .attr("height", nodeRadius * 2)
              .attr("x", 0)
              .attr("y", 0);
          }
        });
      }
    });

    // Join <g> for each node
    const node = nodeGroup
      .selectAll("g.node")
      .data(nodes)
      .join((enter: any) => {
        const g = enter.append("g").attr("class", "node");
        return g;
      });

    // For each node, update its children or self
    node.each(function (d: SimNode) {
      const group = d3.select(this as any);
      group.selectAll("circle.team-bound").remove();
      group.selectAll("text.team-label").remove();
      if (d.children && Array.isArray(d.children)) {
        // Compute bounding radius for children
        const boundingRadius = d3.packEnclose(d.children).r + 6;

        // Draw BOUNDING CIRCLE first
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

        // Draw children
        group
          .selectAll("circle.child")
          .data(d.children)
          .join("circle")
          .attr("class", "child")
          .attr("r", nodeRadius)
          .attr("fill", (c: any) =>
            c.picture_url ? `url(#node-image-${c.id})` : "#eee"
          )
          .attr("stroke", "#e70000ff")
          .attr("stroke-width", 1.5)
          .attr("cx", (c) => c.x)
          .attr("cy", (c) => c.y)
          .raise();
      } else {
        group
          .selectAll("circle.child")
          .data([d])
          .join("circle")
          .attr("class", "child")
          .attr("r", nodeRadius)
          .attr("fill", d.picture_url ? `url(#node-image-${d.id})` : "#eee")
          .attr("stroke", "#e70000ff")
          .attr("stroke-width", 1.5);
      }
    });

    // On each tick, update positions
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);

      // // Tick all child simulations
      // nodes.forEach((n) => {
      //   if (n.childSim) n.childSim.tick();
      // });
    });
  }, [data, height, width]);

  return (
    <div style={{ height: "80vh", border: "solid black 2px" }} ref={divRef}>
      <svg className="m-auto" ref={svgRef} />
    </div>
  );
};

export default Simple;
