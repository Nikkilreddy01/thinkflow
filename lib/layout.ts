import { GraphNode, GraphEdge, TextAnchor } from "@/types/graph";

export interface LayoutOptions {
  horizontalSpacing?: number;
  verticalSpacing?: number;
  mainStartX?: number;
  mainStartY?: number;
}

export function computeGraphLayout(
  nodes: GraphNode[],
  anchors: TextAnchor[],
  options: LayoutOptions = {}
): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const horizontalSpacing = options.horizontalSpacing || 480;
  const verticalSpacing = options.verticalSpacing || 320;
  const mainStartX = options.mainStartX || 60;
  const mainStartY = options.mainStartY || 60;

  // Build node lookup map
  const nodeMap = new Map<string, GraphNode>();
  nodes.forEach((n) => nodeMap.set(n.id, { ...n }));

  // Build parent -> children map
  const childrenMap = new Map<string, string[]>();
  nodes.forEach((n) => {
    if (n.parentId) {
      const list = childrenMap.get(n.parentId) || [];
      list.push(n.id);
      childrenMap.set(n.parentId, list);
    }
  });

  // 1. Position Main Path nodes vertically
  const mainPathNodes = nodes
    .filter((n) => n.isMainPath)
    .sort((a, b) => (a.mainPathIndex ?? 0) - (b.mainPathIndex ?? 0));

  let currentMainY = mainStartY;
  mainPathNodes.forEach((node) => {
    const updated = nodeMap.get(node.id);
    if (updated) {
      updated.position = {
        x: mainStartX,
        y: currentMainY,
      };
      // Estimate height based on content length
      const contentLines = (node.content.match(/\n/g) || []).length + 1;
      const estimatedHeight = Math.max(
        220,
        Math.min(500, contentLines * 24 + 180)
      );
      currentMainY += estimatedHeight + 80;
    }
  });

  // 2. Recursively layout exploration branches horizontally
  function layoutBranches(parentId: string, parentX: number, parentY: number) {
    const parentNode = nodeMap.get(parentId);
    if (!parentNode) return;

    const childIds = childrenMap.get(parentId) || [];
    const branchChildren = childIds
      .map((id) => nodeMap.get(id))
      .filter((n): n is GraphNode => !!n && !n.isMainPath);

    if (branchChildren.length === 0) return;

    const totalHeight = branchChildren.length * verticalSpacing;
    const startY = parentY - totalHeight / 4;

    branchChildren.forEach((child, index) => {
      const childX = parentX + horizontalSpacing;
      const childY = startY + index * verticalSpacing;

      child.position = {
        x: childX,
        y: Math.max(50, childY),
      };

      // Recursively layout sub-branches
      layoutBranches(child.id, childX, child.position.y);
    });
  }

  // Start branch layout from main path nodes
  mainPathNodes.forEach((node) => {
    const positioned = nodeMap.get(node.id);
    if (positioned) {
      layoutBranches(node.id, positioned.position.x, positioned.position.y);
    }
  });

  // 3. Build Edges (Linear Main Path + Anchored Explorations)
  const edges: GraphEdge[] = [];

  // Main path linear edges
  for (let i = 0; i < mainPathNodes.length - 1; i++) {
    const current = mainPathNodes[i];
    const next = mainPathNodes[i + 1];
    edges.push({
      id: `edge-main-${current.id}-${next.id}`,
      source: current.id,
      target: next.id,
      isAnchorEdge: false,
      label: "Main Path",
    });
  }

  // Anchor edges
  anchors.forEach((anchor) => {
    const targetNode = nodeMap.get(anchor.targetNodeId);
    if (targetNode) {
      edges.push({
        id: `edge-anchor-${anchor.id}`,
        source: anchor.sourceNodeId,
        target: anchor.targetNodeId,
        sourceHandle: `anchor-${anchor.id}`,
        targetHandle: "target-in",
        label: `"${anchor.text}"`,
        anchorText: anchor.text,
        isAnchorEdge: true,
      });
    }
  });

  // Additional non-anchor branch edges (e.g. generic branches)
  nodes.forEach((n) => {
    if (n.parentId && !n.isMainPath) {
      const hasAnchorEdge = anchors.some(
        (a) => a.sourceNodeId === n.parentId && a.targetNodeId === n.id
      );
      if (!hasAnchorEdge) {
        edges.push({
          id: `edge-branch-${n.parentId}-${n.id}`,
          source: n.parentId,
          target: n.id,
          isAnchorEdge: false,
          label: "Exploration",
        });
      }
    }
  });

  return {
    nodes: Array.from(nodeMap.values()),
    edges,
  };
}
