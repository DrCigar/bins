"use client";
import { MODELS, STATUSES, Status } from "@/lib/domain/types";
import { StatusBreakdown } from "@/lib/domain/totals";

const STATUS_COLOR: Record<Status, string> = {
  New: "#3ccb7f",
  Used: "#e6a531",
  Broken: "#ef4023",
};

// Grouped bars: one group per model, a bar per status (on-hand counts).
export function StatusChart({ breakdown }: { breakdown: StatusBreakdown }) {
  const max = Math.max(
    1,
    ...MODELS.flatMap((model) => STATUSES.map((s) => breakdown[s].byModel[model].total)),
  );

  return (
    <div className="bg-pos-surface2 rounded-md p-4">
      <div className="flex items-end justify-around gap-4" style={{ height: 170 }}>
        {MODELS.map((model) => (
          <div key={model} className="flex flex-col items-center gap-2 flex-1">
            <div className="flex items-end justify-center gap-1.5" style={{ height: 140 }}>
              {STATUSES.map((s) => {
                const count = breakdown[s].byModel[model].total;
                return (
                  <div key={s} className="flex flex-col justify-end items-center" style={{ height: "100%" }} title={`${model} · ${s}: ${count}`}>
                    <span className="text-[10px] text-neutral-300 mb-0.5">{count}</span>
                    <div
                      style={{
                        width: 22,
                        height: `${(count / max) * 100}%`,
                        minHeight: count > 0 ? 3 : 0,
                        background: STATUS_COLOR[s],
                        borderRadius: "2px 2px 0 0",
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <span className="text-xs text-neutral-400">{model}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-4 text-[11px]">
        {STATUSES.map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: STATUS_COLOR[s] }} />
            <span className="text-neutral-400">{s}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
