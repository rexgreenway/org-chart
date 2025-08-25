import * as d3 from "d3";
import { useEffect, useState } from "react";

import Network from "./components/Network";
import Simple from "./components/Simple";

import { Node, GetNodesAndLinks } from "./types/node";

// import logo from "/logo.svg";

function App() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<d3.SimulationLinkDatum<Node>[]>([]);

  useEffect(() => {
    d3.csv("/data.csv", (d) => {
      const node: Node = {
        id: Number(d.id),
        name: d.name,
        picture_url: d.picture_url,
        team: d.team,
        parent: Number(d.parent),
      };
      return node;
    })
      .then((data) => {
        const [nodes, links] = GetNodesAndLinks(data);
        setNodes(nodes);
        setLinks(links);
      })
      .catch((error) => {
        console.error("Error loading data: ", error);
      });
  }, []);

  // console.log("NODES: ", nodes);
  // console.log("LINKS: ", links);

  return (
    <>
      <h1>Org Chart</h1>

      {/* <Network data={{ nodes, links }} /> */}
      <Simple data={{ nodes, links }} />
    </>
  );
}

export default App;
