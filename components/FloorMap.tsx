"use client";
import { Machine, PRE_DEPLOYMENT, OUTBOUND, INBOUND } from "@/lib/domain/types";
import {
  RACKS, RACK_SLOTS, FLOOR, MAP_SCALE, ZONE_DIVIDER_Y,
  PRE_DEPLOYMENT_AREA, PRE_DEPLOYMENT_CAPACITY, OUTBOUND_AREA, INBOUND_AREA,
} from "@/lib/layout/warehouse";

const s = (n: number) => n * MAP_SCALE;

export function FloorMap({
  machines, onSelect,
}: {
  machines: Machine[];
  onSelect: (label: string) => void;
}) {
  const countAt = (label: string) => machines.filter((x) => x.location === label).length;

  return (
    <div
      className="relative mx-auto bg-pos-surface2 border border-pos-line rounded-lg overflow-hidden"
      style={{ width: s(FLOOR.w), height: s(FLOOR.h), maxWidth: "100%" }}
    >
      <div
        className="absolute border-t border-dashed border-neutral-700"
        style={{ left: 0, top: s(ZONE_DIVIDER_Y), width: s(490) }}
      />
      <span className="absolute text-[11px] tracking-wider text-neutral-500" style={{ left: s(12), top: s(10) }}>
        MAIN WAREHOUSE
      </span>
      <span className="absolute text-[11px] tracking-wider text-neutral-500" style={{ left: s(12), top: s(268) }}>
        OFFICE / DEN
      </span>

      <button
        onClick={() => onSelect(INBOUND)}
        className="absolute rounded-lg border border-dashed border-pos-vermilion flex flex-col items-center justify-center gap-1 hover:bg-pos-vermilion/10"
        style={{
          left: s(INBOUND_AREA.x), top: s(INBOUND_AREA.y),
          width: s(INBOUND_AREA.w), height: s(INBOUND_AREA.h),
          background: "rgba(239,64,35,0.08)",
        }}
      >
        <span className="text-xs font-medium tracking-wide">INBOUND</span>
        <span className="text-xl font-bold">{countAt(INBOUND)}<span className="text-xs text-neutral-500 font-normal"> / 10</span></span>
      </button>

      <button
        onClick={() => onSelect(OUTBOUND)}
        className="absolute rounded-lg border border-dashed border-pos-vermilion flex flex-col items-center justify-center gap-1 hover:bg-pos-vermilion/10"
        style={{
          left: s(OUTBOUND_AREA.x), top: s(OUTBOUND_AREA.y),
          width: s(OUTBOUND_AREA.w), height: s(OUTBOUND_AREA.h),
          background: "rgba(239,64,35,0.10)",
        }}
      >
        <span className="text-xs font-medium tracking-wide">OUTBOUND</span>
        <span className="text-xl font-bold">{countAt(OUTBOUND)}</span>
        <span className="text-[10px] text-neutral-400">unlimited</span>
      </button>

      <button
        onClick={() => onSelect(PRE_DEPLOYMENT)}
        className="absolute rounded-lg border border-dashed border-pos-vermilion flex flex-col items-center justify-center gap-1 hover:bg-pos-vermilion/10"
        style={{
          left: s(PRE_DEPLOYMENT_AREA.x), top: s(PRE_DEPLOYMENT_AREA.y),
          width: s(PRE_DEPLOYMENT_AREA.w), height: s(PRE_DEPLOYMENT_AREA.h),
          background: "rgba(239,64,35,0.06)",
        }}
      >
        <span className="text-xs font-medium">Pre-Deployment</span>
        <span className="text-xl font-bold">
          {countAt(PRE_DEPLOYMENT)}
          <span className="text-xs text-neutral-500 font-normal"> / {PRE_DEPLOYMENT_CAPACITY}</span>
        </span>
      </button>

      {RACKS.some((r) => r.isStaging) && (
        <span className="absolute text-[9px] font-medium tracking-wider" style={{ left: s(357), top: s(120), color: "#EF9F27" }}>
          STAGING
        </span>
      )}

      {RACKS.map((r) => {
        const fill = countAt(r.label) / RACK_SLOTS;
        const vertical = r.orientation === "vertical";
        return (
          <button
            key={r.label}
            onClick={() => onSelect(r.label)}
            title={`Rack ${r.label} — ${countAt(r.label)}/${RACK_SLOTS}${r.isStaging ? " (staging)" : ""}`}
            className={`absolute rounded-[5px] border flex items-center justify-center text-[11px] font-medium text-white ${
              r.isStaging ? "border-[#EF9F27] hover:border-[#FAC775]" : "border-white/20 hover:border-white/60"
            }`}
            style={{
              left: s(r.x), top: s(r.y),
              width: vertical ? s(16) : s(50),
              height: vertical ? s(50) : s(16),
              background: r.isStaging
                ? `rgba(239,159,39,${0.18 + fill * 0.8})`
                : `rgba(239,64,35,${0.1 + fill * 0.9})`,
            }}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
