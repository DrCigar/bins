"use client";
import { Machine, PRE_DEPLOYMENT } from "@/lib/domain/types";
import {
  RACKS, RACK_SLOTS, FLOOR, ZONE_DIVIDER_Y, PRE_DEPLOYMENT_AREA, PRE_DEPLOYMENT_CAPACITY,
} from "@/lib/layout/warehouse";

export function FloorMap({
  machines, onSelect,
}: {
  machines: Machine[];
  onSelect: (label: string) => void;
}) {
  const countAt = (label: string) => machines.filter((x) => x.location === label).length;
  const preCount = machines.filter((x) => x.location === PRE_DEPLOYMENT).length;

  return (
    <div
      className="relative mx-auto bg-pos-surface2 border border-pos-line rounded-lg overflow-hidden"
      style={{ width: FLOOR.w, height: FLOOR.h, maxWidth: "100%" }}
    >
      <div
        className="absolute border-t border-dashed border-neutral-700"
        style={{ left: 0, top: ZONE_DIVIDER_Y, width: 490 }}
      />
      <span className="absolute text-[10px] tracking-wider text-neutral-500" style={{ left: 12, top: 10 }}>
        MAIN WAREHOUSE
      </span>
      <span className="absolute text-[10px] tracking-wider text-neutral-500" style={{ left: 12, top: 268 }}>
        OFFICE / DEN
      </span>

      <button
        onClick={() => onSelect(PRE_DEPLOYMENT)}
        className="absolute rounded-lg border border-dashed border-pos-vermilion flex flex-col items-center justify-center gap-1 hover:bg-pos-vermilion/10"
        style={{
          left: PRE_DEPLOYMENT_AREA.x, top: PRE_DEPLOYMENT_AREA.y,
          width: PRE_DEPLOYMENT_AREA.w, height: PRE_DEPLOYMENT_AREA.h,
          background: "rgba(239,64,35,0.06)",
        }}
      >
        <span className="text-xs font-medium">Pre-Deployment</span>
        <span className="text-lg font-bold">
          {preCount}
          <span className="text-xs text-neutral-500 font-normal"> / {PRE_DEPLOYMENT_CAPACITY}</span>
        </span>
      </button>

      {RACKS.map((r) => {
        const fill = countAt(r.label) / RACK_SLOTS;
        const vertical = r.orientation === "vertical";
        return (
          <button
            key={r.label}
            onClick={() => onSelect(r.label)}
            title={`Rack ${r.label} — ${countAt(r.label)}/${RACK_SLOTS}`}
            className="absolute rounded-[5px] border border-white/20 flex items-center justify-center text-[10px] font-medium text-white hover:border-white/60"
            style={{
              left: r.x, top: r.y,
              width: vertical ? 16 : 50,
              height: vertical ? 50 : 16,
              background: `rgba(239,64,35,${0.1 + fill * 0.9})`,
            }}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
