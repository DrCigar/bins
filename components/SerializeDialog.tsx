"use client";
import { useState } from "react";
import { Dialog } from "./Dialog";
import {
  MODELS, ROLES, STATUSES, PRODUCT_LINES, ASSEMBLERS,
  INBOUND, PRE_DEPLOYMENT, OUTBOUND,
  Model, Role, Status, ProductLine,
} from "@/lib/domain/types";
import { RACKS, STAGING_RACKS } from "@/lib/layout/warehouse";
import { serializeAction } from "@/app/actions";
import { incrementSerial } from "@/lib/domain/serial";

const field = "bg-pos-surface2 border border-pos-line rounded-md px-3 py-2 text-sm w-full mt-1 text-white";
const todayStr = (): string => new Date().toISOString().slice(0, 10);

const DEFAULTS_KEY = "rl_serialize_defaults";
type SerializeDefaults = { productLine: ProductLine; role: Role; model: Model; assembledBy: string; printStyle: "roll" | "sheet" };
function loadDefaults(): Partial<SerializeDefaults> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(DEFAULTS_KEY) ?? "{}"); } catch { return {}; }
}

export function SerializeDialog({
  open, onClose, onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const d = loadDefaults();
  const [productLine, setProductLine] = useState<ProductLine>(d.productLine ?? "360 Pro");
  const [role, setRole] = useState<Role>(d.role ?? "Primary");
  const [model, setModel] = useState<Model>(d.model ?? "Matsuda");
  const [status, setStatus] = useState<Status>("New");
  const [assembledBy, setAssembledBy] = useState<string>(d.assembledBy ?? ASSEMBLERS[0]);
  const [date, setDate] = useState<string>(todayStr());
  const [quantity, setQuantity] = useState<number>(1);
  const [destination, setDestination] = useState<string>(STAGING_RACKS[0] ?? "HH");
  const [printStyle, setPrintStyle] = useState<"roll" | "sheet">(d.printStyle ?? "roll");
  const [prePrinted, setPrePrinted] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Array<{ serial: string; location: string; slot: number | null }> | null>(null);
  const [shortfall, setShortfall] = useState(false);

  // Live preview of the custom range, e.g. "7777 … 7781".
  const rangeEnd = prePrinted && /\d$/.test(customStart.trim())
    ? incrementSerial(customStart, Math.max(1, quantity) - 1)
    : null;

  function reset() {
    setResult(null); setError(""); setShortfall(false); setQuantity(1);
    setPrePrinted(false); setCustomStart("");
  }
  function close() { reset(); onClose(); }

  async function submit() {
    setError("");
    if (prePrinted && !/\d$/.test(customStart.trim())) {
      setError("Enter the starting serial from your pre-printed labels (must end in a number).");
      return;
    }
    setBusy(true);
    try {
      const res = await serializeAction({
        productLine, role, model, status, assembledBy, notes: null, date, quantity,
        destination,
        customStart: prePrinted ? customStart : null,
      });
      if ("error" in res) {
        setError(res.error);
        return;
      }
      const { created } = res;
      if (created.length === 0) {
        setError(`${destination} is full — pick another destination or lower the quantity.`);
        return;
      }
      try {
        window.localStorage.setItem(DEFAULTS_KEY, JSON.stringify({ productLine, role, model, assembledBy, printStyle }));
      } catch { /* ignore storage errors */ }
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
    return (
      <Dialog open={open} title="Serialized" onClose={close}>
        <div className="flex flex-col gap-3">
          <div className="rounded-md border border-status-new/40 bg-status-new/10 p-3">
            <p className="text-sm font-medium text-status-new">
              ✓ {result.length} register{result.length > 1 ? "s" : ""} serialized
            </p>
            <p className="text-xs text-neutral-300 mt-1">
              Placed in <span className="font-medium">{destination}</span>
            </p>
          </div>
          {shortfall && (
            <p className="text-status-used text-xs">{destination} filled up — only {result.length} of the batch fit. Pick another destination for the rest.</p>
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
        <label className="text-xs text-neutral-400">Destination
          <select className={field} value={destination} onChange={(e) => setDestination(e.target.value)}>
            {RACKS.map((r) => (
              <option key={r.label} value={r.label}>
                Rack {r.label}{STAGING_RACKS.includes(r.label) ? " (staging)" : ""}
              </option>
            ))}
            <option value={INBOUND}>{INBOUND}</option>
            <option value={PRE_DEPLOYMENT}>{PRE_DEPLOYMENT}</option>
            <option value={OUTBOUND}>{OUTBOUND}</option>
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
        <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer">
          <input
            type="checkbox"
            checked={prePrinted}
            onChange={(e) => setPrePrinted(e.target.checked)}
            className="accent-[#ef4023]"
          />
          Use pre-printed labels (enter your own starting number)
        </label>
        {prePrinted && (
          <label className="text-xs text-neutral-400">Starting serial
            <input
              className={field}
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              placeholder="7777"
            />
            {rangeEnd && (
              <span className="block mt-1 text-[11px] text-status-new">
                Will generate {quantity} serial{quantity > 1 ? "s" : ""}: {customStart.trim()} … {rangeEnd}
              </span>
            )}
          </label>
        )}
        {!prePrinted && (
          <label className="text-xs text-neutral-400">Print style
            <select className={field} value={printStyle} onChange={(e) => setPrintStyle(e.target.value as "roll" | "sheet")}>
              <option value="roll">Thermal roll (2.25&quot; x 1.25&quot;)</option>
              <option value="sheet">8 x 10 sheet</option>
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
        {busy ? "Serializing…" : prePrinted ? "Serialize batch" : "Generate & Print"}
      </button>
    </Dialog>
  );
}
