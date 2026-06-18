"use client";
import { useState } from "react";
import { Dialog } from "./Dialog";
import { MachineForm, MachineFormValue } from "./MachineForm";
import { RACKS, RACK_SLOTS } from "@/lib/layout/warehouse";
import { PRE_DEPLOYMENT, OUTBOUND, Machine, isOpenArea } from "@/lib/domain/types";
import { checkInAction } from "@/app/actions";

const emptyForm: MachineFormValue = {
  serial: "", model: "Matsuda", role: "Primary", status: "New", notes: "",
};
const field = "bg-pos-surface2 border border-pos-line rounded-md px-3 py-2 text-sm w-full mt-1 text-white";

export function CheckInDialog({
  open, onClose, machines, defaultLocation, defaultSlot,
}: {
  open: boolean;
  onClose: () => void;
  machines: Machine[];
  defaultLocation?: string;
  defaultSlot?: number | null;
}) {
  const [v, setV] = useState<MachineFormValue>(emptyForm);
  const [location, setLocation] = useState(defaultLocation ?? "A");
  const [slot, setSlot] = useState<number | "">(defaultSlot ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const takenSlots = new Set(machines.filter((m) => m.location === location).map((m) => m.slot));
  const openSlots = isOpenArea(location)
    ? []
    : Array.from({ length: RACK_SLOTS }, (_, i) => i + 1).filter((s) => !takenSlots.has(s));

  async function submit() {
    setError("");
    if (!isOpenArea(location) && slot === "") { setError("Pick a slot"); return; }
    setBusy(true);
    try {
      await checkInAction({
        serial: v.serial || null, model: v.model, role: v.role, status: v.status,
        notes: v.notes || null, location,
        slot: isOpenArea(location) ? null : Number(slot),
      });
      setV(emptyForm); setSlot(""); onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check in failed (duplicate serial or slot taken?)");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} title="Check In a register" onClose={onClose}>
      <MachineForm value={v} onChange={setV} />
      <div className="grid grid-cols-2 gap-3 mt-3">
        <label className="text-xs text-neutral-400">
          Location
          <select
            className={field}
            value={location}
            onChange={(e) => { setLocation(e.target.value); setSlot(""); }}
          >
            {RACKS.map((r) => <option key={r.label} value={r.label}>Rack {r.label}</option>)}
            <option value={PRE_DEPLOYMENT}>{PRE_DEPLOYMENT}</option>
            <option value={OUTBOUND}>{OUTBOUND}</option>
          </select>
        </label>
        {!isOpenArea(location) && (
          <label className="text-xs text-neutral-400">
            Slot
            <select className={field} value={slot} onChange={(e) => setSlot(Number(e.target.value))}>
              <option value="">Pick…</option>
              {openSlots.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        )}
      </div>
      {error && <p className="text-status-broken text-xs mt-2">{error}</p>}
      <button
        onClick={submit}
        disabled={busy}
        className="mt-4 w-full bg-pos-vermilion rounded-md py-2 text-sm font-medium disabled:opacity-60"
      >
        {busy ? "Checking in…" : "Check In"}
      </button>
    </Dialog>
  );
}
