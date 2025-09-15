# Org Chart

Org Chart rendering with D3js & React.

## Quick Start

To render your own Organisation simply update the `public/data.csv` with your
data.

**This React App requires Node >v20**

### Data Considerations

The fields of the CSV are as follows:

`id | name | picture_url | team | location | parent`

At present the program assumes that parent individuals cannot be part of a team.

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
