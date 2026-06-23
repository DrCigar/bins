export const MODELS = ["Matsuda", "Hanasis", "Yunos"] as const;
export type Model = (typeof MODELS)[number];

export const ROLES = ["Primary", "Secondary"] as const;
export type Role = (typeof ROLES)[number];

export const STATUSES = ["New", "Used", "Broken"] as const;
export type Status = (typeof STATUSES)[number];

export const PRODUCT_LINES = ["360 Pro", "360 Smoke"] as const;
export type ProductLine = (typeof PRODUCT_LINES)[number];

export const ASSEMBLERS = ["Thang", "Jeremy"] as const;

// Serial prefix per product line + role (e.g. 360 Smoke Primary -> SMKP).
export const SERIAL_PREFIX: Record<ProductLine, Record<Role, string>> = {
  "360 Pro": { Primary: "S36P", Secondary: "S36S" },
  "360 Smoke": { Primary: "SMKP", Secondary: "SMKS" },
};

// location is a rack label (e.g. "A"), an open area, or "Out" (checked out to a store)
export const PRE_DEPLOYMENT = "Pre-Deployment";
export const OUTBOUND = "Outbound";
export const INBOUND = "Inbound";
export const OUT = "Out";

// Open drop areas (no fixed slots). Inbound/Pre-Deployment are capped; Outbound is unlimited.
export const OPEN_AREAS = [INBOUND, PRE_DEPLOYMENT, OUTBOUND] as const;
export const isOpenArea = (location: string): boolean =>
  location === INBOUND || location === PRE_DEPLOYMENT || location === OUTBOUND;

export interface Machine {
  id: number;
  serial: string | null;
  model: Model;
  role: Role;
  status: Status;
  productLine: ProductLine | null;
  assembledBy: string | null;
  notes: string | null;
  location: string;
  slot: number | null;
  destination: string | null;
  checkedOutAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const roleTag = (r: Role): string => (r === "Primary" ? "(P)" : "(S)");

// Append-only record of each serialize event (permanent build-activity history).
export interface SerializationEvent {
  id: number;
  serial: string;
  productLine: ProductLine | null;
  role: Role;
  model: Model;
  assembledBy: string | null;
  serializedAt: Date;
}
