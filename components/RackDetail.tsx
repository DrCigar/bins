"use client";
import { Machine, roleTag, PRE_DEPLOYMENT } from "@/lib/domain/types";
import { RACK_SLOTS, PRE_DEPLOYMENT_CAPACITY } from "@/lib/layout/warehouse";
import { StatusBadge } from "./StatusBadge";

const dotFor = (m: Machine) =>
  m.status === "New" ? "text-status-new" : m.status === "Used" ? "text-status-used" : "text-status-broken";

function FilledCard({ label, m, onClick }: { label: string; m: Machine; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-md p-2 border border-pos-line bg-pos-surface hover:border-neutral-500"
    >
      <p className="text-[10px] text-neutral-500">{label}</p>
      <p className="text-xs font-medium">
        {m.model} <span className="text-neutral-400">{roleTag(m.role)}</span>
      </p>
      <p className="text-[10px] text-neutral-400 truncate">{m.serial}</p>
      <div className="mt-1 flex items-center gap-1">
        <StatusBadge status={m.status} />
        {m.notes ? <span title={m.notes} className={`${dotFor(m)} text-[11px]`}>●</span> : null}
      </div>
    </button>
  );
}

export function RackDetail({
  label, machines, onSlotClick,
}: {
  label: string;
  machines: Machine[];
  onSlotClick: (slot: number | null, machine: Machine | null) => void;
}) {
  const here = machines.filter((m) => m.location === label);

  if (label === PRE_DEPLOYMENT) {
    return (
      <div>
        <h2 className="text-base font-medium mb-3">
          {PRE_DEPLOYMENT} <span className="text-neutral-500 text-sm">· {here.length}/{PRE_DEPLOYMENT_CAPACITY}</span>
        </h2>
        <div className="grid grid-cols-5 gap-2">
          {here.map((m) => (
            <FilledCard key={m.id} label={`#${m.id}`} m={m} onClick={() => onSlotClick(null, m)} />
          ))}
          {here.length < PRE_DEPLOYMENT_CAPACITY && (
            <button
              onClick={() => onSlotClick(null, null)}
              className="rounded-md p-2 border border-dashed border-pos-line text-xs text-neutral-600 hover:text-neutral-300 min-h-[64px]"
            >
              + add
            </button>
          )}
        </div>
      </div>
    );
  }

  const bySlot = new Map(here.map((m) => [m.slot, m]));
  const slots = Array.from({ length: RACK_SLOTS }, (_, i) => i + 1);

  return (
    <div>
      <h2 className="text-base font-medium mb-3">
        Rack {label} <span className="text-neutral-500 text-sm">· {here.length}/{RACK_SLOTS}</span>
      </h2>
      <div className="grid grid-cols-5 gap-2">
        {slots.map((s) => {
          const m = bySlot.get(s) ?? null;
          const slotLabel = `${label}-${String(s).padStart(2, "0")}`;
          return m ? (
            <FilledCard key={s} label={slotLabel} m={m} onClick={() => onSlotClick(s, m)} />
          ) : (
            <button
              key={s}
              onClick={() => onSlotClick(s, null)}
              className="text-left rounded-md p-2 border border-dashed border-pos-line hover:border-neutral-500 min-h-[64px]"
            >
              <p className="text-[10px] text-neutral-500">{slotLabel}</p>
              <p className="text-xs text-neutral-600 mt-1">Empty · add</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
