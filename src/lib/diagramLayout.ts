/**
 * Diagram Layout and Edge Snapping Algorithm for Myraa's Chalkboard
 * Spaces and aligns entities, attributes, and relationships dynamically.
 */

export interface DrawCommand {
  type: string;
  x1: number;
  y1: number;
  x2?: number;
  y2?: number;
  color?: string;
  text?: string;
  thickness?: number;
}

interface LayoutNode {
  id: string;
  type: string;
  x: number; // center x (0-100)
  y: number; // center y (0-100)
  w: number; // width in %
  h: number; // height in %
  color: string;
  thickness?: number;
  labelCmd?: DrawCommand;
  originalCmd: DrawCommand;
  originalIndex: number;
}

interface LayoutEdge {
  type: string;
  color: string;
  thickness?: number;
  nodeAId: string;
  nodeBId: string;
  originalCmd: DrawCommand;
  originalIndex: number;
}

/**
 * Calculates the snap point on the perimeter of a node from its center in direction of angle phi.
 */
function getSnapPoint(
  cx: number,
  cy: number,
  w: number,
  h: number,
  type: string,
  phi: number
): { x: number; y: number } {
  const dx = Math.cos(phi);
  const dy = Math.sin(phi);
  const W = w / 2;
  const H = h / 2;

  if (type === "circle") {
    // Circle of radius R (approx 2.5% of canvas)
    const R = 2.5;
    return {
      x: cx + R * dx,
      y: cy + R * dy,
    };
  } else if (type === "diamond" || type === "rhombus") {
    // Rhombus boundary: |x|/W + |y|/H = 1
    const denom = Math.abs(dx) / W + Math.abs(dy) / H;
    const t = denom > 0.0001 ? 1 / denom : 0;
    return {
      x: cx + t * dx,
      y: cy + t * dy,
    };
  } else {
    // Rect, oval, ellipse: Box boundary approximation
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const tX = absDx > 0.0001 ? W / absDx : Infinity;
    const tY = absDy > 0.0001 ? H / absDy : Infinity;
    const t = Math.min(tX, tY);
    return {
      x: cx + t * dx,
      y: cy + (t === Infinity ? 0 : t * dy),
    };
  }
}

