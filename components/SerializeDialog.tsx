"use client";
import { useState } from "react";
import { Dialog } from "./Dialog";
import {
  MODELS, ROLES, STATUSES, PRODUCT_LINES, ASSEMBLERS,
  Model, Role, Status, ProductLine,
} from "@/lib/domain/types";
import { serializeAction } from "@/app/actions";

const field = "bg-pos-surface2 border border-pos-line rounded-md px-3 py-2 text-sm w-full mt-1 text-white";
const todayStr = (): string => new Date().toISOString().slice(0, 10);

export function SerializeDialog({
  open, onClose, onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [productLine, setProductLine] = useState<ProductLine>("360 Pro");
  const [role, setRole] = useState<Role>("Primary");
  const [model, setModel] = useState<Model>("Matsuda");
  const [status, setStatus] = useState<Status>("New");
  const [assembledBy, setAssembledBy] = useState<string>(ASSEMBLERS[0]);
  const [date, setDate] = useState<string>(todayStr());
  const [quantity, setQuantity] = useState<number>(1);
  const [printStyle, setPrintStyle] = useState<"roll" | "sheet">("roll");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Array<{ serial: string; location: string; slot: number | null }> | null>(null);
  const [shortfall, setShortfall] = useState(false);

  function reset() {
    setResult(null); setError(""); setShortfall(false); setQuantity(1);
  }
  function close() { reset(); onClose(); }

  async function submit() {
    setError("");
    setBusy(true);
    try {
      const { created } = await serializeAction({
        productLine, role, model, status, assembledBy, notes: null, date, quantity,
      });
      if (created.length === 0) {
        setError("Staging racks (I, J) are full — free up space or lower the quantity.");
        return;
      }
      setShortfall(created.length < quantity);
      setResult(created);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Serialize failed");
    } finally {
      setBusy(false);
    }
  }

  // Called from a button click (user gesture) so the print tab isn't popup-blocked.
  function printLabels() {
    if (!result) return;
    sessionStorage.setItem("rl_print", JSON.stringify({ serials: result.map((r) => r.serial), printStyle }));
    window.open("/print", "_blank");
  }

  if (result) {
    const stagedAt = result.map((r) => `${r.location}-${String(r.slot ?? "").padStart(2, "0")}`).join(", ");
    return (
      <Dialog open={open} title="Serialized" onClose={close}>
        <div className="flex flex-col gap-3">
          <div className="rounded-md border border-status-new/40 bg-status-new/10 p-3">
            <p className="text-sm font-medium text-status-new">
              ✓ {result.length} register{result.length > 1 ? "s" : ""} serialized
            </p>
            <p className="text-xs text-neutral-300 mt-1">
              Automatically placed in the Staging area: <span className="font-medium">{stagedAt}</span>
            </p>
          </div>
          {shortfall && (
            <p className="text-status-used text-xs">Staging filled up — only {result.length} of the batch fit. Move some out, then serialize the rest.</p>
          )}
          <div className="text-[11px] text-neutral-500 max-h-24 overflow-auto">
            {result.map((r) => <div key={r.serial}>{r.serial}</div>)}
          </div>
          <div className="flex gap-2 mt-1">
            <button onClick={printLabels} className="flex-1 bg-pos-vermilion rounded-md py-2 text-sm font-medium">
              Print labels
            </button>
            <button onClick={reset} className="px-3 rounded-md border border-pos-line text-sm hover:bg-neutral-900">
              Serialize more
            </button>
            <button onClick={close} className="px-3 rounded-md border border-pos-line text-sm hover:bg-neutral-900">
              Done
            </button>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} title="Serialize a register" onClose={close}>
      <div className="flex flex-col gap-3">
        <label className="text-xs text-neutral-400">Product line
          <select className={field} value={productLine} onChange={(e) => setProductLine(e.target.value as ProductLine)}>
            {PRODUCT_LINES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label className="text-xs text-neutral-400">Role
          <select className={field} value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {ROLES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label className="text-xs text-neutral-400">Model <span className="text-neutral-600">(internal)</span>
          <select className={field} value={model} onChange={(e) => setModel(e.target.value as Model)}>
            {MODELS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label className="text-xs text-neutral-400">Status
          <select className={field} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            {STATUSES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label className="text-xs text-neutral-400">Assembled by
          <select className={field} value={assembledBy} onChange={(e) => setAssembledBy(e.target.value)}>
            {ASSEMBLERS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-neutral-400">Build date
            <input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="text-xs text-neutral-400">Quantity
            <input type="number" min={1} className={field} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </label>
        </div>
        <label className="text-xs text-neutral-400">Print style
          <select className={field} value={printStyle} onChange={(e) => setPrintStyle(e.target.value as "roll" | "sheet")}>
            <option value="roll">Thermal roll (2.25&quot; x 1.25&quot;)</option>
            <option value="sheet">8 x 10 sheet</option>
          </select>
        </label>
      </div>
      {error && <p className="text-status-broken text-xs mt-2">{error}</p>}
      <button
        onClick={submit}
        disabled={busy}
        className="mt-4 w-full bg-pos-vermilion rounded-md py-2 text-sm font-medium disabled:opacity-60"
      >
        {busy ? "Serializing…" : "Generate & Print"}
      </button>
    </Dialog>
  );
}
