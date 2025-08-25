import Network from "./components/Network";

// import logo from "/logo.svg";

const App = () => {
  // const [nodes, setNodes] = useState<Node[]>([]);
  // const [links, setLinks] = useState<d3.SimulationLinkDatum<Node>[]>([]);

  // useEffect(() => {
  //   d3.csv("/data.csv", (d) => {
  //     const node: Node = {
  //       id: Number(d.id),
  //       name: d.name,
  //       picture_url: d.picture_url,
  //       team: d.team,
  //       parent: Number(d.parent),
  //     };
  //     return node;
  //   })
  //     .then((data) => {
  //       const [nodes, links] = GetNodesAndLinks(data);
  //       setNodes(nodes);
  //       setLinks(links);
  //     })
  //     .catch((error) => {
  //       console.error("Error loading data: ", error);
  //     });
  // }, []);

  // console.log("NODES: ", nodes);
  // console.log("LINKS: ", links);

  return (
    <>
      <h1>Org Chart</h1>

      <Network />
    </>
  );
};

export default App;
