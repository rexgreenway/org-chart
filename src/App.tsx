import Bubble from "./d3-components/Bubble";

import logo from "/logo.svg";

function App() {
  return (
    <>
      <div>
        <a href="https://neo4j.com/" target="_blank">
          <img src={logo} className="logo" alt="Neo4j logo" />
        </a>
      </div>

      <h1>Org Chart</h1>

      <Bubble>
        {{ group: "group-1", radius: 1 }}
        {{ group: "group-1", radius: 2 }}
        {{ group: "group-2", radius: 3 }}
        {{ group: "group-2", radius: 1 }}
        {{ group: "group-3", radius: 2 }}
        {{ group: "group-3", radius: 3 }}
      </Bubble>
    </>
  );
}

export default App;
