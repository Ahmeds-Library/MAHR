import { useEffect, useRef, useCallback } from "react";
import {
  InteractiveMindMapNode,
  InteractiveMindMapEdge,
  MindMapLayoutMode,
} from "../../types/mindMapTypes";
import { computeSmartLayout } from "../../services/mindmap/hierarchicalLayoutEngine";
import { SmartLayoutAnimator } from "../../services/mindmap/smartLayoutAnimator";
import { SmartLayoutPlan } from "../../services/mindmap/smartLayoutTypes";

export interface UseSmartLayoutEngineProps {
  nodes: InteractiveMindMapNode[];
  edges: InteractiveMindMapEdge[];
  containerSize: { width: number; height: number };
  layoutMode: MindMapLayoutMode;
  setNodes: React.Dispatch<React.SetStateAction<InteractiveMindMapNode[]>>;
  setLayoutMode: (mode: MindMapLayoutMode) => void;
  isDragging?: boolean;
  onLayoutApplied?: (plan: SmartLayoutPlan) => void;
}

/**
 * Smart Layout Hook (Layer 2 - Application Layer):
 * Invisibly analyzes topic density and automatically transitions mind map nodes
 * into specialized visual hierarchies (circular, tree-structured, or grid)
 * with fluid GSAP physics-based easing.
 */
export function useSmartLayoutEngine({
  nodes,
  edges,
  containerSize,
  layoutMode,
  setNodes,
  setLayoutMode,
  isDragging = false,
  onLayoutApplied,
}: UseSmartLayoutEngineProps) {
  const animatorRef = useRef<SmartLayoutAnimator>(new SmartLayoutAnimator());
  const lastStructureSignatureRef = useRef<string>("");
  const layoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningLayoutRef = useRef<boolean>(false);

  // Compute a signature that only changes when nodes are added, removed, or connected
  const structureSignature = `${nodes.length}-${edges.length}-${nodes.map((n) => n.id).sort().join(":")}-${edges.map((e) => `${e.from}>${e.to}`).sort().join(":")}`;

  const triggerSmartLayout = useCallback(
    (customNodes?: InteractiveMindMapNode[], customEdges?: InteractiveMindMapEdge[]) => {
      const activeNodes = customNodes || nodes;
      const activeEdges = customEdges || edges;

      if (activeNodes.length <= 1) return;
      if (isDragging) return;

      isRunningLayoutRef.current = true;

      // Compute optimal hierarchy based on topic density
      const plan = computeSmartLayout(activeNodes, activeEdges, containerSize);

      if (plan.layoutMode !== layoutMode) {
        setLayoutMode(plan.layoutMode);
      }

      // Smoothly animate nodes to target positions
      animatorRef.current.animateNodes(activeNodes, plan.targetCoordinates, {
        duration: 0.65,
        ease: "power3.out",
        onUpdate: (updated) => {
          setNodes(updated);
        },
        onComplete: () => {
          isRunningLayoutRef.current = false;
          onLayoutApplied?.(plan);
        },
      });
    },
    [nodes, edges, containerSize, isDragging, layoutMode, setLayoutMode, setNodes, onLayoutApplied]
  );

  // Auto-trigger when structure signature changes (nodes added, expanded, or preset loaded)
  useEffect(() => {
    if (isDragging) {
      animatorRef.current.cancel();
      return;
    }

    if (nodes.length <= 1) {
      lastStructureSignatureRef.current = structureSignature;
      return;
    }

    // Only run if structure actually changed
    if (structureSignature !== lastStructureSignatureRef.current) {
      lastStructureSignatureRef.current = structureSignature;

      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }

      layoutTimeoutRef.current = setTimeout(() => {
        triggerSmartLayout();
      }, 180);
    }

    return () => {
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }
    };
  }, [structureSignature, isDragging, triggerSmartLayout, nodes.length]);

  return {
    triggerSmartLayout,
    isAnimating: animatorRef.current.isActive(),
  };
}
