import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function TopicBubbles({ data, onTopicClick }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return;

    // Wipe container to prevent duplicate physics loops in React StrictMode
    containerRef.current.innerHTML = "";

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 450;
    
    const maxCount = Math.max(...data.map(d => d.count), 1);
    
    // Setup Physics Nodes
    const nodes = data.map((d, i) => {
      const ratio = d.count / maxCount;
      const radius = 45 + (ratio * 45); // Scale bubble sizes from 45px to 90px
      return {
        ...d,
        radius,
        // Spawn near center
        x: width / 2 + (Math.random() - 0.5) * 100,
        y: height / 2 + (Math.random() - 0.5) * 100,
        colorIdx: i
      };
    });

    // Tailwind-matched glassmorphism color palettes
    const colors = [
      { bg: "rgba(99,102,241,0.1)", stroke: "rgba(99,102,241,0.4)", text: "#a5b4fc", shadow: "rgba(99,102,241,0.4)" }, // Indigo
      { bg: "rgba(16,185,129,0.1)", stroke: "rgba(16,185,129,0.4)", text: "#6ee7b7", shadow: "rgba(16,185,129,0.4)" }, // Emerald
      { bg: "rgba(244,63,94,0.1)", stroke: "rgba(244,63,94,0.4)", text: "#fda4af", shadow: "rgba(244,63,94,0.4)" }, // Rose
      { bg: "rgba(245,158,11,0.1)", stroke: "rgba(245,158,11,0.4)", text: "#fcd34d", shadow: "rgba(245,158,11,0.4)" }, // Amber
      { bg: "rgba(6,182,212,0.1)", stroke: "rgba(6,182,212,0.4)", text: "#67e8f9", shadow: "rgba(6,182,212,0.4)" }, // Cyan
      { bg: "rgba(217,70,239,0.1)", stroke: "rgba(217,70,239,0.4)", text: "#f0abfc", shadow: "rgba(217,70,239,0.4)" }  // Fuchsia
    ];

    const svg = d3.select(containerRef.current)
      .append("svg")
      .attr("width", "100%")
      .attr("height", height)
      .style("overflow", "visible");

    // Define Force Simulation (Gravity, Collision, Repulsion)
    const simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(5)) 
      .force("center", d3.forceCenter(width / 2, height / 2)) 
      .force("collide", d3.forceCollide().radius(d => d.radius + 6).iterations(4)) 
      .force("x", d3.forceX(width / 2).strength(0.04))
      .force("y", d3.forceY(height / 2).strength(0.04));

    // Drag Interaction Logic
    const drag = d3.drag()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    // Render Groups
    const node = svg.selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .call(drag)
      .style("cursor", "grab")
      .on("click", (event, d) => {
        if (event.defaultPrevented) return; // Prevent click firing when user drops a dragged bubble
        if (onTopicClick) onTopicClick(d.topic);
      })
      .on("mouseenter", function() {
        d3.select(this).select("circle").style("filter", d => `drop-shadow(0 0 15px ${colors[d.colorIdx % colors.length].shadow})`);
      })
      .on("mouseleave", function() {
        d3.select(this).select("circle").style("filter", "none");
      });

    // Draw Circles
    node.append("circle")
      .attr("r", d => d.radius)
      .style("fill", d => colors[d.colorIdx % colors.length].bg)
      .style("stroke", d => colors[d.colorIdx % colors.length].stroke)
      .style("stroke-width", 2)
      .style("transition", "filter 0.3s ease");

    // Draw Problem Count
    node.append("text")
      .text(d => d.count)
      .attr("text-anchor", "middle")
      .attr("dy", "-0.1em")
      .style("fill", d => colors[d.colorIdx % colors.length].text)
      .style("font-size", d => `${d.radius * 0.55}px`)
      .style("font-weight", "bold")
      .style("font-family", "system-ui, sans-serif")
      .style("pointer-events", "none");

    // Draw Topic Name
    node.append("text")
      .text(d => d.topic)
      .attr("text-anchor", "middle")
      .attr("dy", "1.4em")
      .style("fill", d => colors[d.colorIdx % colors.length].text)
      .style("font-size", d => `${Math.max(11, d.radius * 0.22)}px`)
      .style("font-weight", "500")
      .style("pointer-events", "none")
      .each(function(d) {
         // Auto-truncate long topics (like "Dynamic Programming" -> "Dynamic P...")
         const textNode = d3.select(this);
         const maxWidth = d.radius * 1.7;
         let textLength = this.getComputedTextLength();
         let text = d.topic;
         while (textLength > maxWidth && text.length > 0) {
           text = text.slice(0, -1);
           textNode.text(text + "…");
           textLength = this.getComputedTextLength();
         }
      });

    // Render loop (60 FPS)
    simulation.on("tick", () => {
      node.attr("transform", d => {
        // Keep bubbles locked inside the container walls
        d.x = Math.max(d.radius, Math.min(width - d.radius, d.x));
        d.y = Math.max(d.radius, Math.min(height - d.radius, d.y));
        return `translate(${d.x},${d.y})`;
      });
    });

    return () => simulation.stop(); // Cleanup physics loop on unmount
  }, [data, onTopicClick]);

  return <div ref={containerRef} className="w-full h-[450px]" />;
}