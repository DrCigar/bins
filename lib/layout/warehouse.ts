export const PRE_DEPLOYMENT_CAPACITY = 30;

export type Zone = "main_warehouse" | "office_den";
export type Material = "silver" | "black";

export interface RackConfig {
  label: string;
  zone: Zone;
  rows: number;
  cols: number;
  material: Material;
  // Map geometry in the 680x440 floor coordinate space.
  x: number;
  y: number;
  w: number;
  h: number;
  isStaging?: boolean; // default landing zone for freshly serialized units
}

// Roster (18 racks). Standard racks are 5x5 = 25 (black, real metal racks are black);
// the new metal racks AA/EE/FF (4x2 = 8) and HH/II (4x4 = 16) are silver.
export const RACKS: RackConfig[] = [
  // Main warehouse — top row
  { label: "H", zone: "main_warehouse", rows: 5, cols: 5, material: "black", x: 176, y: 40, w: 16, h: 50 },
  { label: "AA", zone: "main_warehouse", rows: 4, cols: 2, material: "silver", x: 258, y: 40, w: 28, h: 16 },
  { label: "GG", zone: "main_warehouse", rows: 4, cols: 2, material: "silver", x: 258, y: 72, w: 28, h: 16 },
  { label: "A", zone: "main_warehouse", rows: 5, cols: 5, material: "black", x: 292, y: 40, w: 16, h: 50 },
  { label: "B", zone: "main_warehouse", rows: 5, cols: 5, material: "black", x: 310, y: 40, w: 16, h: 50 },
  { label: "BB", zone: "main_warehouse", rows: 4, cols: 2, material: "silver", x: 328, y: 40, w: 28, h: 16 },
  { label: "C", zone: "main_warehouse", rows: 5, cols: 5, material: "black", x: 360, y: 40, w: 16, h: 50 },
  { label: "D", zone: "main_warehouse", rows: 5, cols: 5, material: "black", x: 378, y: 40, w: 16, h: 50 },
  { label: "CC", zone: "main_warehouse", rows: 4, cols: 2, material: "silver", x: 400, y: 40, w: 28, h: 16 },
  { label: "E", zone: "main_warehouse", rows: 5, cols: 5, material: "black", x: 434, y: 40, w: 16, h: 50 },
  { label: "F", zone: "main_warehouse", rows: 5, cols: 5, material: "black", x: 452, y: 40, w: 16, h: 50 },
  // Main warehouse — middle
  { label: "G", zone: "main_warehouse", rows: 5, cols: 5, material: "black", x: 287, y: 116, w: 16, h: 50 },
  { label: "HH", zone: "main_warehouse", rows: 4, cols: 4, material: "silver", x: 303, y: 156, w: 54, h: 22, isStaging: true },
  { label: "II", zone: "main_warehouse", rows: 4, cols: 4, material: "silver", x: 357, y: 156, w: 54, h: 22, isStaging: true },
  { label: "I", zone: "main_warehouse", rows: 5, cols: 5, material: "black", x: 303, y: 206, w: 54, h: 16 },
  { label: "EE", zone: "main_warehouse", rows: 4, cols: 2, material: "silver", x: 185, y: 150, w: 16, h: 24 },
  { label: "FF", zone: "main_warehouse", rows: 4, cols: 2, material: "silver", x: 185, y: 182, w: 16, h: 24 },
  // Office / Den
  { label: "K", zone: "office_den", rows: 5, cols: 5, material: "black", x: 60, y: 310, w: 50, h: 16 },
  { label: "L", zone: "office_den", rows: 5, cols: 5, material: "black", x: 60, y: 360, w: 50, h: 16 },
  { label: "N", zone: "office_den", rows: 5, cols: 5, material: "black", x: 125, y: 310, w: 50, h: 16 },
  { label: "M", zone: "office_den", rows: 5, cols: 5, material: "black", x: 180, y: 280, w: 16, h: 50 },
  { label: "J", zone: "office_den", rows: 5, cols: 5, material: "black", x: 195, y: 360, w: 16, h: 50 },
];

const RACK_BY_LABEL: Record<string, RackConfig> = Object.fromEntries(RACKS.map((r) => [r.label, r]));
export const getRack = (label: string): RackConfig | undefined => RACK_BY_LABEL[label];
export const rackCapacity = (label: string): number => {
  const r = RACK_BY_LABEL[label];
  return r ? r.rows * r.cols : 0;
};
export const rackCols = (label: string): number => RACK_BY_LABEL[label]?.cols ?? 5;

// Convert a 1-based slot number into the rack's row.col label, e.g. M slot 6 -> "M2.1".
export function slotLabel(rackLabel: string, slot: number): string {
  const cols = rackCols(rackLabel);
  const row = Math.floor((slot - 1) / cols) + 1;
  const col = ((slot - 1) % cols) + 1;
  return `${rackLabel}${row}.${col}`;
}

// Staging racks (default landing for serialized units), filled in this order.
export const STAGING_RACKS: string[] = RACKS.filter((r) => r.isStaging).map((r) => r.label);

export const ZONE_DIVIDER_Y = 259; // dashed line splitting the zones

// Open drop areas.
export const INBOUND_AREA = { label: "Inbound", x: 55, y: 48, w: 120, h: 84 };
export const OUTBOUND_AREA = { label: "Outbound", x: 505, y: 40, w: 150, h: 120 };
export const PRE_DEPLOYMENT_AREA = { label: "Pre-Deployment", x: 505, y: 200, w: 150, h: 200 };

// cap = max occupants; null = unlimited.
export const AREAS: Array<{ label: string; x: number; y: number; w: number; h: number; cap: number | null }> = [
  { ...INBOUND_AREA, cap: 10 },
  { ...PRE_DEPLOYMENT_AREA, cap: PRE_DEPLOYMENT_CAPACITY },
  { ...OUTBOUND_AREA, cap: null },
];
export const areaCapacity = (label: string): number | null => {
  const a = AREAS.find((x) => x.label === label);
  return a ? a.cap : null;
};

export const FLOOR = { w: 680, h: 440 };
// Display scale — renders the whole floor larger than the design coordinate space.
export const MAP_SCALE = 1.35;
