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
  | "container"
  | "chair";

export type PresetCategory =
  | "Tavoli"
  | "Sedute"
  | "Decorazioni"
  | "Muri"
  | "Pavimenti"
  | "Segnalini";

export interface TablePreset {
  id: string;
  type: TableShape;
  category: PresetCategory;
  label: string;
  width?: number;
  height?: number;
  radius?: number;
  seats: number; // The "optimal" capacity (standard capacity)
  min_capacity?: number; // Minimum people to occupy this table
  max_capacity?: number; // Maximum people (squeeze capacity)
}

export const TABLE_PRESETS: TablePreset[] = [
  // --- TAVOLI ---
  {
    id: "rect-2",
    type: "rect",
    category: "Tavoli",
    label: "Tavolo 2",
    width: 70,
    height: 70,
    seats: 2,
  },
  {
    id: "rect-4",
    type: "rect",
    category: "Tavoli",
    label: "Tavolo 4",
    width: 120,
    height: 80,
    seats: 4,
  },
  {
    id: "rect-6",
    type: "rect",
    category: "Tavoli",
    label: "Tavolo 6",
    width: 160,
    height: 80,
    seats: 6,
  },
  {
    id: "round-2",
    type: "circle",
    category: "Tavoli",
    label: "Rotondo 2",
    radius: 35,
    seats: 2,
  },
  {
    id: "round-4",
    type: "circle",
    category: "Tavoli",
    label: "Rotondo 4",
    radius: 50,
    seats: 4,
  },
  {
    id: "round-large",
    type: "circle",
    category: "Tavoli",
    label: "Rotondo 8",
    radius: 70,
    seats: 8,
  },

  // --- SEDUTE ---
  {
    id: "chair",
    type: "chair",
    category: "Sedute",
    label: "Sedia",
    width: 16,
    height: 16,
    seats: 0,
  },
  {
    id: "booth",
    type: "booth",
    category: "Sedute",
    label: "Separè",
    width: 120,
    height: 30, // Thicker for booth seating representation
    seats: 0,
  },
  {
    id: "counter",
    type: "counter",
    category: "Sedute",
    label: "Bancone",
    width: 240,
    height: 70,
    seats: 10,
    min_capacity: 4,
    max_capacity: 12,
  },

  // --- DECORAZIONI ---
  {
    id: "plant",
    type: "plant",
    category: "Decorazioni",
    label: "Pianta",
    radius: 20,
    seats: 0,
  },
  {
    id: "column-sq",
    type: "column",
    category: "Decorazioni",
    label: "Colonna",
    width: 40,
    height: 40,
    seats: 0,
  },
  {
    id: "door",
    type: "door",
    category: "Decorazioni",
    label: "Porta",
    width: 100,
    height: 10,
    seats: 0,
  },

  // --- MURI ---
  {
    id: "wall-external",
    type: "wall",
    category: "Muri",
    label: "Esterno",
    width: 200,
    height: 12,
    seats: 0,
  },
  {
    id: "wall-internal",
    type: "wall",
    category: "Muri",
    label: "Interno",
    width: 200,
    height: 8,
    seats: 0,
  },
  {
    id: "wall-fence",
    type: "wall",
    category: "Muri",
    label: "Recinzione",
    width: 200,
    height: 6,
    seats: 0,
  },

  // --- PAVIMENTI ---
  {
    id: "container-floor",
    type: "container",
    category: "Pavimenti",
    label: "Area Base",
    width: 200,
    height: 200,
    seats: 0,
  },
  {
    id: "container-terrace",
    type: "container",
    category: "Pavimenti",
    label: "Terrazza",
    width: 200,
    height: 200,
    seats: 0,
  },

  // --- SEGNALINI ---
  {
    id: "text-label",
    type: "text",
    category: "Segnalini",
    label: "Etichetta",
    width: 100,
    height: 30,
    seats: 0,
  },
  {
    id: "cashier",
    type: "cashier",
    category: "Segnalini",
    label: "Cassa",
    width: 60,
    height: 40,
    seats: 0,
  },
  {
    id: "restroom",
    type: "restroom",
    category: "Segnalini",
    label: "Bagni",
    width: 60,
    height: 60,
    seats: 0,
  },
];
