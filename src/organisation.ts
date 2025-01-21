export enum NodeType {
  PERSON = "person",
  TEAM = "team",
}

export enum Product {
  AURA = "aura",
}

const data = {
  name: "aura-engineering",
  network: {
    name: "Magnus Vejlstrup",
    type: NodeType.PERSON,
    children: [
      {
        name: "Technical Coordination",
        type: NodeType.TEAM,
        children: [
          {
            name: "Hugo Firth",
            type: NodeType.PERSON,
          },
          {
            name: "Tobias Johansson",
            type: NodeType.PERSON,
          },
        ],
      },
      {
        name: "Frederik Clementson",
        type: NodeType.PERSON,
        children: [
          {
            name: "Irfan Karaca",
            type: NodeType.PERSON,
            children: [
              {
                name: "Console",
                type: NodeType.TEAM,
                product: Product.AURA,
                children: [
                  {
                    name: "Rex Greenway",
                    type: NodeType.PERSON,
                  },
                  {
                    name: "Elliot Jalgard",
                    type: NodeType.PERSON,
                  },
                  {
                    name: "Anu Sankar",
                    type: NodeType.PERSON,
                  },
                  {
                    name: "Johanna Gustafson",
                    type: NodeType.PERSON,
                  },
                  {
                    name: "Bryce Samspson",
                    type: NodeType.PERSON,
                  },
                ],
              },
              {
                name: "UBS",
                type: NodeType.TEAM,
                product: Product.AURA,
                children: [
                  {
                    name: "Max Bautzer",
                    type: NodeType.PERSON,
                  },
                  {
                    name: "Alexander Ivankin",
                    type: NodeType.PERSON,
                  },
                  {
                    name: "Miguel Rodriguez",
                    type: NodeType.PERSON,
                  },
                ],
              },
            ],
          },
          {
            name: "Mark Peace",
            type: NodeType.PERSON,
            children: [
              {
                name: "Orchestration",
                type: NodeType.TEAM,
                product: Product.AURA,
                children: [
                  {
                    name: "James Edwards",
                    type: NodeType.PERSON,
                  },
                  {
                    name: "Alena Hramyka",
                    type: NodeType.PERSON,
                  },
                  {
                    name: "Aleksey Dukhovniy",
                    type: NodeType.PERSON,
                  },
                  {
                    name: "Ilyas Saltykov",
                    type: NodeType.PERSON,
                  },
                ],
              },
              {
                name: "PLG",
                type: NodeType.TEAM,
                children: [
                  {
                    name: "Jonathan Paul",
                    type: NodeType.PERSON,
                  },
                  {
                    name: "Matthew Modarres",
                    type: NodeType.PERSON,
                  },
                ],
              },
              {
                name: "Self Managed Cloud",
                type: NodeType.TEAM,
                children: [
                  {
                    name: "Bledi Feshti",
                    type: NodeType.PERSON,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

export default data;
