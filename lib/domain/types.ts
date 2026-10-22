export const MODELS = ["Matsuda", "Hanasis", "Yunos"] as const;
export type Model = (typeof MODELS)[number];

export const ROLES = ["Primary", "Secondary"] as const;
export type Role = (typeof ROLES)[number];

export const STATUSES = ["New", "Used", "Review", "Breakdown"] as const;
export type Status = (typeof STATUSES)[number];

// Statuses that count toward on-hand inventory totals. Review and Breakdown are tracked
// and shown, but not counted as usable stock.
export const COUNTED_STATUSES = ["New", "Used"] as const satisfies readonly Status[];
export const countsInTotals = (s: Status): boolean => (COUNTED_STATUSES as readonly Status[]).includes(s);

export const PRODUCT_LINES = ["360 Pro", "360 Smoke"] as const;
export type ProductLine = (typeof PRODUCT_LINES)[number];

export const ASSEMBLERS = ["Thang", "Jeremy"] as const;

// Off-site store locations with manually-entered counts (not tracked on the floor map).
export const MANUAL_LOCATIONS = ["San Diego", "San Francisco"] as const;
export type ManualLocation = (typeof MANUAL_LOCATIONS)[number];

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

// How a unit entered the system: serialized in-house, or checked in (added).
export const ACTIVITY_KINDS = ["serialized", "added"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

// Append-only record of each activity event (permanent history — never deleted).
export interface SerializationEvent {
  id: number;
  kind: ActivityKind;
  serial: string | null; // null allowed for check-ins with no serial
  productLine: ProductLine | null;
  role: Role;
  model: Model;
  assembledBy: string | null;
  serializedAt: Date;
}
