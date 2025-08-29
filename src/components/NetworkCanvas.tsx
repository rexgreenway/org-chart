import * as d3 from "d3";
import { useRef, useEffect, useState, useLayoutEffect } from "react";
import { Node, Link, NodeType, DEFAULT_NODE_RADIUS } from "../types/node";

import styles from "./Network.module.css";

const NetworkCanvas = ({
  data,
}: {
  data: { nodes: Node[]; links: Link[] };
}) => {
  const divRef = useRef(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Responsive plot sizing
  const [width, SetWidth] = useState(300);
  const [height, SetHeight] = useState(300);
  const handleResize = () => {
    SetWidth(divRef.current ? divRef.current["offsetWidth"] : 300);
    SetHeight(divRef.current ? divRef.current["offsetHeight"] : 300);
  };

  // Handle resizing
  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useLayoutEffect(() => {
    // Copying Data as D3 manipulates the data in-place
    const nodes = data.nodes.map((n, i) => {
      if (n.id === "1") {
        return { ...n, fx: 0, fy: 0 };
      } else {
        // initial Circular positioning
        const angle = i * 2.4;
        const radius = 100 + i * 10;
        return {
          ...n,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        };
      }
    });
    const links = data.links.map((l) => ({ ...l }));

    // Outer simulation for top-level nodes
    const simulation = d3
      .forceSimulation(nodes)
      // LINK FORCES
      .force(
        "link",
        d3.forceLink<Node, Link>(links).id((d) => d.id)
      )
      // MANY BODY FORCES
      .force("charge", d3.forceManyBody<Node>())
      // COLLISION FORCES
      .force(
        "collide",
        d3.forceCollide<Node>((d) => {
          // Node name or Longest Node Name if Team
          const longestNamedNode =
            d.type === NodeType.Team
              ? d.children.reduce((a, b) =>
                  b.name.length > a.name.length ? b : a
                )
              : d;

          // bubble-radius = (face-radius + font-size * font-lines)
          // bounding-radius = bubble-radius * children-count
          const radius =
            DEFAULT_NODE_RADIUS + 8 * longestNamedNode.name.split(" ").length;

          // Calculate the bounding circle radius including the name text height
          return (
            radius *
              (1 +
                Math.sqrt(d.type === NodeType.Team ? d.children.length : 0)) +
            50
          );
        })
      )
      // Use forceCenter to keep the simulation centered at (0,0)
      .force("center", d3.forceCenter<Node>(0, 0));

    // Zoom state
    // let transform = d3.zoomIdentity;

    // Draw function
    function draw(transform = d3.zoomIdentity) {
      const ctx = canvasRef.current?.getContext("2d");

      if (!ctx) return;

      ctx.save();

      ctx.clearRect(0, 0, width, height);
      ctx.translate(width / 2, height / 2);
      ctx.scale(transform.k, transform.k);
      ctx.translate(transform.x, transform.y);

      // Draw links
      ctx.strokeStyle = "#aaa";
      links.forEach((l) => {
        ctx.beginPath();
        ctx.moveTo(l.source.x, l.source.y);
        ctx.lineTo(l.target.x, l.target.y);
        ctx.stroke();
      });

      // Draw nodes
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 20, 0, 2 * Math.PI);
        ctx.fillStyle = "#69b3a2";
        ctx.fill();
        ctx.strokeStyle = "#333";
        ctx.stroke();
        // Draw name
        ctx.fillStyle = "#000";
        ctx.font = "12px sans-serif";
        ctx.fillText(n.name, n.x + 22, n.y);
      });

      ctx.restore();
    }

    simulation.on("tick", draw);

    // D3 zoom
    const zoom = d3.zoom().on("zoom", (event) => {
      const transform = event.transform;
      draw(transform);
    });

    d3.select(canvasRef.current).call(zoom as any);

    // Initial draw
    draw();

    return () => simulation.stop();
  }, [data, width, height]);

  return (
    <div className={styles.Network} ref={divRef}>
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  );
};

export default NetworkCanvas;
