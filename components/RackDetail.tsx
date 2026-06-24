"use client";
import { Machine, roleTag, isOpenArea, PRE_DEPLOYMENT } from "@/lib/domain/types";
import { rackCapacity, rackCols, slotLabel, PRE_DEPLOYMENT_CAPACITY } from "@/lib/layout/warehouse";
import { StatusBadge } from "./StatusBadge";

const dotFor = (m: Machine) =>
  m.status === "New" ? "text-status-new" : m.status === "Used" ? "text-status-used" : "text-status-broken";

function FilledCard({ label, m, onClick, selected = false }: { label: string; m: Machine; onClick: () => void; selected?: boolean }) {
  const missingSerial = !m.serial;
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-md p-2 border bg-pos-surface hover:border-neutral-500 ${
        selected ? "border-pos-vermilion ring-1 ring-pos-vermilion" : missingSerial ? "border-status-broken animate-blink" : "border-pos-line"
      }`}
    >
      <p className="text-[10px] text-neutral-500">{selected ? "✓ " : ""}{label}</p>
      <p className="text-xs font-medium">
        {m.model} <span className="text-neutral-400">{roleTag(m.role)}</span>
      </p>
      {missingSerial ? (
        <p className="text-[10px] text-status-broken font-medium">⚠ no serial</p>
      ) : (
        <p className="text-[10px] text-neutral-400 truncate">{m.serial}</p>
      )}
      <div className="mt-1 flex items-center gap-1">
        <StatusBadge status={m.status} />
        {m.notes ? <span title={m.notes} className={`${dotFor(m)} text-[11px]`}>●</span> : null}
      </div>
    </button>
  );
}

export function RackDetail({
  label, machines, onSlotClick, selectMode = false, selectedIds, onToggleSelect,
}: {
  label: string;
  machines: Machine[];
  onSlotClick: (slot: number | null, machine: Machine | null) => void;
  selectMode?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
}) {
  const here = machines.filter((m) => m.location === label);
  // In select mode, clicking a filled card toggles its selection instead of opening it.
  const cardClick = (m: Machine, slot: number | null) =>
    selectMode ? onToggleSelect?.(m.id) : onSlotClick(slot, m);
  const isSel = (m: Machine) => Boolean(selectedIds?.has(m.id));

  if (isOpenArea(label)) {
    const capped = label === PRE_DEPLOYMENT;
    const canAdd = !capped || here.length < PRE_DEPLOYMENT_CAPACITY;
    const countLabel = capped ? `${here.length}/${PRE_DEPLOYMENT_CAPACITY}` : `${here.length} · unlimited`;
    return (
      <div>
        <h2 className="text-base font-medium mb-3">
          {label} <span className="text-neutral-500 text-sm">· {countLabel}</span>
        </h2>
        <div className="grid grid-cols-5 gap-2">
          {here.map((m) => (
            <FilledCard key={m.id} label={`#${m.id}`} m={m} selected={isSel(m)} onClick={() => cardClick(m, null)} />
          ))}
          {!selectMode && canAdd && (
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

  const capacity = rackCapacity(label);
  const cols = rackCols(label);
  const bySlot = new Map(here.map((m) => [m.slot, m]));
  const slots = Array.from({ length: capacity }, (_, i) => i + 1);

  return (
    <div>
      <h2 className="text-base font-medium mb-3">
        Rack {label} <span className="text-neutral-500 text-sm">· {here.length}/{capacity}</span>
      </h2>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: cols <= 2 ? 260 : undefined }}>
        {slots.map((slotNum) => {
          const m = bySlot.get(slotNum) ?? null;
          const cellLabel = slotLabel(label, slotNum);
          return m ? (
            <FilledCard key={slotNum} label={cellLabel} m={m} selected={isSel(m)} onClick={() => cardClick(m, slotNum)} />
          ) : (
            <button
              key={slotNum}
              disabled={selectMode}
              onClick={() => onSlotClick(slotNum, null)}
              className="text-left rounded-md p-2 border border-dashed border-pos-line hover:border-neutral-500 min-h-[64px] disabled:opacity-40"
            >
              <p className="text-[10px] text-neutral-500">{cellLabel}</p>
              <p className="text-xs text-neutral-600 mt-1">Empty · add</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
