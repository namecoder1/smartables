import { TablePreset } from "../table-presets";

export interface TableInstance extends TablePreset {
  uniqueId: string;
  x: number;
  y: number;
  rotation: number;
  zone_id?: string;
  min_capacity?: number;
  max_capacity?: number;
}

export interface Zone {
  id: string;
  name: string;
  width: number;
  height: number;
}

export interface Guide {
  orientation: "V" | "H";
  lineGuide: number;
  offset: number;
}
