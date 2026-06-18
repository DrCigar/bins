export const RACK_SLOTS = 25;
export const PRE_DEPLOYMENT_CAPACITY = 30;

export type Zone = "main_warehouse" | "office_den";
export type Orientation = "vertical" | "horizontal";

export interface RackConfig {
  label: string;
  zone: Zone;
  orientation: Orientation;
  x: number; // top-left in the 680x440 floor coordinate space
  y: number;
}

// Positions match the approved mockup. Vertical = 16x50, horizontal = 50x16.
export const RACKS: RackConfig[] = [
  { label: "A", zone: "main_warehouse", orientation: "vertical", x: 197, y: 48 },
  { label: "C", zone: "main_warehouse", orientation: "vertical", x: 303, y: 26 },
  { label: "D", zone: "main_warehouse", orientation: "vertical", x: 320, y: 26 },
  { label: "E", zone: "main_warehouse", orientation: "vertical", x: 374, y: 26 },
  { label: "F", zone: "main_warehouse", orientation: "vertical", x: 391, y: 26 },
  { label: "G", zone: "main_warehouse", orientation: "vertical", x: 430, y: 26 },
  { label: "H", zone: "main_warehouse", orientation: "vertical", x: 447, y: 26 },
  { label: "B", zone: "main_warehouse", orientation: "vertical", x: 287, y: 110 },
  { label: "I", zone: "main_warehouse", orientation: "horizontal", x: 303, y: 110 },
  { label: "J", zone: "main_warehouse", orientation: "horizontal", x: 356, y: 110 },
  { label: "K", zone: "main_warehouse", orientation: "horizontal", x: 303, y: 154 },
  { label: "L", zone: "main_warehouse", orientation: "vertical", x: 241, y: 158 },
  { label: "M", zone: "office_den", orientation: "vertical", x: 214, y: 270 },
  { label: "O", zone: "office_den", orientation: "horizontal", x: 99, y: 308 },
  { label: "P", zone: "office_den", orientation: "horizontal", x: 99, y: 352 },
  { label: "N", zone: "office_den", orientation: "vertical", x: 194, y: 380 },
];

export const ZONE_DIVIDER_Y = 259; // dashed line splitting the zones

// Right-side open areas. Outbound (unlimited) sits above Pre-Deployment (capped).
export const OUTBOUND_AREA = { label: "Outbound", x: 505, y: 40, w: 150, h: 130 };
export const PRE_DEPLOYMENT_AREA = { label: "Pre-Deployment", x: 505, y: 200, w: 150, h: 210 };

export const FLOOR = { w: 680, h: 440 };
// Display scale — renders the whole floor larger than the design coordinate space.
export const MAP_SCALE = 1.35;