export function layoutVisualDiagram(drawings: DrawCommand[]): DrawCommand[] {
  if (!drawings || drawings.length === 0) return [];

  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];
  const rawTexts: DrawCommand[] = [];
  const unhandledCmds: DrawCommand[] = [];

  // Step 1: Parse shapes, texts, and lines/arrows
  drawings.forEach((cmd, idx) => {
    const typeLower = cmd.type?.toLowerCase();
    
    if (["rect", "roundrect", "diamond", "rhombus", "circle", "oval", "ellipse"].includes(typeLower)) {
      // Calculate original center and dimensions
      let cx = cmd.x1;
      let cy = cmd.y1;
      let w = 12; // default
      let h = 6;  // default

      if (cmd.x2 !== undefined && cmd.y2 !== undefined) {
        cx = (cmd.x1 + cmd.x2) / 2;
        cy = (cmd.y1 + cmd.y2) / 2;
        w = Math.abs(cmd.x2 - cmd.x1) || 12;
        h = Math.abs(cmd.y2 - cmd.y1) || 6;
      }

      if (typeLower === "circle") {
        // Circle is stored as center (x1, y1) and radius calculated via x2
        const rad = cmd.x2 !== undefined ? Math.abs(cmd.x2 - cmd.x1) : 2.5;
        w = rad * 2;
        h = rad * 2;
      }

      nodes.push({
        id: `node_${idx}`,
        type: typeLower,
        x: cx,
        y: cy,
        w: w > 0 ? w : 12,
        h: h > 0 ? h : 6,
        color: cmd.color || "cyan",
        thickness: cmd.thickness,
        originalCmd: cmd,
        originalIndex: idx,
      });
    } else if (typeLower === "text") {
      rawTexts.push(cmd);
    } else if (["line", "arrow"].includes(typeLower)) {
      unhandledCmds.push(cmd);
    } else {
      unhandledCmds.push(cmd);
    }
  });

  // Step 2: Associate text labels with shapes based on spatial proximity
  rawTexts.forEach((txtCmd) => {
    let closestNode: LayoutNode | null = null;
    let minDist = Infinity;

    nodes.forEach((node) => {
      // Dist from text point (x1, y1) to shape center
      const dx = txtCmd.x1 - node.x;
      const dy = txtCmd.y1 - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closestNode = node;
      }
    });

    // If within a practical distance threshold (e.g. 20% of chalkboard canvas width)
    if (closestNode && minDist < 20) {
      // If the node already has a label, keep the closest one
      if (!(closestNode as LayoutNode).labelCmd) {
        (closestNode as LayoutNode).labelCmd = txtCmd;
      } else {
        unhandledCmds.push(txtCmd); // fallback as loose text
      }
    } else {
      unhandledCmds.push(txtCmd); // fallback as loose text
    }
  });

  // Step 3: Match connector lines/arrows to the closest start/end nodes
  unhandledCmds.forEach((cmd, idx) => {
    const typeLower = cmd.type?.toLowerCase();
    if (["line", "arrow"].includes(typeLower) && cmd.x2 !== undefined && cmd.y2 !== undefined) {
      let nodeA: LayoutNode | null = null;
      let nodeB: LayoutNode | null = null;
      let minDistA = Infinity;
      let minDistB = Infinity;

      nodes.forEach((node) => {
        // Distance from line endpoints to node center
        const dx1 = cmd.x1 - node.x;
        const dy1 = cmd.y1 - node.y;
        const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

        const dx2 = cmd.x2! - node.x;
        const dy2 = cmd.y2! - node.y;
        const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

        if (dist1 < minDistA) {
          minDistA = dist1;
          nodeA = node;
        }
        if (dist2 < minDistB) {
          minDistB = dist2;
          nodeB = node;
        }
      });

      // Valid connection if we found distinct nodes near the endpoints
      if (nodeA && nodeB && (nodeA as LayoutNode).id !== (nodeB as LayoutNode).id && minDistA < 25 && minDistB < 25) {
        edges.push({
          type: typeLower,
          color: cmd.color || "white",
          thickness: cmd.thickness,
          nodeAId: (nodeA as LayoutNode).id,
          nodeBId: (nodeB as LayoutNode).id,
          originalCmd: cmd,
          originalIndex: idx,
        });
      } else {
        unhandledCmds.push(cmd); // preserve unconnected lines
      }
    }
  });

  // Step 4: Classify nodes to layout them perfectly
  // Core Entities: rectangles
  const entities = nodes.filter((n) => ["rect", "roundrect"].includes(n.type));
  // Relationships: diamonds
  const relationships = nodes.filter((n) => ["diamond", "rhombus"].includes(n.type));
  // Attributes: circles/ellipses/ovals
  const attributes = nodes.filter((n) => ["circle", "ellipse", "oval"].includes(n.type));

  // Step 5: Settle entity positions in a clean row/grid with ample spacing
  const nE = entities.length;
  if (nE === 1) {
    entities[0].x = 50;
    entities[0].y = 50;
  } else if (nE === 2) {
    entities[0].x = 25;
    entities[0].y = 50;
    entities[1].x = 75;
    entities[1].y = 50;
  } else if (nE === 3) {
    // Triangular or row layout
    entities[0].x = 22;
    entities[0].y = 52;
    entities[1].x = 50;
    entities[1].y = 35;
    entities[2].x = 78;
    entities[2].y = 52;
  } else if (nE > 3) {
    // Beautiful circular arrangement
    entities.forEach((ent, i) => {
      const theta = (i / nE) * 2 * Math.PI;
      ent.x = 50 + 26 * Math.cos(theta);
      ent.y = 50 + 20 * Math.sin(theta);
    });
  }

  // Step 6: Position relationship diamonds midway between their connected entities
  relationships.forEach((rel) => {
    // Find edges connected to this relationship node
    const connectedEdges = edges.filter((e) => e.nodeAId === rel.id || e.nodeBId === rel.id);
    const connectedNodeIds = new Set<string>();
    
    connectedEdges.forEach((e) => {
      if (e.nodeAId !== rel.id) connectedNodeIds.add(e.nodeAId);
      if (e.nodeBId !== rel.id) connectedNodeIds.add(e.nodeBId);
    });

    const connectedEntities = entities.filter((ent) => connectedNodeIds.has(ent.id));

    if (connectedEntities.length >= 2) {
      // Centroid of connected entities
      let sumX = 0;
      let sumY = 0;
      connectedEntities.forEach((ent) => {
        sumX += ent.x;
        sumY += ent.y;
      });
      rel.x = sumX / connectedEntities.length;
      rel.y = sumY / connectedEntities.length;
    } else if (connectedEntities.length === 1) {
      // Place next to the single entity
      rel.x = connectedEntities[0].x;
      rel.y = connectedEntities[0].y + 15;
    } else {
      // Fallback: keep center
      rel.x = Math.max(15, Math.min(85, rel.x));
      rel.y = Math.max(15, Math.min(85, rel.y));
    }
  });

  // Step 7: Distribute attributes evenly around their parent Entity in a radial fan
  // Find which attribute belongs to which parent entity
  entities.forEach((ent) => {
    // Find attributes connected to this entity
    const attrIds = new Set<string>();
    
    // An attribute is connected to ent if there's an edge between them
    edges.forEach((e) => {
      if (e.nodeAId === ent.id) {
        const other = nodes.find((n) => n.id === e.nodeBId);
        if (other && ["circle", "ellipse", "oval"].includes(other.type)) {
          attrIds.add(other.id);
        }
      } else if (e.nodeBId === ent.id) {
        const other = nodes.find((n) => n.id === e.nodeAId);
        if (other && ["circle", "ellipse", "oval"].includes(other.type)) {
          attrIds.add(other.id);
        }
      }
    });

    const entAttrs = attributes.filter((attr) => attrIds.has(attr.id));
    const count = entAttrs.length;

    if (count > 0) {
      // Space them radially outward from parent center
      const rad = 15; // optimal radius spacing
      entAttrs.forEach((attr, j) => {
        // Space them symmetrically. Let's start radiating vertically first
        const angle = (j / count) * 2 * Math.PI + Math.PI / 6;
        attr.x = Math.max(8, Math.min(92, ent.x + rad * Math.cos(angle)));
        attr.y = Math.max(8, Math.min(92, ent.y + rad * Math.sin(angle)));
      });
    }
  });

  // Keep any remaining unplaced/unconnected attributes from drifting away
  attributes.forEach((attr) => {
    attr.x = Math.max(5, Math.min(95, attr.x));
    attr.y = Math.max(5, Math.min(95, attr.y));
  });

  // Step 8: Assemble updated shape and text commands with the calculated coordinates
  const result: DrawCommand[] = [];

  // Re-push shapes & centered text labels
  nodes.forEach((node) => {
    // Reconstruct the shape bounding box based on center
    let shapeCmd: DrawCommand = { ...node.originalCmd };

    if (node.type === "circle") {
      shapeCmd.x1 = node.x;
      shapeCmd.y1 = node.y;
      shapeCmd.x2 = node.x + 2.5; // radius = 2.5%
      shapeCmd.y2 = node.y;
    } else {
      shapeCmd.x1 = node.x - node.w / 2;
      shapeCmd.y1 = node.y - node.h / 2;
      shapeCmd.x2 = node.x + node.w / 2;
      shapeCmd.y2 = node.y + node.h / 2;
    }

    result.push(shapeCmd);

    // If there is an associated text label, center it perfectly inside the shape!
    if (node.labelCmd) {
      const textCmd = { ...node.labelCmd };
      const txt = textCmd.text || "";
      // Centering offset heuristic
      const approxCharWidth = 0.65;
      const textOffset = (txt.length * approxCharWidth) / 2;

      textCmd.x1 = node.x - textOffset;
      textCmd.y1 = node.y + 0.9; // ideal baseline offset for crisp text centering
      result.push(textCmd);
    }
  });

  // Step 9: Reconstruct all edge connectors with Snap-to edge bounding borders
  edges.forEach((edge) => {
    const nodeA = nodes.find((n) => n.id === edge.nodeAId);
    const nodeB = nodes.find((n) => n.id === edge.nodeBId);

    if (nodeA && nodeB) {
      let sourceNode = nodeA;
      let targetNode = nodeB;

      const isEntityA = ["rect", "roundrect"].includes(nodeA.type);
      const isEntityB = ["rect", "roundrect"].includes(nodeB.type);
      const isAttrA = ["circle", "ellipse", "oval"].includes(nodeA.type);
      const isAttrB = ["circle", "ellipse", "oval"].includes(nodeB.type);
      const isRelA = ["diamond", "rhombus"].includes(nodeA.type);
      const isRelB = ["diamond", "rhombus"].includes(nodeB.type);

      let forceArrow = false;

      if ((isEntityA && isAttrB) || (isAttrA && isEntityB)) {
        forceArrow = true;
        // Entity to Attribute orientation (always points toward the Attribute)
        if (isEntityA) {
          sourceNode = nodeA;
          targetNode = nodeB;
        } else {
          sourceNode = nodeB;
          targetNode = nodeA;
        }
      } else if ((isRelA && isEntityB) || (isEntityA && isRelB)) {
        forceArrow = true;
        // Relationship to Entity orientation (always points toward the Entity representing direction/cardinality)
        if (isRelA) {
          sourceNode = nodeA;
          targetNode = nodeB;
        } else {
          sourceNode = nodeB;
          targetNode = nodeA;
        }
      } else if ((isRelA && isAttrB) || (isAttrA && isRelB)) {
        forceArrow = true;
        // Relationship to Attribute orientation (always points toward the Attribute)
        if (isRelA) {
          sourceNode = nodeA;
          targetNode = nodeB;
        } else {
          sourceNode = nodeB;
          targetNode = nodeA;
        }
      }

      // Calculate angle from source to target
      const phi = Math.atan2(targetNode.y - sourceNode.y, targetNode.x - sourceNode.x);
      
      // Calculate snap points on borders of source and target nodes
      const pA = getSnapPoint(sourceNode.x, sourceNode.y, sourceNode.w, sourceNode.h, sourceNode.type, phi);
      const pB = getSnapPoint(targetNode.x, targetNode.y, targetNode.w, targetNode.h, targetNode.type, phi + Math.PI);

      const edgeCmd: DrawCommand = {
        ...edge.originalCmd,
        type: forceArrow ? "arrow" : edge.originalCmd.type,
        x1: pA.x,
        y1: pA.y,
        x2: pB.x,
        y2: pB.y,
      };
      result.push(edgeCmd);
    } else {
      result.push(edge.originalCmd);
    }
  });

  // Re-push unconnected/unhandled commands to preserve full diagram content
  unhandledCmds.forEach((cmd) => {
    // Ensure loose text has some bounds
    result.push(cmd);
  });

  return result;
}
