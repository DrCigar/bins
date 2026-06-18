import { Status } from "@/lib/domain/types";

const MAP: Record<Status, string> = {
  New: "bg-status-new/15 text-status-new",
  Used: "bg-status-used/15 text-status-used",
  Broken: "bg-status-broken/15 text-status-broken",
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`text-[11px] px-2 py-0.5 rounded ${MAP[status]}`}>{status}</span>;
}
