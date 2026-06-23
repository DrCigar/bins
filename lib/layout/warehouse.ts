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
  isStaging?: boolean; // default landing zone for freshly serialized units
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
  { label: "B", zone: "main_warehouse", orientation: "vertical", x: 280, y: 100 },
  { label: "I", zone: "main_warehouse", orientation: "horizontal", x: 303, y: 138, isStaging: true },
  { label: "J", zone: "main_warehouse", orientation: "horizontal", x: 356, y: 138, isStaging: true },
  { label: "K", zone: "main_warehouse", orientation: "horizontal", x: 300, y: 200 },
  { label: "L", zone: "main_warehouse", orientation: "vertical", x: 241, y: 188 },
  { label: "M", zone: "office_den", orientation: "vertical", x: 214, y: 270 },
  { label: "O", zone: "office_den", orientation: "horizontal", x: 99, y: 308 },
  { label: "P", zone: "office_den", orientation: "horizontal", x: 99, y: 352 },
  { label: "N", zone: "office_den", orientation: "vertical", x: 194, y: 380 },
];

// Staging racks (default landing for serialized units), filled in this order.
export const STAGING_RACKS: string[] = RACKS.filter((r) => r.isStaging).map((r) => r.label);

export const ZONE_DIVIDER_Y = 259; // dashed line splitting the zones

// Open drop areas. Inbound (top-left), Outbound (right-upper), Pre-Deployment (right-lower).
export const INBOUND_AREA = { label: "Inbound", x: 55, y: 48, w: 128, h: 90 };
export const OUTBOUND_AREA = { label: "Outbound", x: 505, y: 40, w: 150, h: 130 };
export const PRE_DEPLOYMENT_AREA = { label: "Pre-Deployment", x: 505, y: 200, w: 150, h: 210 };

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
