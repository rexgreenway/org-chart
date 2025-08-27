import Network from "./components/Network";
import {
  DEFAULT_NODE_RADIUS,
  NodeLocation,
  Link,
  Node,
  NodeType,
} from "./types/node";

import Logo from "/logo.svg";

import styles from "./App.module.css";

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

  const TEST_IMAGE =
    "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fimages.pexels.com%2Fphotos%2F2380794%2Fpexels-photo-2380794.jpeg%3Fcs%3Dsrgb%26dl%3Dpexels-kevin-bidwell-2380794.jpg%26fm%3Djpg&f=1&nofb=1&ipt=e28da8ebf542691592482e3345e9067106b14c646134c0d7b58919eb1725df6b&ipo=images";

  const TEST_NODES: Node[] = [
    {
      id: "1",
      name: "BIG BOSS",
      type: NodeType.Person,
      pictureURL: TEST_IMAGE,
      radius: DEFAULT_NODE_RADIUS,
      location: NodeLocation.London,
    },
    {
      id: "2",
      name: "SUB BOSS",
      type: NodeType.Person,
      radius: DEFAULT_NODE_RADIUS,
      location: NodeLocation.Malmo,
      pictureURL: TEST_IMAGE,
    },
    {
      id: "3",
      name: "A-TEAM",
      type: NodeType.Team,
      children: [
        {
          id: "3-1",
          name: "TEAM LEAD",
          type: NodeType.Person,
          pictureURL: TEST_IMAGE,
          radius: DEFAULT_NODE_RADIUS,
          location: NodeLocation.London,
        },
        {
          id: "3-2",
          name: "TEAM MEMBER",
          type: NodeType.Person,
          pictureURL: TEST_IMAGE,
          radius: DEFAULT_NODE_RADIUS,
          location: NodeLocation.Malmo,
        },
      ],
    },
    {
      id: "4",
      name: "B-TEAM",
      type: NodeType.Team,
      children: [
        {
          id: "4-1",
          name: "HELLO",
          type: NodeType.Person,
          pictureURL: TEST_IMAGE,
          radius: DEFAULT_NODE_RADIUS,
          location: NodeLocation.Malmo,
        },
        {
          id: "4-2",
          name: "BANANA",
          type: NodeType.Person,
          pictureURL: TEST_IMAGE,
          radius: DEFAULT_NODE_RADIUS,
          location: NodeLocation.London,
        },
        {
          id: "4-3",
          name: "OTHER",
          type: NodeType.Person,
          pictureURL: TEST_IMAGE,
          radius: DEFAULT_NODE_RADIUS,
          location: NodeLocation.London,
        },
        {
          id: "4-4",
          name: "OTHER",
          type: NodeType.Person,
          pictureURL: TEST_IMAGE,
          radius: DEFAULT_NODE_RADIUS,
        },
      ],
    },
  ];

  const TEST_LINKS: Link[] = [
    { source: "1", target: "2" },
    { source: "1", target: "3" },
    { source: "1", target: "4" },
  ];

  return (
    <>
      <div className={styles.Header}>
        <img className={styles.Logo} src={Logo} alt="Logo" />
        <h1>: ORG CHART</h1>
      </div>
      <Network data={{ nodes: TEST_NODES, links: TEST_LINKS }} />
    </>
  );
};

export default App;
