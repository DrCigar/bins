"use client";
import useSWR from "swr";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RackDetail } from "@/components/RackDetail";
import { Dialog } from "@/components/Dialog";
import { MachineForm, MachineFormValue, emptyMachineForm } from "@/components/MachineForm";
import { CheckInDialog } from "@/components/CheckInDialog";
import { CheckOutDialog } from "@/components/CheckOutDialog";
import { SerializeDialog } from "@/components/SerializeDialog";
import { fetcher } from "@/lib/fetcher";
import { updateMachineAction, removeAction, checkInAction, moveAction } from "@/app/actions";
import { RACKS, RACK_SLOTS } from "@/lib/layout/warehouse";
import { Machine, PRE_DEPLOYMENT, OUTBOUND, INBOUND, isOpenArea } from "@/lib/domain/types";

const emptyForm = emptyMachineForm;
const field = "bg-pos-surface2 border border-pos-line rounded-md px-3 py-2 text-sm w-full mt-1 text-white";

export default function RackPage({ params }: { params: Promise<{ label: string }> }) {
  const { label } = use(params);
  const decoded = decodeURIComponent(label);
  const { data: machines = [], mutate } = useSWR<Machine[]>("/api/machines", fetcher, { refreshInterval: 4000 });

  const [edit, setEdit] = useState<{ slot: number | null; machine: Machine | null } | null>(null);
  const [form, setForm] = useState<MachineFormValue>(emptyForm);
  const [moveLoc, setMoveLoc] = useState("");
  const [moveSlot, setMoveSlot] = useState<number | "">("");
  const [error, setError] = useState("");
  const [serialize, setSerialize] = useState(false);
  const [checkIn, setCheckIn] = useState(false);
  const [checkOut, setCheckOut] = useState(false);
  const router = useRouter();

  function openSlot(slot: number | null, machine: Machine | null) {
    setError("");
    setEdit({ slot, machine });
    setMoveLoc(""); setMoveSlot("");
    setForm(
      machine
        ? {
            serial: machine.serial ?? "", productLine: machine.productLine ?? "360 Pro",
            role: machine.role, model: machine.model, status: machine.status,
            assembledBy: machine.assembledBy ?? "", notes: machine.notes ?? "",
          }
        : emptyForm,
    );
  }

  const takenAt = (loc: string) => new Set(machines.filter((m) => m.location === loc).map((m) => m.slot));
  const openSlotsAt = (loc: string) =>
    isOpenArea(loc) ? [] : Array.from({ length: RACK_SLOTS }, (_, i) => i + 1).filter((s) => !takenAt(loc).has(s));

  async function save() {
    if (!edit) return;
    setError("");
    try {
      if (edit.machine) {
        await updateMachineAction(edit.machine.id, {
          serial: form.serial || null, model: form.model, role: form.role, status: form.status,
          productLine: form.productLine, assembledBy: form.assembledBy || null, notes: form.notes || null,
        });
      } else {
        await checkInAction({
          serial: form.serial, model: form.model, role: form.role, status: form.status,
          productLine: form.productLine, assembledBy: form.assembledBy || null,
          notes: form.notes || null, location: decoded, slot: edit.slot,
        });
      }
      setEdit(null);
      mutate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed (duplicate serial or slot taken?)");
    }
  }

  async function doMove() {
    if (!edit?.machine || !moveLoc) return;
    setError("");
    try {
      await moveAction(edit.machine.id, moveLoc, isOpenArea(moveLoc) ? null : (moveSlot === "" ? null : Number(moveSlot)));
      setEdit(null);
      mutate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Move failed (slot taken?)");
    }
  }

  async function doRemove() {
    if (!edit?.machine) return;
    await removeAction(edit.machine.id);
    setEdit(null);
    mutate();
  }

  const title = edit?.machine
    ? `Edit ${decoded}${edit.slot ? `-${String(edit.slot).padStart(2, "0")}` : ""}`
    : `Add to ${decoded}${edit?.slot ? `-${String(edit.slot).padStart(2, "0")}` : ""}`;

  return (
    <AppShell machines={machines} onSerialize={() => setSerialize(true)} onCheckIn={() => setCheckIn(true)} onCheckOut={() => setCheckOut(true)}>
      <button onClick={() => router.push("/")} className="text-xs text-neutral-400 mb-3 hover:text-white">
        ← Back to map
      </button>
      <RackDetail label={decoded} machines={machines} onSlotClick={openSlot} />

      <Dialog open={!!edit} title={title} onClose={() => setEdit(null)}>
        <MachineForm value={form} onChange={setForm} lockSerial={!!edit?.machine?.serial} />

        {error && <p className="text-status-broken text-xs mt-2">{error}</p>}

        <div className="flex gap-2 mt-4">
          <button onClick={save} className="flex-1 bg-pos-vermilion rounded-md py-2 text-sm font-medium">
            Save
          </button>
          {edit?.machine && (
            <button onClick={doRemove} className="px-3 rounded-md border border-pos-line text-sm hover:bg-neutral-900">
              Remove
            </button>
          )}
        </div>

        {edit?.machine && (
          <div className="mt-4 pt-3 border-t border-pos-line">
            <p className="text-xs text-neutral-500 mb-2">Move to…</p>
            <div className="grid grid-cols-2 gap-2">
              <select
                className={field}
                value={moveLoc}
                onChange={(e) => { setMoveLoc(e.target.value); setMoveSlot(""); }}
              >
                <option value="">Location…</option>
                {RACKS.map((r) => <option key={r.label} value={r.label}>Rack {r.label}</option>)}
                <option value={INBOUND}>{INBOUND}</option>
                <option value={PRE_DEPLOYMENT}>{PRE_DEPLOYMENT}</option>
                <option value={OUTBOUND}>{OUTBOUND}</option>
              </select>
              {moveLoc && !isOpenArea(moveLoc) && (
                <select className={field} value={moveSlot} onChange={(e) => setMoveSlot(Number(e.target.value))}>
                  <option value="">Slot…</option>
                  {openSlotsAt(moveLoc).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
            </div>
            <button
              onClick={doMove}
              disabled={!moveLoc}
              className="mt-2 w-full rounded-md py-2 text-sm border border-pos-line hover:bg-neutral-900 disabled:opacity-50"
            >
              Move register
            </button>
          </div>
        )}
      </Dialog>

      <SerializeDialog open={serialize} onClose={() => setSerialize(false)} onDone={() => mutate()} />
      <CheckInDialog open={checkIn} onClose={() => { setCheckIn(false); mutate(); }} machines={machines} />
      <CheckOutDialog open={checkOut} onClose={() => { setCheckOut(false); mutate(); }} machines={machines} />
    </AppShell>
  );
}
