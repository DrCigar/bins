"use client";
import { useState } from "react";
import { Machine, PRE_DEPLOYMENT, OUTBOUND, INBOUND } from "@/lib/domain/types";
import {
  RACKS, rackCapacity, FLOOR, MAP_SCALE, ZONE_DIVIDER_Y,
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
  const [hover, setHover] = useState<{ label: string; x: number; y: number } | null>(null);

  const hoverData = hover
    ? (() => {
        const here = machines.filter((m) => m.location === hover.label);
        return {
          total: here.length,
          New: here.filter((m) => m.status === "New").length,
          Used: here.filter((m) => m.status === "Used").length,
          Broken: here.filter((m) => m.status === "Broken").length,
        };
      })()
    : null;

  return (
    <div
      className="relative mx-auto bg-pos-surface2 border border-pos-line rounded-lg overflow-hidden"
      style={{ width: s(FLOOR.w), height: s(FLOOR.h), maxWidth: "100%" }}
    >
      <div className="absolute border-t border-dashed border-neutral-700" style={{ left: 0, top: s(ZONE_DIVIDER_Y), width: s(490) }} />
      <span className="absolute text-[11px] tracking-wider text-neutral-500" style={{ left: s(12), top: s(10) }}>MAIN WAREHOUSE</span>
      <span className="absolute text-[11px] tracking-wider text-neutral-500" style={{ left: s(12), top: s(268) }}>OFFICE / DEN</span>

      <button
        onClick={() => onSelect(INBOUND)}
        className="absolute rounded-lg border border-dashed border-pos-vermilion flex flex-col items-center justify-center gap-1 hover:bg-pos-vermilion/10"
        style={{ left: s(INBOUND_AREA.x), top: s(INBOUND_AREA.y), width: s(INBOUND_AREA.w), height: s(INBOUND_AREA.h), background: "rgba(239,64,35,0.08)" }}
      >
        <span className="text-xs font-medium tracking-wide">INBOUND</span>
        <span className="text-xl font-bold">{countAt(INBOUND)}<span className="text-xs text-neutral-500 font-normal"> / 10</span></span>
      </button>

      <button
        onClick={() => onSelect(OUTBOUND)}
        className="absolute rounded-lg border border-dashed border-pos-vermilion flex flex-col items-center justify-center gap-1 hover:bg-pos-vermilion/10"
        style={{ left: s(OUTBOUND_AREA.x), top: s(OUTBOUND_AREA.y), width: s(OUTBOUND_AREA.w), height: s(OUTBOUND_AREA.h), background: "rgba(239,64,35,0.10)" }}
      >
        <span className="text-xs font-medium tracking-wide">OUTBOUND</span>
        <span className="text-xl font-bold">{countAt(OUTBOUND)}</span>
        <span className="text-[10px] text-neutral-400">unlimited</span>
      </button>

      <button
        onClick={() => onSelect(PRE_DEPLOYMENT)}
        className="absolute rounded-lg border border-dashed border-pos-vermilion flex flex-col items-center justify-center gap-1 hover:bg-pos-vermilion/10"
        style={{ left: s(PRE_DEPLOYMENT_AREA.x), top: s(PRE_DEPLOYMENT_AREA.y), width: s(PRE_DEPLOYMENT_AREA.w), height: s(PRE_DEPLOYMENT_AREA.h), background: "rgba(239,64,35,0.06)" }}
      >
        <span className="text-xs font-medium">Pre-Deployment</span>
        <span className="text-xl font-bold">{countAt(PRE_DEPLOYMENT)}<span className="text-xs text-neutral-500 font-normal"> / {PRE_DEPLOYMENT_CAPACITY}</span></span>
      </button>

      {/* Staging label attached to the top of the HH/II pair */}
      <span className="absolute text-[9px] font-medium tracking-wider" style={{ left: s(330), top: s(143), color: "#9aa0aa" }}>STAGING</span>

      {RACKS.map((r) => {
        const cap = rackCapacity(r.label);
        const fill = cap ? Math.min(1, countAt(r.label) / cap) : 0;
        const silver = r.material === "silver";
        const vertical = r.h >= r.w; // fill bottom-up for tall racks, left-to-right for wide ones
        const barStyle = vertical
          ? { left: 0, right: 0, bottom: 0, height: `${fill * 100}%` }
          : { left: 0, top: 0, bottom: 0, width: `${fill * 100}%` };
        return (
          <button
            key={r.label}
            onClick={() => onSelect(r.label)}
            onMouseEnter={() => setHover({ label: r.label, x: r.x, y: r.y })}
            onMouseLeave={() => setHover((h) => (h?.label === r.label ? null : h))}
            title={`Rack ${r.label} — ${countAt(r.label)}/${cap}`}
            className="absolute rounded-[5px] flex items-center justify-center overflow-hidden"
            style={{
              left: s(r.x), top: s(r.y), width: s(r.w), height: s(r.h),
              background: silver ? "rgba(205,210,218,0.22)" : "rgba(255,255,255,0.06)",
              borderStyle: "solid",
              borderWidth: silver ? 1.5 : 0.5,
              borderColor: silver ? "#b9bec8" : "rgba(255,255,255,0.25)",
            }}
          >
            <span className="absolute" style={{ ...barStyle, background: "#ef4023" }} />
            <span className="relative text-[11px] font-medium text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}>{r.label}</span>
          </button>
        );
      })}

      {hover && hoverData && (
        <div
          className="absolute z-20 pointer-events-none bg-black/95 border border-pos-line rounded-md px-3 py-2 shadow-lg"
          style={{ left: Math.min(s(hover.x) + 24, s(FLOOR.w) - 150), top: Math.max(s(hover.y) - 10, 4), width: 140 }}
        >
          <p className="text-xs font-medium text-white">Rack {hover.label}</p>
          <p className="text-[11px] text-neutral-400">{hoverData.total}/{rackCapacity(hover.label)} filled</p>
          <div className="mt-1 flex gap-2 text-[10px]">
            <span className="text-status-new">{hoverData.New} new</span>
            <span className="text-status-used">{hoverData.Used} used</span>
            <span className="text-status-broken">{hoverData.Broken} broken</span>
          </div>
        </div>
      )}
    </div>
  );
}
