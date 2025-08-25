import * as d3 from "d3";
import {
  SimulationNodeDatum,
  SimulationLinkDatum,
  HierarchyNode,
  HierarchyLink,
} from "d3";

import { useRef, useLayoutEffect, useState } from "react";

import { Node } from "../types/node";

/**
 * Network ....
 *
 */
const Network = ({ data }: { data: Record<number, Node> }) => {
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
    // console.log("NETWORK useEFFECT", height, width);

    handleResize();
    window.addEventListener("resize", handleResize);

    // Iterate through the root nodes and build nodes and links:
    const nodes: (HierarchyNode<Node> & SimulationNodeDatum)[] = [];
    const links: (HierarchyLink<Node> &
      SimulationLinkDatum<SimulationNodeDatum>)[] = [];
    Object.values(data).forEach((node) => {
      const root = d3.hierarchy(node);
      nodes.push(...root.descendants());
      links.push(...root.links());
    });

    const simulation = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(links).distance(0).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("x", d3.forceX())
      .force("y", d3.forceY());

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // CLIP PATH STUFF FOR IMAGES: https://css-tricks.com/scale-svg/
    // svg
    //   .append("defs")
    //   .append("clipPath")
    //   .attr("id", "circleView")
    //   .append("circle")
    //   // .attr("cx", "120")
    //   // .attr("cy", "120")
    //   .attr("r", "5");

    // Append links.
    const link = svg
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6);

    // Append nodes.
    const node = svg
      .selectAll("g")
      .data(nodes)
      .join(
        (enter) => {
          // HERE CREATE THE ""NODE""

          // enter = enter.filter((d) => {
          //   console.log(d);
          //   return d.data.type === "person";
          // });
          // const g = enter.append("g");
          // .attr("fx", 0)
          // .attr("fy", 0)
          // .classed("fixed", d => d.fx !== undefined);

          // CENTRAL IMAGE
          // g.append("image")
          //   .attr("xlink:href", URL)
          //   .attr("clip-path", "url(#circleView)")
          //   .attr("r", 5);

          // g.append("circle").attr("fill", "#000").attr("r", 5);

          // g.append("circle")
          //   .attr("fill", "none")
          //   .attr("stroke", "#000")
          //   .attr("r", 8);

          // g.append("text").text((d) => d.data.name);

          // return g;
          return enter
            .append("circle")
            .attr("fill", "#000")
            .attr("r", 5)
            .attr("fx", (d) => (d.index === 0 ? 0 : null))
            .attr("fy", (d) => (d.index === 0 ? 0 : null))
            .classed("fixed", (d) => d.fx !== undefined);
        },
        (update) => update,
        (exit) => exit.transition().duration(500).attr("r", 0).remove()
      );

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

      // Move all circles
      // node
      //   .selectChildren("circle")
      //   .attr("cx", (d) => d.x)
      //   .attr("cy", (d) => d.y);

      // // Move associated text
      // node
      //   .selectChildren("text")
      //   .attr("x", (d) => d.x)
      //   .attr("y", (d) => d.y);

      // node
      //   .attr("fx", (d) => (d.index === 0 ? 0 : undefined))
      //   .attr("fy", (d) => (d.index === 0 ? 0 : undefined));

      node
        .attr("cx", (d) => (d.index === 0 ? d.fx : d.x))
        .attr("cy", (d) => (d.index === 0 ? d.fx : d.y))
        .attr("test", (d) => d.data.name);

      // node
      //   .attr("fx", (d) => (d.index === 0 ? 0 : null))
      //   .attr("fy", (d) => (d.index === 0 ? 0 : null));

      // Way of moving/transforming entire group 'g'
      // node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });
  }, [data, height, width]);

  return (
    <div style={{ height: "30vh", border: "solid black 2px" }} ref={divRef}>
      <svg className="m-auto" ref={svgRef} />
    </div>
  );
};

export default Network;
