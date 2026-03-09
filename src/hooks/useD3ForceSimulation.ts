import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3-force';
import type { NeuralNode } from '@/lib/neural-graph-builder';

export interface UseD3ForceSimulationOptions {
  width?: number;
  height?: number;
  centerX?: number;
  centerY?: number;
}

export interface DragHandlers {
  onDragStart: (nodeId: string, event: React.PointerEvent) => void;
  onDrag: (nodeId: string, x: number, y: number) => void;
  onDragEnd: (nodeId: string) => void;
}

export interface ZoomTransform {
  x: number;
  y: number;
  k: number; // scale
}

export interface UseD3ForceSimulationReturn {
  nodes: NeuralNode[];
  simulation: d3.Simulation<NeuralNode, undefined> | null;
  dragHandlers: DragHandlers;
  transform: ZoomTransform;
  onWheel: (event: React.WheelEvent) => void;
  onPanStart: (event: React.PointerEvent) => void;
  onPanMove: (event: React.PointerEvent) => void;
  onPanEnd: () => void;
  isPanning: boolean;
}

interface D3Link {
  source: string;
  target: string;
  depth: number;
}

/**
 * Custom hook for D3 force simulation
 * D3 handles physics calculations, React handles rendering
 */
export function useD3ForceSimulation(
  initialNodes: NeuralNode[],
  links: D3Link[],
  options: UseD3ForceSimulationOptions = {}
): UseD3ForceSimulationReturn {
  const { width = 1920, height = 1080, centerX = 0, centerY = 0 } = options;

  const [nodes, setNodes] = useState<NeuralNode[]>(initialNodes);
  const simulationRef = useRef<d3.Simulation<NeuralNode, undefined> | null>(null);
  const rafRef = useRef<number | null>(null);
  const nodesRef = useRef<NeuralNode[]>(initialNodes);

  // Zoom/Pan state
  const [transform, setTransform] = useState<ZoomTransform>({ x: 0, y: 0, k: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Clone nodes to avoid mutating props
    const clonedNodes = initialNodes.map((node) => ({ ...node }));

    // Initialize positions if not set
    clonedNodes.forEach((node) => {
      if (node.x === undefined || node.y === undefined) {
        node.x = (node.position?.x || 0) + centerX + width / 2;
        node.y = (node.position?.y || 0) + centerY + height / 2;
      }
    });

    // Create simulation
    const simulation = d3
      .forceSimulation<NeuralNode>(clonedNodes)
      .force(
        'link',
        d3
          .forceLink<NeuralNode, D3Link>(links)
          .id((d) => d.id)
          .distance((d) => {
            if (d.depth === 1) return 120;
            if (d.depth === 2) return 100;
            return 80;
          })
          .strength(0.6)
      )
      .force(
        'charge',
        d3.forceManyBody<NeuralNode>().strength((d) => {
          if (d.level === 1) return -600;
          if (d.level === 2) return -300;
          return -150;
        })
      )
      .force(
        'collide',
        d3
          .forceCollide<NeuralNode>()
          .radius((d) => d.r || 20)
          .strength(0.8)
      )
      .force(
        'radial',
        d3
          .forceRadial<NeuralNode>(280, centerX + width / 2, centerY + height / 2)
          .strength((d) => (d.level === 1 ? 0.5 : 0))
      )
      .force(
        'center',
        d3.forceCenter(centerX + width / 2, centerY + height / 2).strength(0.03)
      )
      .alphaDecay(0.025)
      .velocityDecay(0.35);

    simulationRef.current = simulation;

    // Throttle tick updates using requestAnimationFrame
    let lastUpdate = 0;
    const throttleInterval = 1000 / 60; // 60fps

    const onTick = () => {
      const now = Date.now();
      if (now - lastUpdate >= throttleInterval) {
        lastUpdate = now;
        nodesRef.current = clonedNodes;
        setNodes([...clonedNodes]);
      }

      if (simulation.alpha() > simulation.alphaMin()) {
        rafRef.current = requestAnimationFrame(onTick);
      }
    };

    simulation.on('tick', () => {
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(onTick);
      }
    });

    simulation.on('end', () => {
      // Final update when simulation ends
      nodesRef.current = clonedNodes;
      setNodes([...clonedNodes]);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    });

    return () => {
      simulation.stop();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [initialNodes, links, width, height, centerX, centerY]);

  // Drag handlers
  const dragHandlers: DragHandlers = {
    onDragStart: (nodeId: string) => {
      const simulation = simulationRef.current;
      if (!simulation) return;

      // Reheat simulation
      simulation.alphaTarget(0.15).restart();

      // Find node and fix position
      const node = nodesRef.current.find((n) => n.id === nodeId);
      if (node) {
        node.fx = node.x;
        node.fy = node.y;
      }
    },

    onDrag: (nodeId: string, clientX: number, clientY: number) => {
      const node = nodesRef.current.find((n) => n.id === nodeId);
      if (node) {
        node.fx = clientX;
        node.fy = clientY;
        // Force immediate update
        setNodes([...nodesRef.current]);
      }
    },

    onDragEnd: (nodeId: string) => {
      const simulation = simulationRef.current;
      if (!simulation) return;

      simulation.alphaTarget(0);

      const node = nodesRef.current.find((n) => n.id === nodeId);
      if (node) {
        // depth 3 (post) nodes stay fixed after drag
        // depth 1, 2 nodes are released
        if (node.level !== 3) {
          node.fx = null;
          node.fy = null;
        }
      }
    },
  };

  // Zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const newK = Math.max(0.3, Math.min(2.5, transform.k * (1 + delta)));

    // Zoom towards mouse position
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;

    setTransform({
      x: transform.x - mouseX * (newK - transform.k) / transform.k,
      y: transform.y - mouseY * (newK - transform.k) / transform.k,
      k: newK,
    });
  };

  // Pan handlers
  const handlePanStart = (e: React.PointerEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handlePanMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    setTransform({
      ...transform,
      x: transform.x + dx,
      y: transform.y + dy,
    });
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  return {
    nodes,
    simulation: simulationRef.current,
    dragHandlers,
    transform,
    onWheel: handleWheel,
    onPanStart: handlePanStart,
    onPanMove: handlePanMove,
    onPanEnd: handlePanEnd,
    isPanning,
  };
}
