export type TableShape =
  | "rect"
  | "circle"
  | "wall"
  | "plant"
  | "column"
  | "door"
  | "booth"
  | "counter"
  | "text"
  | "cashier"
  | "restroom"
  | "curved-wall"
  | "container";

export interface TablePreset {
  id: string;
  type: TableShape;
  label: string;
  width?: number;
  height?: number;
  radius?: number;
  seats: number; // The "optimal" capacity (standard capacity)
  min_capacity?: number; // Minimum people to occupy this table
  max_capacity?: number; // Maximum people (squeeze capacity)
}

export const TABLE_PRESETS: TablePreset[] = [
  // --- TABLES ---
  {
    id: "rect-2",
    type: "rect",
    label: "Tavolo 2",
    width: 70,
    height: 70,
    seats: 2,
  },
  {
    id: "rect-4",
    type: "rect",
    label: "Tavolo 4",
    width: 120,
    height: 80,
    seats: 4,
  },
  {
    id: "rect-6",
    type: "rect",
    label: "Tavolo 6",
    width: 160,
    height: 80,
    seats: 6,
  },
  {
    id: "round-2",
    type: "circle",
    label: "Rotondo 2",
    radius: 35,
    seats: 2,
  },
  {
    id: "round-4",
    type: "circle",
    label: "Rotondo 4",
    radius: 50,
    seats: 4,
  },
  {
    id: "round-large",
    type: "circle",
    label: "Rotondo 8",
    radius: 70,
    seats: 8,
  },

  // --- DECORATIONS ---
  {
    id: "wall-h",
    type: "wall",
    label: "Muro",
    width: 200,
    height: 10,
    seats: 0,
  },
  {
    id: "door",
    type: "door",
    label: "Porta",
    width: 100,
    height: 10,
    seats: 0,
  },
  {
    id: "column-sq",
    type: "column",
    label: "Colonna",
    width: 40,
    height: 40,
    seats: 0,
  },
  {
    id: "counter",
    type: "counter",
    label: "Bancone",
    width: 240,
    height: 70,
    seats: 10,
    min_capacity: 4,
    max_capacity: 12,
  },
  {
    id: "booth",
    type: "booth",
    label: "Separè",
    width: 120,
    height: 5, // Thinner than wall (8)
    seats: 0,
  },
  {
    id: "text-label",
    type: "text",
    label: "Etichetta",
    width: 100,
    height: 30,
    seats: 0,
  },
  {
    id: "cashier",
    type: "cashier",
    label: "Cassa",
    width: 60,
    height: 40,
    seats: 0,
  },
  {
    id: "restroom",
    type: "restroom",
    label: "Bagni",
    width: 60,
    height: 60,
    seats: 0,
  },
  {
    id: "container",
    type: "container",
    label: "Area",
    width: 200,
    height: 200,
    seats: 0,
  },
];
