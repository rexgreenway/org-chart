# Org Chart

Org Chart rendering with D3js & React.

## Quick Start

To render your own Organisation simply update the `public/data.csv` with your
data.

**This React App requires Node >v20**

### Data Considerations

The fields of the CSV are as follows:

`id | name | picture_url | team | location | parent`

By default parent individuals are assumed to not be part of a team; rendered
teams are always leaves of the network.

If some "root individuals" have the team field populated (with the same team)
you can account for this using the environment variable `VITE_ROOT_TEAM` in the
.env file, as seen in this repos dummy data and .env file.

### Running Locally

```
npm install

npm run dev
```

## Personalisation

This visualisation has been developed during employment at Neo4j and as such the
Logo, colours chosen, and Locations supported reflect that. The personalisation
of colors and locations would involve straight forward updates/extensions of CSS
classes and the switch case statement [here](src/components/Network.tsx#L282).

## References:

- D3 In React
  - [Official Docs](https://d3js.org/getting-started#d3-in-react)
  - [Excellent Blog Post](https://2019.wattenberger.com/blog/react-and-d3)
