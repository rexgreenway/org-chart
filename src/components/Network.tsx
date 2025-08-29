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

const LINE_HEIGHT = 8;

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
        d3
          .forceLink<Node, Link>(links)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody<Node>())
      // Colliding force between nodes but
      .force(
        "collide",
        d3.forceCollide<Node>((d) => {
          if (d.type === NodeType.Team) {
            const longest = d.children.reduce((a, b) =>
              b.name.length > a.name.length ? b : a
            );
            return (
              DEFAULT_NODE_RADIUS +
              LINE_HEIGHT * longest.name.split(" ").length * 2.5
            );
          } else {
            return (
              d.radius + LINE_HEIGHT * d.name.split(" ").length * 2.5 * 2.5
            );
          }
        })
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
          .force("center", d3.forceCenter<Node>(0, 0))
          .force(
            "collide",
            d3.forceCollide((d) => {
              const longest = n.children.reduce((a, b) =>
                b.name.length > a.name.length ? b : a
              );

              return d.radius + LINE_HEIGHT * longest.name.split(" ").length;
            })
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
      .attr("class", "node")
      .attr("id", (d) => `node-${d.id}`);

    // For each node, update its children or self
    node.each(function (n: Node) {
      const group = d3.select(this);

      // Create DEFS
      const defs = group
        .selectAll("defs")
        .data([n])
        .join("defs")
        .attr("id", `node-${n.id}`);

      defs
        .selectAll("pattern")
        .data(n.type === NodeType.Team ? n.children : [n])
        .join((enter) =>
          enter
            .append("pattern")
            .attr("id", (d) => `node-image-${d.id}`)
            .attr("width", (d) => d.radius * 2)
            .attr("height", (d) => d.radius * 2)
            .append("image")
            .attr("href", (d) => d.pictureURL)
            .attr("width", (d) => d.radius * 2)
            .attr("height", (d) => d.radius * 2)
        );

      // Node name or Longest Node Name if Team
      const longestNamedNode =
        n.type === NodeType.Team
          ? n.children.reduce((a, b) => (b.name.length > a.name.length ? b : a))
          : n;

      // Calculate the bounding circle radius including the name text height
      let boundingRadius = 0;
      if (n.type === NodeType.Team) {
        boundingRadius = d3.packEnclose(
          n.children.map((child) => ({
            r:
              child.radius +
              LINE_HEIGHT * longestNamedNode.name.split(" ").length,
            x: child.x!,
            y: child.y!,
          }))
        ).r;
      } else {
        boundingRadius =
          n.radius + longestNamedNode.name.split(" ").length * LINE_HEIGHT;
      }

      // White Bounding Circle
      group
        .selectAll("circle.bound")
        .data([n])
        .join("circle")
        .attr("class", "bound")
        .attr("r", boundingRadius)
        .attr("fill", "#fff")
        .attr("cx", 0)
        .attr("cy", 0);

      //  TEAM Specific Elements
      if (n.type === NodeType.Team) {
        defs
          .selectAll("path")
          .data([n])
          .join("path")
          .attr("id", `team-arc-${n.id}`)
          .attr(
            "d",
            d3.arc()({
              innerRadius: boundingRadius - LINE_HEIGHT,
              outerRadius: boundingRadius - LINE_HEIGHT,
              startAngle: -0.25 * Math.PI,
              endAngle: 2.25 * Math.PI,
            })
          )
          .attr("stroke", "black")
          .attr("fill", "none");

        // Draw TEAM NAME label above the bounding circle
        group
          .selectAll("text.team-name")
          .data([n])
          .join((enter) =>
            enter
              .append("text")
              .attr("class", "team-name")
              .attr("text-anchor", "start")
              .append("textPath")
              .attr("href", `#team-arc-${n.id}`)
              .attr("startOffset", "0%")
              .text(n.name)
          );
      }

      // Draw People
      group
        .selectAll("g.child")
        .data(n.type === NodeType.Team ? n.children : [n])
        .join((enter) => {
          // Create the Child Group
          const childGroup = enter.append("g").attr("class", "child");

          // Actual bubble border !!! TO BE REMOVED
          childGroup
            .append("circle")
            .attr("class", "bubble-border")
            .attr(
              "r",
              (d) =>
                d.radius + LINE_HEIGHT * longestNamedNode.name.split(" ").length
            )
            .attr("stroke", "green")
            .attr("stroke-width", 1)
            .attr("fill", "none");

          // Draw the circle
          childGroup
            .append("circle")
            .attr("class", "person")
            .attr("r", (d) => d.radius)
            .attr("fill", (d) => `url(#node-image-${d.id})`)
            .attr("stroke", (d) => GetNodeColour(d.location))
            .attr("stroke-width", 3)
            .attr(
              "cy",
              n.type === NodeType.Team
                ? 0
                : -(LINE_HEIGHT * n.name.split(" ").length) / 2
            );

          // Add the name text
          childGroup
            .append("text")
            .attr("y", (d) =>
              n.type === NodeType.Team
                ? d.radius
                : d.radius - (LINE_HEIGHT * n.name.split(" ").length) / 2
            )
            .attr("text-anchor", "middle")
            .selectAll("tspan")
            .data((d) => d.name.split(" "))
            .join("tspan")
            .attr("x", 0)
            .attr("dy", LINE_HEIGHT) // 14px line height
            .text((t) => t);

          if (n.type === NodeType.Team) {
            childGroup.attr("transform", (d) => `translate(${d.x},${d.y})`);
          }

          return childGroup;
        })
        .raise();
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
    const zoom = d3.zoom().on("zoom", (e) => {
      d3.select("g.network").attr("transform", e.transform);
    });
    svg.call(zoom);

    // Search Behaviour
    const handleSearch = async () => {
      console.log("search started");
      await new Promise((r) => setTimeout(r, 5000));
      console.log("timeout finished");
      console.log("node pos", nodes[2]);

      // Calculate the transform you want
      const scale = 3;
      const x = nodes[2].x ?? 0;
      const y = nodes[2].y ?? 0;
      console.log(x, y);
      const transform = d3.zoomIdentity.translate(x, y).scale(scale);

      // Use zoom.transform to update both the view and D3's internal state
      svg
        .transition()
        .duration(750)
        .ease(d3.easeCubicInOut)
        .call(zoom.transform, transform);
    };
    svg.call(handleSearch);
  }, [height, width]);

  return (
    <div className={styles.Network} ref={divRef}>
      <svg ref={svgRef} />
    </div>
  );
};

export default Network;
