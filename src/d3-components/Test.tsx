import { useRef, useLayoutEffect, useState } from "react";

import * as d3 from "d3";
import { SimulationNodeDatum } from "d3";

import { NodeType, Product } from "../organisation";

interface Data extends SimulationNodeDatum {
  name: string;
  children?: this[];
}

/**
 * Bubble defines a component that renders a D3.js powered Bubble Plot given
 * children elements that satisfy the Node interface.
 *
 */
const Test = ({ data }: { data: Data }) => {
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

  // Render d3 simulation
  useLayoutEffect(() => {
    console.log("NETWORK useEFFECT", height, width);

    handleResize();
    window.addEventListener("resize", handleResize);

    // Compute the graph and start the force simulation.
    const root = d3.hierarchy(data);
    const links = root.links();
    const nodes = root.descendants();

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(10)
      )
      .force(
        "charge",
        d3.forceManyBody().strength((d) => (d.index === 0 ? -100 : -50))
      );

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // Append links.
    const link = svg
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6);

    // Append nodes.
    const node = svg
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("fill", "#000")
      .attr("r", 5);

    node.each((d) => {
      if (d.index == 0) {
        d.fx = 0;
        d.fy = 0;
      }
    });

    svg
      .append("circle")
      .attr("r", 2)
      .attr("fx", 0)
      .attr("fy", 0)
      .attr("fill", "red");

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("test", (d) => d.data.name);
    });
  }, [data, height, width]);

  return (
    <div style={{ height: "30vh", border: "solid black 2px" }} ref={divRef}>
      <svg className="m-auto" ref={svgRef} />
    </div>
  );
};

export default Test;
