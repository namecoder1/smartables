import { TableInstance, Guide } from "./types";

export const GRID_SIZE = 20;

export const snapToGrid = (val: number) => {
  return Math.round(val / GRID_SIZE) * GRID_SIZE;
};

export const getLineGuideStops = (
  items: TableInstance[],
  skipId: string,
  zoneWidth: number,
  zoneHeight: number,
) => {
  const vertical: number[] = [0, zoneWidth / 2, zoneWidth];
  const horizontal: number[] = [0, zoneHeight / 2, zoneHeight];

  // Add Grid Lines (every 20px)
  for (let x = 0; x <= zoneWidth; x += GRID_SIZE) {
    vertical.push(x);
  }
  for (let y = 0; y <= zoneHeight; y += GRID_SIZE) {
    horizontal.push(y);
  }

  items.forEach((item) => {
    if (item.uniqueId === skipId) {
      return;
    }

    // Center
    vertical.push(item.x);
    horizontal.push(item.y);

    let w = item.width || 0;
    let h = item.height || 0;

    // Handle Rotation for Bounding Box (90/270 swap)
    const rot = Math.abs(item.rotation || 0) % 180;
    if (rot === 90) {
      const temp = w;
      w = h;
      h = temp;
    }

    const halfW = item.radius ? item.radius : w / 2;
    const halfH = item.radius ? item.radius : h / 2;

    vertical.push(item.x - halfW); // Left
    vertical.push(item.x + halfW); // Right

    horizontal.push(item.y - halfH); // Top
    horizontal.push(item.y + halfH); // Bottom
  });

  return { vertical, horizontal };
};

export const getObjectSnappingEdges = (node: any, table: TableInstance) => {
  const currentX = node.x();
  const currentY = node.y();

  let w = table.width || 0;
  let h = table.height || 0;

  // Use radius for dimensions if circle/column
  if (table.radius) {
    w = table.radius * 2;
    h = table.radius * 2;
  }

  // Handle Rotation (90 deg swap) for Snap Edges
  const rot = Math.abs(node.rotation() || 0) % 180;
  if (rot === 90) {
    const temp = w;
    w = h;
    h = temp;
  }

  const halfW = w / 2;
  const halfH = h / 2;

  // Offset Logic:
  // If we match a guide at 'guide', and we are 'start' (Left) edge:
  // Left Edge = Center - halfW.
  // We want Left Edge == Guide.
  // Center - halfW = Guide.
  // Center = Guide + halfW.
  // We return 'offset' such that Center = Guide - offset.
  // So Guide + halfW = Guide - offset  =>  offset = -halfW.

  // If 'end' (Right) edge:
  // Right Edge = Center + halfW.
  // Right Edge == Guide.
  // Center = Guide - halfW.
  // Center = Guide - offset => offset = halfW.

  return {
    vertical: [
      { guide: currentX - halfW, offset: -halfW, snap: "start" },
      { guide: currentX, offset: 0, snap: "center" },
      { guide: currentX + halfW, offset: halfW, snap: "end" },
    ],
    horizontal: [
      { guide: currentY - halfH, offset: -halfH, snap: "start" },
      { guide: currentY, offset: 0, snap: "center" },
      { guide: currentY + halfH, offset: halfH, snap: "end" },
    ],
  };
};

export const getGuides = (lineGuideStops: any, itemBounds: any) => {
  const resultV: any[] = [];
  const resultH: any[] = [];
  const GUIDELINE_OFFSET = 10; // Snap distance

  lineGuideStops.vertical.forEach((lineGuide: number) => {
    itemBounds.vertical.forEach((itemBound: any) => {
      const diff = Math.abs(lineGuide - itemBound.guide);
      if (diff < GUIDELINE_OFFSET) {
        resultV.push({
          lineGuide: lineGuide,
          diff: diff,
          snap: itemBound.snap,
          offset: itemBound.offset,
        });
      }
    });
  });

  lineGuideStops.horizontal.forEach((lineGuide: number) => {
    itemBounds.horizontal.forEach((itemBound: any) => {
      const diff = Math.abs(lineGuide - itemBound.guide);
      if (diff < GUIDELINE_OFFSET) {
        resultH.push({
          lineGuide: lineGuide,
          diff: diff,
          snap: itemBound.snap,
          offset: itemBound.offset,
        });
      }
    });
  });

  const guides: Guide[] = [];

  const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
  if (minV) {
    guides.push({
      lineGuide: minV.lineGuide,
      offset: minV.offset,
      orientation: "V",
    });
  }

  const minH = resultH.sort((a, b) => a.diff - b.diff)[0];
  if (minH) {
    guides.push({
      lineGuide: minH.lineGuide,
      offset: minH.offset,
      orientation: "H",
    });
  }

  return guides;
};
