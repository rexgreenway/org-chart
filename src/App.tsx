import { csv } from "d3";
import { useEffect, useMemo, useState } from "react";

import { Autocomplete, TextField } from "@mui/material";

import Network from "./components/Network";
import { Link, Node, NodeType, RawNode, GetNodesAndLinks } from "./types/node";

import Logo from "/logo.svg";

import styles from "./App.module.css";

const App = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);

  const [searchedValue, setSearchedValue] = useState<Node | null>(null);

  // Read Data
  useEffect(() => {
    csv("/data.csv", (d) => {
      const node: RawNode = {
        id: d.id,
        name: d.name,
        location: d.location,
        pictureURL: d.picture_url,
        team: d.team === "" ? undefined : d.team,
        parent: d.parent === "" ? undefined : d.parent,
      };
      return node;
    })
      .then((data) => {
        const [n, l] = GetNodesAndLinks(data);
        setNodes(n);
        setLinks(l);
      })
      .catch((error) => {
        console.error("Error loading data: ", error);
      });
  }, []);

  const data = useMemo(() => ({ nodes, links }), [nodes, links]);

  const options = nodes.reduce<Node[]>((acc, node) => {
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
      <Network data={data} searchedNode={searchedValue} />
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
