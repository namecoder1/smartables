import { v4 as uuidv4 } from "uuid";
import { TableInstance } from "./types";
import { Layout } from "lucide-react";

export type PresetShape =
  | "rectangle"
  | "l-shape"
  | "u-shape"
  | "open-space"
  | "t-shape"
  | "gazebo"
  | "gazebo-divided"
  | "bar-counter"
  | "booth-hall"
  | "veranda-narrow"
  | "courtyard"
  | "mezzanine"
  | "lounge-open"
  | "circular-room"
  | "circular-corner";
export type ZoneType = "indoor" | "outdoor" | "terrace" | "bar" | "other";

export interface PresetDefinition {
  id: PresetShape;
  label: string;
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  icon?: any;
  allowedTypes?: ZoneType[];
}

export const PRESET_SHAPES: PresetDefinition[] = [
  {
    id: "rectangle",
    label: "Rettangolare / Quadrata",
    description:
      "La forma più comune. Ideale per sale standard, verande o dehor regolari.",
    defaultWidth: 1000,
    defaultHeight: 800,
    // Rectangle is universal
    allowedTypes: ["indoor", "outdoor", "terrace", "bar", "other"],
  },
  {
    id: "l-shape",
    label: "A forma di L",
    description: "Per sale ad angolo o spazi che avvolgono cucina/bar.",
    defaultWidth: 1200,
    defaultHeight: 1000,
    allowedTypes: ["indoor", "terrace", "bar", "other"],
  },
  {
    id: "u-shape",
    label: "A forma di U",
    description: "Sale che circondano una corte interna o un blocco centrale.",
    defaultWidth: 1200,
    defaultHeight: 1200,
    allowedTypes: ["indoor", "outdoor", "other"],
  },
  {
    id: "open-space",
    label: "Open Space con Colonne",
    description: "Grande sala con colonne strutturali già posizionate.",
    defaultWidth: 1500,
    defaultHeight: 1000,
    allowedTypes: ["indoor", "terrace", "other"],
  },
  {
    id: "t-shape",
    label: "A forma di T",
    description:
      "Ideale per unire due ambienti o per sale con ingresso centrale.",
    defaultWidth: 1200,
    defaultHeight: 1000,
    allowedTypes: ["indoor", "other"],
  },
  {
    id: "gazebo",
    label: "Gazebo / Pergola",
    description: "Struttura esterna delimitata da colonne agli angoli.",
    defaultWidth: 800,
    defaultHeight: 800,
    allowedTypes: ["outdoor", "terrace", "other"],
  },
  {
    id: "gazebo-divided",
    label: "Gazebo Lungo con Separè",
    description:
      "Struttura esterna rettangolare allungata con divisori trasversali.",
    defaultWidth: 1600,
    defaultHeight: 800,
    allowedTypes: ["outdoor", "terrace", "other"],
  },
  {
    id: "bar-counter",
    label: "Area Banco Bar",
    description: "Sala con struttura a L preimpostata per il bancone.",
    defaultWidth: 1000,
    defaultHeight: 800,
    allowedTypes: ["bar", "indoor"],
  },
  {
    id: "booth-hall",
    label: "Sala con Booth",
    description: "Disposizione con divisori laterali per tavoli riservati.",
    defaultWidth: 1200,
    defaultHeight: 1000,
    allowedTypes: ["indoor", "bar"],
  },
  {
    id: "veranda-narrow",
    label: "Porticato / Veranda Stretta",
    description:
      "Spazio lungo e stretto, aperto su un lato e chiuso dall'edificio sull'altro.",
    defaultWidth: 2000,
    defaultHeight: 400,
    allowedTypes: ["outdoor", "terrace", "other"],
  },
  {
    id: "courtyard",
    label: "Cortile Interno / Chiostro",
    description:
      "Area con spazio centrale vuoto e tavoli disposti lungo il perimetro.",
    defaultWidth: 1200,
    defaultHeight: 1200,
    allowedTypes: ["outdoor", "other"],
  },
  {
    id: "mezzanine",
    label: "Soppalco / Area Rialzata",
    description:
      "Area delimitata da ringhiere o transenne invece che da muri completi.",
    defaultWidth: 1000,
    defaultHeight: 800,
    allowedTypes: ["indoor", "terrace", "other"],
  },
  {
    id: "lounge-open",
    label: "Area Lounge Aperta",
    description:
      "Spazio aperto senza muri, delimitato idealmente da elementi bassi.",
    defaultWidth: 1000,
    defaultHeight: 800,
    allowedTypes: ["outdoor", "terrace", "bar", "other"],
  },
  {
    id: "circular-room",
    label: "Sala Circolare",
    description: "Ambiente rotondo o a cupola, racchiuso da pareti curve.",
    defaultWidth: 1000,
    defaultHeight: 1000,
    allowedTypes: ["indoor", "outdoor", "other"],
  },
  {
    id: "circular-corner",
    label: "Sala con Angolo Circolare",
    description: "Stanza squadrata in cui uno degli angoli è curvo / smussato.",
    defaultWidth: 1000,
    defaultHeight: 1000,
    allowedTypes: ["indoor", "terrace", "other"],
  },
];

