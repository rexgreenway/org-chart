import { useState } from "react";

import { Autocomplete, TextField } from "@mui/material";

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
      name: "Harsha Kannamangala Chidambara",
      type: NodeType.Person,
      pictureURL: TEST_IMAGE,
      radius: DEFAULT_NODE_RADIUS,
      location: NodeLocation.London,
    },
    {
      id: "2",
      name: "Matilde Larson",
      type: NodeType.Person,
      radius: DEFAULT_NODE_RADIUS,
      location: NodeLocation.Malmo,
      pictureURL: TEST_IMAGE,
    },
    {
      id: "3",
      name: "PLG",
      type: NodeType.Team,
      children: [
        {
          id: "3-1",
          name: "Alexandria Christopolos",
          type: NodeType.Person,
          pictureURL: TEST_IMAGE,
          radius: DEFAULT_NODE_RADIUS,
          location: NodeLocation.London,
        },
        {
          id: "3-2",
          name: "Greta Hanson Holstropp",
          type: NodeType.Person,
          pictureURL: TEST_IMAGE,
          radius: DEFAULT_NODE_RADIUS,
          location: NodeLocation.Malmo,
        },
      ],
    },
    {
      id: "4",
      name: "Console",
      type: NodeType.Team,
      children: [
        {
          id: "4-1",
          name: "Lars Jenson",
          type: NodeType.Person,
          pictureURL: TEST_IMAGE,
          radius: DEFAULT_NODE_RADIUS,
          location: NodeLocation.Malmo,
        },
        {
          id: "4-2",
          name: "Bill Bryson",
          type: NodeType.Person,
          pictureURL: TEST_IMAGE,
          radius: DEFAULT_NODE_RADIUS,
          location: NodeLocation.London,
        },
        {
          id: "4-3",
          name: "Master Chief",
          type: NodeType.Person,
          pictureURL: TEST_IMAGE,
          radius: DEFAULT_NODE_RADIUS,
          location: NodeLocation.London,
        },
        {
          id: "4-4",
          name: "Humboldt Manning",
          type: NodeType.Person,
          pictureURL: TEST_IMAGE,
          radius: DEFAULT_NODE_RADIUS,
        },
      ],
    },
    {
      id: "5",
      name: "Orchestration Orchestration Orchestration",
      type: NodeType.Team,
      children: [
        {
          id: "5-1",
          name: "Rebekah Ball",
          type: NodeType.Person,
          pictureURL: TEST_IMAGE,
          radius: DEFAULT_NODE_RADIUS,
          location: NodeLocation.Malmo,
        },
        {
          id: "5-2",
          name: "Rex Greenway",
          type: NodeType.Person,
          pictureURL: TEST_IMAGE,
          radius: DEFAULT_NODE_RADIUS,
          location: NodeLocation.London,
        },
      ],
    },
  ];

  const TEST_LINKS: Link[] = [
    { source: "1", target: "2" },
    { source: "1", target: "3" },
    { source: "1", target: "4" },
    { source: "1", target: "5" },
  ];

  const [searchedValue, setSearchedValue] = useState<Node | null>(null);

  // Helper function to flatten nodes and their children
  const flattenNodes = (nodes: Node[]): Node[] => {
    return nodes.flatMap((node) => {
      if (node.type === NodeType.Team && Array.isArray(node.children)) {
        return [node, ...flattenNodes(node.children)];
      }
      return [node];
    });
  };

  const options = TEST_NODES.reduce<Node[]>((acc, node) => {
    if (node.type === NodeType.Team) {
      return acc.concat(node, node.children);
    }
    return acc.concat(node);
  }, []);

  return (
    <>
      <div className={styles.HeaderBox}>
        <div className={styles.Header}>
          <div className={styles.Title}>
            <img className={styles.Logo} src={Logo} alt="Logo" />
            <div className={styles.Separator} />
            <h1>Engineering</h1>
          </div>

          {/* Search Bar */}
          <Autocomplete
            disablePortal
            clearOnEscape
            options={options}
            getOptionLabel={(option) => option.name}
            sx={{ width: 300 }}
            renderOption={(props, option) => (
              <li {...props} key={props.key}>
                {option.name}
                {option.type === NodeType.Team && (
                  <span style={{ opacity: 0.5, marginLeft: 8 }}>
                    ({option.type.toUpperCase()})
                  </span>
                )}
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Search..." />
            )}
            onChange={(_, value) => {
              setSearchedValue(value);
            }}
          />
        </div>
      </div>
      <Network
        data={{ nodes: TEST_NODES, links: TEST_LINKS }}
        searchedNode={searchedValue}
      />
      <div className={styles.FooterBox}>
        <div className={styles.Footer}>
          <h4>Location Key:</h4>
          <p>
            London <span className={`${styles.London} ${styles.Key}`}></span>
          </p>
          <p>
            Malmo <span className={`${styles.Malmo} ${styles.Key}`}></span>
          </p>
          <p>
            Other <span className={`${styles.Other} ${styles.Key}`}></span>
          </p>
        </div>
      </div>
    </>
  );
};

export default App;
