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

    // Each person node -> create an image pattern
    svg.select("defs").remove();
    const defs = svg.append("defs");

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
      group.selectAll("circle.bound").remove();
      group.selectAll("text.label").remove();

      function wrapText(text: string, maxWidth: number, fontSize = 12) {
        // Simple word wrap: split by space, build lines
        const words = text.split(/\s+/);
        let lines: string[] = [];
        let line = "";
        const context = document.createElement("canvas").getContext("2d");
        context.font = `${fontSize}px sans-serif`;

        words.forEach((word) => {
          const testLine = line ? line + " " + word : word;
          const { width } = context.measureText(testLine);
          if (width > maxWidth && line) {
            lines.push(line);
            line = word;
          } else {
            line = testLine;
          }
        });
        if (line) lines.push(line);
        return lines;
      }

      if (n.type === NodeType.Team) {
        // Compute bounding radius for children
        const longest = n.children.reduce((a, b) =>
          b.name.length > a.name.length ? b : a
        );

        const boundingRadius =
          d3.packEnclose(
            n.children.map((child) => ({
              r: child.radius + LINE_HEIGHT * longest.name.split(" ").length,
              x: child.x!,
              y: child.y!,
            }))
          ).r + 20;

        // DEFS
        // Path for the team label
        defs
          .append("path")
          .attr("id", `team-arc-${n.id}`)
          .attr(
            "d",
            d3.arc()({
              innerRadius: boundingRadius - 10,
              outerRadius: boundingRadius - 10,
              startAngle: -0.25 * Math.PI,
              endAngle: 2.25 * Math.PI,
            })
          )
          .attr("stroke", "black")
          .attr("fill", "none");

        // Defs for children of team (i.e. team members)
        n.children.forEach((c) => {
          // Image patterns for team members
          defs
            .append("pattern")
            .attr("id", `node-image-${c.id}`)
            .attr("width", c.radius * 2)
            .attr("height", c.radius * 2)
            .append("image")
            .attr("href", c.pictureURL)
            .attr("width", c.radius * 2)
            .attr("height", c.radius * 2);

          // Paths for names
          defs
            .append("path")
            .attr("id", `node-arc-${c.id}`)
            .attr(
              "d",
              d3.arc()({
                innerRadius: c.radius + 4,
                outerRadius: c.radius + 4,
                startAngle: -0.5 * Math.PI,
                endAngle: 2.5 * Math.PI,
              })
            )
            .attr("stroke", "black")
            .attr("fill", "none");
        });

        // Draw white BOUNDING CIRCLE first
        group
          .append("circle")
          .attr("class", "bound")
          .attr("r", boundingRadius)
          .attr("fill", "#fff");

        // Draw TEAM NAME label above the bounding circle
        group
          .append("text")
          .attr("class", "label")
          .attr("text-anchor", "start")
          .append("textPath")
          .attr("href", `#team-arc-${n.id}`)
          .attr("startOffset", "0%")
          .text(n.name);

        // Draw bubble children
        group
          .selectAll("g.child")
          .data(n.children)
          .join("g")
          .attr("class", "child")
          .attr("transform", (d) => `translate(${d.x},${d.y})`)
          .each(function (d) {
            const childGroup = d3.select(this);

            // Draw the text beneath the circle
            const maxWidth = d.radius; // or any fixed value, e.g., 60

            // Actual buubble node border
            childGroup
              .append("circle")
              .attr("class", "bound")
              .attr(
                "r",
                d.radius + LINE_HEIGHT * longest.name.split(" ").length
              )
              .attr("fill", d.pictureURL ? `url(#node-image-${d.id})` : "#eee")
              .attr("stroke", "green")
              .attr("stroke-width", 1)
              .attr("fill", "none");

            // Draw the circle
            childGroup
              .selectAll("circle.child")
              .data([d])
              .join("circle")
              .attr("class", "child")
              .attr("r", d.radius)
              .attr("fill", d.pictureURL ? `url(#node-image-${d.id})` : "#eee")
              .attr("stroke", GetNodeColour(d.location))
              .attr("stroke-width", 3);

            childGroup
              .selectAll("text")
              .data([d])
              .join("text")
              .attr("y", d.radius)
              .attr("text-anchor", "middle")
              .attr("font-size", 12)
              .selectAll("tspan")
              .data(wrapText(d.name, maxWidth))
              .join("tspan")
              .attr("x", 0)
              .attr("dy", LINE_HEIGHT) // 14px line height
              .text((t) => t);
          })
          .raise();
      } else {
        // Calculate bounding circle radius including the name text height
        const nameTextHeight = LINE_HEIGHT * n.name.split(" ").length;
        const boundingCircleRadius = n.radius + nameTextHeight;

        // Image def
        defs
          .append("pattern")
          .attr("id", `node-image-${n.id}`)
          .attr("width", DEFAULT_NODE_RADIUS * 2)
          .attr("height", DEFAULT_NODE_RADIUS * 2)
          .append("image")
          .attr("href", n.pictureURL)
          .attr("width", DEFAULT_NODE_RADIUS * 2)
          .attr("height", DEFAULT_NODE_RADIUS * 2);

        // Name arc Def
        defs
          .append("path")
          .attr("id", `node-arc-${n.id}`)
          .attr(
            "d",
            d3.arc()({
              innerRadius: DEFAULT_NODE_RADIUS + 4,
              outerRadius: DEFAULT_NODE_RADIUS + 4,
              startAngle: -0.5 * Math.PI,
              endAngle: 2.5 * Math.PI,
            })
          )
          .attr("stroke", "black")
          .attr("fill", "none");

        // Person bounding circle
        group
          .append("circle")
          .attr("class", "bound")
          .attr("r", boundingCircleRadius + LINE_HEIGHT)
          .attr("fill", "#fff")
          .attr("cx", 0)
          .attr("cy", 0);

        // Person image circle
        group
          .selectAll("circle.child")
          .data([n])
          .join("circle")
          .attr("class", "child")
          .attr("r", (n) => n.radius)
          .attr("fill", n.pictureURL ? `url(#node-image-${n.id})` : "#eee")
          .attr("stroke", (n) => GetNodeColour(n.location))
          .attr("stroke-width", 3)
          .attr("cy", -nameTextHeight / 2)
          .raise();

        // Draw the text beneath the circle
        const maxWidth = n.radius; // or any fixed value, e.g., 60

        group
          .append("text")
          .attr("class", "label")
          .attr("y", n.radius - nameTextHeight / 2)
          .attr("text-anchor", "middle")
          .attr("font-size", 12)
          .selectAll("tspan")
          .data(wrapText(n.name, maxWidth))
          .join("tspan")
          .attr("x", 0)
          .attr("dy", LINE_HEIGHT)
          .text((t) => t);
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
