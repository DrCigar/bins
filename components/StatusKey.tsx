import { STATUSES } from "@/lib/domain/types";
import { STATUS_HEX } from "@/lib/domain/statusColors";

// Color legend for the status indicator stripe on each slot card.
export function StatusKey() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-[11px] text-neutral-400">
      <span className="text-neutral-500">Status key:</span>
      {STATUSES.map((s) => (
        <span key={s} className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: STATUS_HEX[s] }} />
          {s}
        </span>
      ))}
    </div>
  );
}
