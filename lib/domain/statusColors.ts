import { Status } from "./types";

// Single source of truth for status colors (must match the --color-status-* tokens in globals.css).
// Severity gradient: New (green) → Used (yellow) → Review (orange) → Breakdown (red).
export const STATUS_HEX: Record<Status, string> = {
  New: "#3ccb7f",
  Used: "#e6a531",
  Review: "#f97316",
  Breakdown: "#ef4023",
};
