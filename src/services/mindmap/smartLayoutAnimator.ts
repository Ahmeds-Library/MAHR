import gsap from "gsap";
import { InteractiveMindMapNode } from "../../types/mindMapTypes";
import { NodeTargetCoordinate } from "./smartLayoutTypes";

export interface AnimateLayoutOptions {
  duration?: number;
  ease?: string;
  onUpdate: (updatedNodes: InteractiveMindMapNode[]) => void;
  onComplete?: () => void;
}

/**
 * Handles smooth GSAP interpolation for repositioning mind map nodes into new coordinates.
 */
export class SmartLayoutAnimator {
  private activeTween: gsap.core.Tween | null = null;
  private isTweening: boolean = false;

  public animateNodes(
    currentNodes: InteractiveMindMapNode[],
    targetCoordinates: Map<string, NodeTargetCoordinate>,
    options: AnimateLayoutOptions
  ): void {
    this.cancel();

    if (currentNodes.length === 0 || targetCoordinates.size === 0) {
      options.onComplete?.();
      return;
    }

    // Proxy object storing current positions of all nodes
    const proxy: Record<string, number> = { progress: 0 };
    const nodeStarts = new Map<string, { startX: number; startY: number; targetX: number; targetY: number }>();

    currentNodes.forEach((node) => {
      const target = targetCoordinates.get(node.id);
      if (target) {
        nodeStarts.set(node.id, {
          startX: node.x,
          startY: node.y,
          targetX: target.x,
          targetY: target.y,
        });
      }
    });

    this.isTweening = true;
    const duration = options.duration ?? 0.7;
    const ease = options.ease ?? "power3.out";

    this.activeTween = gsap.to(proxy, {
      progress: 1,
      duration,
      ease,
      onUpdate: () => {
        const p = proxy.progress;
        const updated = currentNodes.map((node) => {
          const coords = nodeStarts.get(node.id);
          if (!coords) return node;

          const currentX = Math.round(coords.startX + (coords.targetX - coords.startX) * p);
          const currentY = Math.round(coords.startY + (coords.targetY - coords.startY) * p);
          const target = targetCoordinates.get(node.id);

          return {
            ...node,
            x: currentX,
            y: currentY,
            depth: target?.depth !== undefined ? target.depth : node.depth,
          };
        });

        options.onUpdate(updated);
      },
      onComplete: () => {
        this.isTweening = false;
        this.activeTween = null;

        // Final snap to exact target integers
        const finalNodes = currentNodes.map((node) => {
          const target = targetCoordinates.get(node.id);
          if (!target) return node;
          return {
            ...node,
            x: target.x,
            y: target.y,
            depth: target.depth !== undefined ? target.depth : node.depth,
          };
        });
        options.onUpdate(finalNodes);
        options.onComplete?.();
      },
    });
  }

  public cancel(): void {
    if (this.activeTween) {
      this.activeTween.kill();
      this.activeTween = null;
    }
    this.isTweening = false;
  }

  public isActive(): boolean {
    return this.isTweening;
  }
}
