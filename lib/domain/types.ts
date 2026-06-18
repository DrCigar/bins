export const MODELS = ["Matsuda", "Hanasis", "Yunos"] as const;
export type Model = (typeof MODELS)[number];

export const ROLES = ["Primary", "Secondary"] as const;
export type Role = (typeof ROLES)[number];

export const STATUSES = ["New", "Used", "Broken"] as const;
export type Status = (typeof STATUSES)[number];

// location is a rack label (e.g. "A"), an open area, or "Out" (checked out to a store)
export const PRE_DEPLOYMENT = "Pre-Deployment";
export const OUTBOUND = "Outbound";
export const OUT = "Out";

// Open staging areas (no fixed slots). Pre-Deployment is capped; Outbound is unlimited.
export const OPEN_AREAS = [PRE_DEPLOYMENT, OUTBOUND] as const;
export const isOpenArea = (location: string): boolean =>
  location === PRE_DEPLOYMENT || location === OUTBOUND;

export interface Machine {
  id: number;
  serial: string | null;
  model: Model;
  role: Role;
  status: Status;
  notes: string | null;
  location: string;
  slot: number | null;
  destination: string | null;
  checkedOutAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const roleTag = (r: Role): string => (r === "Primary" ? "(P)" : "(S)");
