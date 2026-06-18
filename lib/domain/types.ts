export const MODELS = ["Matsuda", "Hanasis", "Yunos"] as const;
export type Model = (typeof MODELS)[number];

export const ROLES = ["Primary", "Secondary"] as const;
export type Role = (typeof ROLES)[number];

export const STATUSES = ["New", "Used", "Broken"] as const;
export type Status = (typeof STATUSES)[number];

// location is a rack label (e.g. "A"), "Pre-Deployment", or "Out"
export const PRE_DEPLOYMENT = "Pre-Deployment";
export const OUT = "Out";

export interface Machine {
  id: number;
  serial: string;
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