export const ZONE_TYPES: { id: ZoneType; label: string; icon: string }[] = [
  { id: "indoor", label: "Sala Interna", icon: "🏠" },
  { id: "outdoor", label: "Dehor / Giardino", icon: "🌳" },
  { id: "terrace", label: "Terrazza / Rooftop", icon: "☀️" },
  { id: "bar", label: "Area Bar", icon: "🍸" },
  { id: "other", label: "Altro", icon: "✨" },
];

/**
 * Generates the initial tables (walls, columns, etc) for a given preset.
 *
 * @param shape The selected shape preset
 * @param width The width of the ENTIRE bounding box
 * @param height The height of the ENTIRE bounding box
 * @param zoneId The ID of the zone being created
 */
export function generatePresetLayout(
  shape: PresetShape,
  width: number,
  height: number,
  zoneId: string,
): TableInstance[] {
  const tables: TableInstance[] = [];
  const WALL_THICKNESS = 10;

  const createWall = (
    x: number,
    y: number,
    w: number,
    h: number,
  ): TableInstance => ({
    id: `wall-gen-${uuidv4().slice(0, 8)}`,
    uniqueId: uuidv4(),
    type: "wall",
    category: "Muri",
    label: "Muro",
    seats: 0,
    width: w,
    height: h,
    x: x,
    y: y,
    rotation: 0,
    zone_id: zoneId,
  });

  const createColumn = (x: number, y: number, size = 40): TableInstance => ({
    id: `col-gen-${uuidv4().slice(0, 8)}`,
    uniqueId: uuidv4(),
    type: "column",
    category: "Decorazioni",
    label: "Colonna",
    seats: 0,
    width: size,
    height: size,
    x: x,
    y: y,
    rotation: 0,
    zone_id: zoneId,
  });

  switch (shape) {
    case "l-shape":
      // L-Shape Logic: Standard "L" (Vertical Leg on Left, Horizontal Leg on Bottom)
      // We use 6 walls to outline the L.

      const l_legW = width * 0.3; // Width of the vertical leg
      const l_legH = height * 0.3; // Height of the horizontal leg

      // 1. External Left (Full Height)
      tables.push(
        createWall(WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height),
      );

      // 2. External Bottom (Full Width)
      tables.push(
        createWall(
          width / 2,
          height - WALL_THICKNESS / 2,
          width,
          WALL_THICKNESS,
        ),
      );

      // 3. External Top (Short - Top of Left Leg)
      tables.push(
        createWall(l_legW / 2, WALL_THICKNESS / 2, l_legW, WALL_THICKNESS),
      );

      // 4. External Right (Short - Right of Bottom Leg)
      tables.push(
        createWall(
          width - WALL_THICKNESS / 2,
          height - l_legH / 2,
          WALL_THICKNESS,
          l_legH,
        ),
      );

      // 5. Inner Vertical (Right side of Left Leg)
      // Starts at y=0 (or overlaps top?) -> Let's start at y=WALL_THICKNESS/2 to match top wall center?
      // Actually, let's span from Top Wall to Inner Corner.
      // Top Wall y=0..THICK.
      // Inner Vertical should go from y=0 to y = height - l_legH.
      // Center Y = (height - l_legH) / 2.
      // Center X = l_legW - WALL_THICKNESS / 2.
      tables.push(
        createWall(
          l_legW - WALL_THICKNESS / 2,
          (height - l_legH) / 2,
          WALL_THICKNESS,
          height - l_legH,
        ),
      );

      // 6. Inner Horizontal (Top side of Bottom Leg)
      // Spans from Inner Corner to Right Wall.
      // x = l_legW to width.
      // Center X = l_legW + (width - l_legW) / 2.
      // Center Y = height - l_legH + WALL_THICKNESS / 2.
      tables.push(
        createWall(
          l_legW + (width - l_legW) / 2,
          height - l_legH + WALL_THICKNESS / 2,
          width - l_legW,
          WALL_THICKNESS,
        ),
      );

      break;

    case "u-shape":
      // U-Shape: Opening at bottom? Or top? Let's say opening at bottom.
      // Top, Left, Right walls full.
      // Inner block removed.

      const uThick = width * 0.3; // Thickness of the U arms

      // Top Wall
      tables.push(
        createWall(width / 2, WALL_THICKNESS / 2, width, WALL_THICKNESS),
      );
      // Left Wall
      tables.push(
        createWall(WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height),
      );
      // Right Wall
      tables.push(
        createWall(
          width - WALL_THICKNESS / 2,
          height / 2,
          WALL_THICKNESS,
          height,
        ),
      );

      // Bottom Tips closures?
      tables.push(
        createWall(
          uThick / 2,
          height - WALL_THICKNESS / 2,
          uThick,
          WALL_THICKNESS,
        ),
      ); // Left tip
      tables.push(
        createWall(
          width - uThick / 2,
          height - WALL_THICKNESS / 2,
          uThick,
          WALL_THICKNESS,
        ),
      ); // Right tip

      // Inner walls
      tables.push(
        createWall(
          uThick + WALL_THICKNESS / 2,
          height / 2 + uThick / 2,
          WALL_THICKNESS,
          height - uThick,
        ),
      ); // Left Inner
      tables.push(
        createWall(
          width - uThick - WALL_THICKNESS / 2,
          height / 2 + uThick / 2,
          WALL_THICKNESS,
          height - uThick,
        ),
      ); // Right Inner
      tables.push(
        createWall(
          width / 2,
          uThick + WALL_THICKNESS / 2,
          width - 2 * uThick,
          WALL_THICKNESS,
        ),
      ); // Top Inner

      break;

    case "open-space":
      // Just a rectangle but with some columns inside
      // 2 columns
      tables.push(createColumn(width * 0.33, height * 0.5));
      tables.push(createColumn(width * 0.66, height * 0.5));
      break;

    case "t-shape":
      // T-Shape
      // Vertical Leg in center, Horizontal top bar
      const tBarH = height * 0.3;
      const tLegW = width * 0.35;

      // Horizontal Top Bar (Full Width)
      // Top Wall
      tables.push(
        createWall(width / 2, WALL_THICKNESS / 2, width, WALL_THICKNESS),
      );
      // Left part of bottom of top bar
      tables.push(
        createWall(
          (width - tLegW) / 4,
          tBarH - WALL_THICKNESS / 2,
          (width - tLegW) / 2,
          WALL_THICKNESS,
        ),
      );
      // Right part of bottom of top bar
      tables.push(
        createWall(
          width - (width - tLegW) / 4,
          tBarH - WALL_THICKNESS / 2,
          (width - tLegW) / 2,
          WALL_THICKNESS,
        ),
      );
      // Left End
      tables.push(
        createWall(WALL_THICKNESS / 2, tBarH / 2, WALL_THICKNESS, tBarH),
      );
      // Right End
      tables.push(
        createWall(
          width - WALL_THICKNESS / 2,
          tBarH / 2,
          WALL_THICKNESS,
          tBarH,
        ),
      );

      // Vertical Leg (Center)
      // Leg Left Wall
      tables.push(
        createWall(
          (width - tLegW) / 2 + WALL_THICKNESS / 2,
          tBarH + (height - tBarH) / 2,
          WALL_THICKNESS,
          height - tBarH,
        ),
      );
      // Leg Right Wall
      tables.push(
        createWall(
          width - (width - tLegW) / 2 - WALL_THICKNESS / 2,
          tBarH + (height - tBarH) / 2,
          WALL_THICKNESS,
          height - tBarH,
        ),
      );
      // Leg Bottom Wall
      tables.push(
        createWall(
          width / 2,
          height - WALL_THICKNESS / 2,
          tLegW,
          WALL_THICKNESS,
        ),
      );
      break;

    case "gazebo":
      // 4 Columns at corners
      const colSize = 50;
      const margin = 50;
      tables.push(createColumn(margin, margin, colSize));
      tables.push(createColumn(width - margin, margin, colSize));
      tables.push(createColumn(margin, height - margin, colSize));
      tables.push(createColumn(width - margin, height - margin, colSize));
      break;

    case "gazebo-divided":
      // Long gazebo with 6 columns and internal dividers
      const gdMargin = 50;
      const gdColSize = 50;
      // 6 columns (corners + middle)
      tables.push(createColumn(gdMargin, gdMargin, gdColSize));
      tables.push(createColumn(width / 2, gdMargin, gdColSize));
      tables.push(createColumn(width - gdMargin, gdMargin, gdColSize));
      tables.push(createColumn(gdMargin, height - gdMargin, gdColSize));
      tables.push(createColumn(width / 2, height - gdMargin, gdColSize));
      tables.push(createColumn(width - gdMargin, height - gdMargin, gdColSize));

      // Dividers. Two transverse dividers, leaving a passage gap at the bottom.
      const gdDivWidth = 20; // Divider thickness
      const gdDivLength = height - 2 * gdMargin - 150; // Leave a passage of 150px
      // Top-aligned dividers
      tables.push({
        ...createWall(
          width / 3,
          gdMargin + gdDivLength / 2,
          gdDivWidth,
          gdDivLength,
        ),
        label: "Separè",
      });
      tables.push({
        ...createWall(
          (2 * width) / 3,
          gdMargin + gdDivLength / 2,
          gdDivWidth,
          gdDivLength,
        ),
        label: "Separè",
      });
      break;

    case "bar-counter":
      // L-shaped counter in top-right corner? Or top-left.
      // Let's do a Top-Left counter.
      // Counter is basically walls but maybe thicker? Or just walls.
      // Let's use walls to define the counter area.
      const counterThickness = 60;
      const counterLength = Math.min(width, height) * 0.6;

      // Vertical part against left wall
      tables.push({
        ...createWall(
          counterThickness / 2 + 50,
          50 + counterLength / 2,
          counterThickness,
          counterLength,
        ),
        label: "Bancone",
      });

      // Horizontal part
      tables.push({
        ...createWall(
          50 + counterLength / 2 + counterThickness / 2 /* offset shift */,
          50 + counterThickness / 2,
          counterLength,
          counterThickness,
        ),
        label: "Bancone",
      });
      break;

    case "booth-hall":
      // Add Perimeter Walls
      // Top Wall
      tables.push(
        createWall(width / 2, WALL_THICKNESS / 2, width, WALL_THICKNESS),
      );
      // Bottom Wall
      tables.push(
        createWall(
          width / 2,
          height - WALL_THICKNESS / 2,
          width,
          WALL_THICKNESS,
        ),
      );
      // Left Wall
      tables.push(
        createWall(WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height),
      );
      // Right Wall
      tables.push(
        createWall(
          width - WALL_THICKNESS / 2,
          height / 2,
          WALL_THICKNESS,
          height,
        ),
      );

      // Dividers along left and right walls
      const dividerLen = 100;
      const spacing = 200;

      // Left side dividers (attached to Left Wall, extending inwards)
      // Left Wall ends at WALL_THICKNESS. Divider starts there.
      // Center of divider = WALL_THICKNESS + dividerLen / 2
      for (let y = 200; y < height - 200; y += spacing) {
        tables.push({
          ...createWall(
            WALL_THICKNESS + dividerLen / 2,
            y,
            dividerLen,
            WALL_THICKNESS,
          ),
          label: "Divisorio",
        });
      }

      // Right side dividers (attached to Right Wall, extending inwards)
      // Right Wall starts at width - WALL_THICKNESS. Divider ends there.
      // Center of divider = width - WALL_THICKNESS - dividerLen / 2
      for (let y = 200; y < height - 200; y += spacing) {
        tables.push({
          ...createWall(
            width - WALL_THICKNESS - dividerLen / 2,
            y,
            dividerLen,
            WALL_THICKNESS,
          ),
          label: "Divisorio",
        });
      }
      break;

    case "veranda-narrow":
      // Long rectangle, closed on top, left, right, open on bottom.
      tables.push(
        createWall(width / 2, WALL_THICKNESS / 2, width, WALL_THICKNESS),
      ); // Top (building wall)
      tables.push(
        createWall(WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height),
      ); // Left
      tables.push(
        createWall(
          width - WALL_THICKNESS / 2,
          height / 2,
          WALL_THICKNESS,
          height,
        ),
      ); // Right
      break;

    case "courtyard":
      // Outer perimeter walls
      tables.push(
        createWall(width / 2, WALL_THICKNESS / 2, width, WALL_THICKNESS),
      ); // Top
      tables.push(
        createWall(
          width / 2,
          height - WALL_THICKNESS / 2,
          width,
          WALL_THICKNESS,
        ),
      ); // Bottom
      tables.push(
        createWall(WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height),
      ); // Left
      tables.push(
        createWall(
          width - WALL_THICKNESS / 2,
          height / 2,
          WALL_THICKNESS,
          height,
        ),
      ); // Right

      // Inner "hole" walls (courtyard center) - let's make it 50% of total size
      const cw = width * 0.5;
      const ch = height * 0.5;
      tables.push(createWall(width / 2, (height - ch) / 2, cw, WALL_THICKNESS)); // Inner Top
      tables.push(
        createWall(width / 2, height - (height - ch) / 2, cw, WALL_THICKNESS),
      ); // Inner Bottom
      tables.push(createWall((width - cw) / 2, height / 2, WALL_THICKNESS, ch)); // Inner Left
      tables.push(
        createWall(width - (width - cw) / 2, height / 2, WALL_THICKNESS, ch),
      ); // Inner Right
      break;

    case "mezzanine":
      // Rectangle with thinner, semi-transparent feeling walls (labeled differently)
      const transennaThick = 5;
      tables.push({
        ...createWall(width / 2, transennaThick / 2, width, transennaThick),
        label: "Ringhiera",
      });
      tables.push({
        ...createWall(
          width / 2,
          height - transennaThick / 2,
          width,
          transennaThick,
        ),
        label: "Ringhiera",
      });
      tables.push({
        ...createWall(transennaThick / 2, height / 2, transennaThick, height),
        label: "Ringhiera",
      });
      tables.push({
        ...createWall(
          width - transennaThick / 2,
          height / 2,
          transennaThick,
          height,
        ),
        label: "Ringhiera",
      });
      break;

    case "lounge-open":
      // Corners just hinted with short planter walls.
      const loungeWallLen = width * 0.2;
      tables.push({
        ...createWall(
          loungeWallLen / 2,
          WALL_THICKNESS / 2,
          loungeWallLen,
          WALL_THICKNESS,
        ),
        label: "Fioriera",
      });
      tables.push({
        ...createWall(
          width - loungeWallLen / 2,
          WALL_THICKNESS / 2,
          loungeWallLen,
          WALL_THICKNESS,
        ),
        label: "Fioriera",
      });
      tables.push({
        ...createWall(
          loungeWallLen / 2,
          height - WALL_THICKNESS / 2,
          loungeWallLen,
          WALL_THICKNESS,
        ),
        label: "Fioriera",
      });
      tables.push({
        ...createWall(
          width - loungeWallLen / 2,
          height - WALL_THICKNESS / 2,
          loungeWallLen,
          WALL_THICKNESS,
        ),
        label: "Fioriera",
      });

      tables.push({
        ...createWall(
          WALL_THICKNESS / 2,
          loungeWallLen / 2,
          WALL_THICKNESS,
          loungeWallLen,
        ),
        label: "Fioriera",
      });
      tables.push({
        ...createWall(
          WALL_THICKNESS / 2,
          height - loungeWallLen / 2,
          WALL_THICKNESS,
          loungeWallLen,
        ),
        label: "Fioriera",
      });
      tables.push({
        ...createWall(
          width - WALL_THICKNESS / 2,
          loungeWallLen / 2,
          WALL_THICKNESS,
          loungeWallLen,
        ),
        label: "Fioriera",
      });
      tables.push({
        ...createWall(
          width - WALL_THICKNESS / 2,
          height - loungeWallLen / 2,
          WALL_THICKNESS,
          loungeWallLen,
        ),
        label: "Fioriera",
      });
      break;

    case "circular-room":
      // A perfect circle using curved-wall shapes.
      // E.g. we use 4 quadrants of arcs (90 degrees each) to make a full circle.
      const radiusX = width / 2;
      const radiusY = height / 2;
      const radiusRoom = Math.min(radiusX, radiusY);
      const rCenterX = width / 2;
      const rCenterY = height / 2;

      for (let i = 0; i < 4; i++) {
        tables.push({
          id: `wall-curved-${uuidv4().slice(0, 8)}`,
          uniqueId: uuidv4(),
          type: "curved-wall",
          category: "Muri",
          label: "Muro Curvo",
          seats: 0,
          width: radiusRoom, // Inner/Outer arc mapped via width/radius in CanvasItem
          height: 90, // Angle of the arc
          radius: WALL_THICKNESS, // Thickness of the curved wall
          x: rCenterX,
          y: rCenterY,
          rotation: i * 90, // Rotate quadrants
          zone_id: zoneId,
        });
      }
      break;

    case "circular-corner":
      // Square room but top-right corner is rounded.
      tables.push(
        createWall(
          width / 2,
          height - WALL_THICKNESS / 2,
          width,
          WALL_THICKNESS,
        ),
      ); // Bottom
      tables.push(
        createWall(WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height),
      ); // Left

      const cornerRadius = Math.min(width, height) * 0.4;

      // Top wall (stops before corner)
      tables.push(
        createWall(
          (width - cornerRadius) / 2,
          WALL_THICKNESS / 2,
          width - cornerRadius,
          WALL_THICKNESS,
        ),
      );
      // Right wall (stops before corner)
      tables.push(
        createWall(
          width - WALL_THICKNESS / 2,
          (height + cornerRadius) / 2,
          WALL_THICKNESS,
          height - cornerRadius,
        ),
      );

      // Arc for the corner (top-right, orientation -90, sweep 90)
      const arcCenterX = width - cornerRadius;
      const arcCenterY = cornerRadius;

      tables.push({
        id: `wall-curved-${uuidv4().slice(0, 8)}`,
        uniqueId: uuidv4(),
        type: "curved-wall",
        category: "Muri",
        label: "Angolo Curvo",
        seats: 0,
        width: cornerRadius, // Radius
        height: 90, // Angle
        radius: WALL_THICKNESS, // Thickness
        x: arcCenterX,
        y: arcCenterY,
        rotation: -90, // Top-right orientation
        zone_id: zoneId,
      });
      break;

    default:
      // Rectangle: No walls by default? Or perimeter?
      // Usually users treat the "Canvas" as the floor.
      // Let's NOT add perimeter walls for simple rectangle,
      // as it might annoy users who just want to place tables in the void.
      break;
  }

  return tables;
}
