import * as d3 from "d3";
import { useRef, useEffect, useLayoutEffect, useState } from "react";

import {
  DEFAULT_NODE_RADIUS,
  GetNodeColour,
  Link,
  Node,
  NodeType,
} from "../types/node";

import styles from "./Network.module.css";

/**
 * Network ....
 *
 */
const Network = ({ data }: { data: { nodes: Node[]; links: Link[] } }) => {
  // Plot's DIV Ref used to responsive dimension calculation.
  const divRef = useRef(null);

  // SVG Ref maps the d3 DOM object to in React
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

  // Render the d3 Simulation on component mount.
  useLayoutEffect(() => {
    handleResize();

    // COPYING DATA AS D3 MANIPULATES DATA IN PLACE
    // Copy Data
    const links = data.links.map((l) => ({ ...l }));
    const nodes = data.nodes.map((n) => ({ ...n }));

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
              ? d.children.length * DEFAULT_NODE_RADIUS
              : DEFAULT_NODE_RADIUS) + 20
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
          .force(
            "collide",
            d3.forceCollide((d) => d.radius + 2)
          )
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

    // Each person node -> create an image pattern
    svg.select("defs").remove();
    const defs = svg.append("defs");
    nodes.forEach((d) => {
      if (d.type === NodeType.Person) {
        defs
          .append("pattern")
          .attr("id", `node-image-${d.id}`)
          .attr("width", DEFAULT_NODE_RADIUS * 2)
          .attr("height", DEFAULT_NODE_RADIUS * 2)
          .append("image")
          .attr("href", d.pictureURL)
          .attr("width", DEFAULT_NODE_RADIUS * 2)
          .attr("height", DEFAULT_NODE_RADIUS * 2);
      }
      if (d.type === NodeType.Team) {
        d.children.forEach((c) => {
          defs
            .append("pattern")
            .attr("id", `node-image-${c.id}`)
            .attr("width", DEFAULT_NODE_RADIUS * 2)
            .attr("height", DEFAULT_NODE_RADIUS * 2)
            .append("image")
            .attr("href", c.pictureURL)
            .attr("width", DEFAULT_NODE_RADIUS * 2)
            .attr("height", DEFAULT_NODE_RADIUS * 2);
        });
      }
    });

    // Group all network elements in <g> for Zoom & Pan functionality
    const g = svg
      .selectAll("g.network")
      .data([null])
      .join("g")
      .attr("class", "network");

    const link = g
      .selectAll("line")
      .data<Link>(links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2);

    // Nodes appended as g elements in order to group Teams
    const node = g
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
        const boundingRadius =
          d3.packEnclose(
            d.children.map((child) => ({
              r: child.radius,
              x: child.x!,
              y: child.y!,
            }))
          ).r + 6;

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
          .text(d.name);

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
          .attr("stroke", (d) => GetNodeColour(d.location))
          .attr("stroke-width", 3)
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
          .attr("stroke", (d) => GetNodeColour(d.location))
          .attr("stroke-width", 3);
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

    // Zoom Behaviour
    const handleZoom = (e) => {
      d3.select("g.network").attr("transform", e.transform);
    };
    svg.call(d3.zoom().on("zoom", handleZoom));
  }, [height, width]);

  return (
    <div className={styles.Network} ref={divRef}>
      <svg ref={svgRef} />
    </div>
  );
};

export default Network;
