import * as d3 from "d3";
import { SimulationLinkDatum } from "d3";

import { useRef, useEffect, useLayoutEffect, useState } from "react";

import { Node } from "../types/node";

/**
 * Network ....
 *
 */
const Network = ({
  data,
}: {
  data: {
    nodes: Node[];
    links: SimulationLinkDatum<Node>[];
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

  const color = d3.scaleOrdinal(d3.schemeCategory10);

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
      },
      {
        id: "2",
        name: "SUB BOSS",
        type: "person",
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
    ],
    links: [
      { source: "1", target: "2" },
      { source: "1", target: "3" },
    ],
  };

  // Render d3 simulation
  useLayoutEffect(() => {
    handleResize();

    // The force simulation mutates links and nodes, so create a copy
    // so that re-evaluating this cell produces the same result.
    const links: SimulationLinkDatum<Node>[] = testData.links.map((d) => ({
      ...d,
    }));
    const nodes: Node[] = testData.nodes.map((d) => ({ ...d, r: nodeRadius }));
    console.log("NODES: ", nodes);

    // // Add the enclosed circles to the nodes list
    // // Group nodes into arrays based on the team field
    // const teamsMap = nodes.reduce((acc, node) => {
    //   const team = node.team;
    //   if (team) {
    //     if (!acc[team]) acc[team] = [];
    //     acc[team].push(node);
    //   }
    //   return acc;
    // }, {} as Record<string, Node[]>);

    // console.log("TEAMS MAP: ", teamsMap);

    // Create simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink<Node, SimulationLinkDatum<Node>>(links).id((d) => d.id)
      )
      .force(
        "charge",
        d3.forceManyBody<Node>().strength((d) => d.r)
      )
      .force(
        "collide",
        d3.forceCollide<Node>(
          (d) =>
            (d.type === "team" ? d.children?.length * nodeRadius : nodeRadius) +
            10
        )
      )
      .force("x", d3.forceX())
      .force("y", d3.forceY());

    // Select the svg
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // Select existing <g> or append if not present
    let linkGroup = svg.select("g.links");
    if (linkGroup.empty()) {
      linkGroup = svg.append("g").attr("class", "links");
    }

    // Select existing <g> or append if not present
    let nodeGroup = svg.select("g.nodes");
    if (nodeGroup.empty()) {
      nodeGroup = svg.append("g").attr("class", "nodes");
    }

    // Add a line for each link, and a circle for each node.
    const link = linkGroup
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", Math.sqrt(2));

    // Define patterns for each node with an image
    const defs = svg.append("defs");
    nodes.forEach((d, i) => {
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
    });

    const node = nodeGroup
      .selectAll("g.node")
      .data(nodes)
      .join((enter) => {
        const g = enter.append("g").attr("class", "node");
        // Conditionally append circles
        g.each(function (d) {
          const group = d3.select(this);
          console.log("d:", d);
          if (d.children) {
            group
              .selectAll("circle")
              .data(d.children)
              .join("circle")
              .attr("r", 20);
          } else {
            group.append("circle").attr("r", 20);
          }
        });
        return g;
      });

    // const node = nodeGroup
    //   .selectAll("g")
    //   .data(nodes)
    //   .join((enter) =>
    //     enter
    //       .append("g")
    //       .attr("class", "node")
    //       .attr("type", (d) => d.type)
    //       .selectAll("circle")
    //       .data((d) => [d])
    //       // .data((d) => {
    //       //   const people = d.children?.concat(d) || [d];

    //       //   // // what is the pack layout
    //       //   // if (d.children) {
    //       //   //   const root = d3.hierarchy(d);
    //       //   //   console.log("ROOT: ", root);
    //       //   //   const packFunc = d3
    //       //   //     .pack()
    //       //   //     .size([nodeRadius * 2, nodeRadius * 2])
    //       //   //     .padding(3);
    //       //   //   const parentCircle = packFunc(root);
    //       //   //   console.log("PARENT CIRCLE: ", parentCircle);
    //       //   // }

    //       //   return people;
    //       // })
    //       .join((enter) => {
    //         console.log("2.ENTER: ", enter);
    //         console.log("HERE: ", enter.data());
    //         return enter
    //           .append("circle")
    //           .attr("name", (d) => d.name)
    //           .attr("fill", (d) =>
    //             d.picture_url ? `url(#node-image-${d.id})` : "none"
    //           )
    //           .attr("r", (d) => {
    //             console.log("D: ", d);
    //             return d.type === "team"
    //               ? d.children?.length * nodeRadius
    //               : nodeRadius;
    //           })
    //           .attr("stroke", "#e70000ff")
    //           .attr("stroke-width", 1.5);
    //       })
    //   );

    // const node = nodeGroup
    //   .selectAll("circle")
    //   .data(nodes)
    //   .join("circle")
    //   .attr("stroke", "#e70000ff")
    //   .attr("stroke-width", 1.5)
    //   .attr("r", nodeRadius)
    //   .attr("team", (d) => d.team || "default")
    //   .attr("fill", (d) =>
    //     d.picture_url ? `url(#node-image-${d.id})` : "none"
    //   );

    // Set the position attributes of links and nodes each time the simulation ticks.
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });
  }, [data, height, width]);

  return (
    <div style={{ height: "80vh", border: "solid black 2px" }} ref={divRef}>
      <svg className="m-auto" ref={svgRef} />
    </div>
  );
};

export default Network;
