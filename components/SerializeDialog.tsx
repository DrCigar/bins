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

  async function submit() {
    setError("");
    setBusy(true);
    try {
      const { serials } = await serializeAction({
        productLine, role, model, status, assembledBy, notes: null, date, quantity,
      });
      if (serials.length === 0) {
        setError("Staging racks (I, J) are full — free up space or lower the quantity.");
        return;
      }
      if (serials.length < quantity) setError(`Only ${serials.length} fit in staging; printing those.`);
      sessionStorage.setItem("rl_print", JSON.stringify({ serials, printStyle }));
      window.open("/print", "_blank");
      onDone();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Serialize failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} title="Serialize a register" onClose={onClose}>
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
