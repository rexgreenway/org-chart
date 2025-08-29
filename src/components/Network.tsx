import * as d3 from "d3";
import { useRef, useEffect, useLayoutEffect, useState } from "react";

import {
  DEFAULT_NODE_RADIUS,
  Link,
  Node,
  NodeLocation,
  NodeType,
} from "../types/node";

import styles from "./Network.module.css";

const NAME_FONT_SIZE = 8;
const TEAM_NAME_FONT_SIZE = 14;

/**
 * Network ....
 *
 */
const Network = ({
  data,
  searchedNode,
}: {
  data: { nodes: Node[]; links: Link[] };
  searchedNode: Node | null;
}) => {
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

    // Copying Data as D3 manipulates the data in-place
    const nodes = data.nodes.map((n, i) => {
      if (n.id === "1") {
        return { ...n, fx: 0, fy: 0 };
      } else {
        // initial Circular positioning
        const angle = i * 2.4;
        const radius = 100 + i * 10;
        return {
          ...n,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        };
      }
    });
    const links = data.links.map((l) => ({ ...l }));

    // Outer simulation for top-level nodes
    const simulation = d3
      .forceSimulation(nodes)
      // LINK FORCES
      .force(
        "link",
        d3.forceLink<Node, Link>(links).id((d) => d.id)
      )
      // MANY BODY FORCES
      .force("charge", d3.forceManyBody<Node>())
      // COLLISION FORCES
      .force(
        "collide",
        d3.forceCollide<Node>((d) => {
          // Node name or Longest Node Name if Team
          const longestNamedNode =
            d.type === NodeType.Team
              ? d.children.reduce((a, b) =>
                  b.name.length > a.name.length ? b : a
                )
              : d;

          // bubble-radius = (face-radius + font-size * font-lines)
          // bounding-radius = bubble-radius * children-count
          let radius =
            DEFAULT_NODE_RADIUS +
            NAME_FONT_SIZE * longestNamedNode.name.split(" ").length;

          // Calculate the bounding circle radius including the name text height
          return (
            radius *
              (1 +
                Math.sqrt(d.type === NodeType.Team ? d.children.length : 0)) +
            50
          );
        })
      )
      // Use forceCenter to keep the simulation centered at (0,0)
      .force("center", d3.forceCenter<Node>(0, 0));

    // For each team, create a simulation for its children
    nodes.forEach((n) => {
      if (n.type === NodeType.Team) {
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

              return d.radius + NAME_FONT_SIZE * longest.name.split(" ").length;
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
      .attr("stroke", "#ffffffff")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 3);

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
      const defs = group.selectAll("defs").data([n]).join("defs");

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

      // bubble-radius = (face-radius + font-size * font-lines)
      // bounding-radius = bubble-radius * children-count
      let radius =
        DEFAULT_NODE_RADIUS +
        NAME_FONT_SIZE * longestNamedNode.name.split(" ").length;

      // Calculate the bounding circle radius including the name text height
      const boundingRadius =
        radius *
        (1 + Math.sqrt(n.type === NodeType.Team ? n.children.length : 0));

      // White Bounding Circle
      group
        .selectAll("circle.bound")
        .data([n])
        .join("circle")
        .attr("class", "bound")
        .attr(
          "r",
          n.type === NodeType.Team
            ? boundingRadius + TEAM_NAME_FONT_SIZE
            : boundingRadius
        )
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
              innerRadius: boundingRadius,
              outerRadius: boundingRadius,
              startAngle: -0.3 * Math.PI,
              endAngle: 2.3 * Math.PI,
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
              .attr("font-size", TEAM_NAME_FONT_SIZE)
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
          const childGroup = enter
            .append("g")
            .attr("class", "child")
            .attr("id", (d) => `child-${d.id}`);

          // // Actual bubble border
          // childGroup
          //   .append("circle")
          //   .attr("class", "bubble-border")
          //   .attr(
          //     "r",
          //     (d) =>
          //       d.radius + NAME_FONT_SIZE * longestNamedNode.name.split(" ").length
          //   )
          //   .attr("stroke", "green")
          //   .attr("stroke-width", 1)
          //   .attr("fill", "none");

          // Draw the circle
          childGroup
            .append("circle")
            .attr("class", (d) => {
              switch (d.location) {
                case NodeLocation.London:
                  return styles.London;
                case NodeLocation.Malmo:
                  return styles.Malmo;
                default:
                  return styles.Other;
              }
            })
            .attr("r", (d) => d.radius)
            .attr("fill", (d) => `url(#node-image-${d.id})`)
            .attr(
              "cy",
              n.type === NodeType.Team
                ? 0
                : -(NAME_FONT_SIZE * n.name.split(" ").length) / 2
            );

          // Add the name text
          childGroup
            .append("text")
            .attr("y", (d) =>
              n.type === NodeType.Team
                ? d.radius
                : d.radius - (NAME_FONT_SIZE * n.name.split(" ").length) / 2
            )
            .attr("text-anchor", "middle")
            .attr("font-size", NAME_FONT_SIZE)
            .selectAll("tspan")
            .data((d) => d.name.split(" "))
            .join("tspan")
            .attr("x", 0)
            .attr("dy", NAME_FONT_SIZE) // 14px line height
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
  }, [data, height, width]);

  // Search behaviour
  useEffect(() => {
    // Clear highlighting
    d3.selectAll(`circle.${styles.Highlighted}`).classed(
      styles.Highlighted,
      false
    );
    d3.selectAll(`line.${styles.Highlighted}`).classed(
      styles.Highlighted,
      false
    );

    let [x, y, scale] = [0, 0, 1];

    // Find the searched for node
    if (searchedNode) {
      const nodeID = searchedNode.id;

      let node = null;
      let circle = null;

      if (searchedNode.type === NodeType.Team) {
        node = d3.select(`#node-${nodeID}`);
        circle = node.select("circle.bound");
      } else {
        const childNode = d3.select(`#child-${nodeID}`);
        node = d3.select(childNode.node().parentNode);
        circle = childNode.select("circle");
      }

      circle.classed(styles.Highlighted, true);

      d3.selectAll("line")
        .filter(
          (d) =>
            (d as Link).source.id === nodeID || (d as Link).target.id === nodeID
        )
        .classed(styles.Highlighted, true);

      // Find position and move viewport here
      x = (node.datum() as Node)?.x ?? 0;
      y = (node.datum() as Node)?.y ?? 0;
      scale = 3;
    }

    // Transform the view
    const transform = d3.zoomIdentity.scale(scale).translate(-x, -y);
    const zoom = d3.zoom().on("zoom", (e) => {
      d3.select("g.network").attr("transform", e.transform);
    });
    // Use zoom.transform to update both the view and D3's internal state
    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .ease(d3.easeCubicInOut)
      .call(zoom.transform, transform);
  }, [searchedNode]);

  return (
    <div className={styles.Network} ref={divRef}>
      {!data.nodes || !data.links ? <div>Loading…</div> : <svg ref={svgRef} />}
    </div>
  );
};

export default Network;
