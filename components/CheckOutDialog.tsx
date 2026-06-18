"use client";
import { useMemo, useState } from "react";
import { Dialog } from "./Dialog";
import { rankOldestFirst } from "@/lib/domain/ranking";
import { MODELS, Model, Machine, roleTag, PRE_DEPLOYMENT, OUTBOUND } from "@/lib/domain/types";
import { parseSerialDate } from "@/lib/domain/serial";
import { checkOutAction } from "@/app/actions";

const field = "bg-pos-surface2 border border-pos-line rounded-md px-3 py-2 text-sm w-full mt-1 text-white";

export function CheckOutDialog({
  open, onClose, machines,
}: {
  open: boolean;
  onClose: () => void;
  machines: Machine[];
}) {
  const [model, setModel] = useState<Model>("Matsuda");
  const [chosenId, setChosenId] = useState<number | null>(null);
  const [destKind, setDestKind] = useState<"pre" | "outbound" | "store">("pre");
  const [store, setStore] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const ranked = useMemo(() => rankOldestFirst(machines, model), [machines, model]);

  async function submit() {
    setError("");
    if (!chosenId) { setError("Pick a machine"); return; }
    if (destKind === "store" && !store.trim()) { setError("Enter a store name"); return; }
    setBusy(true);
    try {
      const dest =
        destKind === "store"
          ? ({ kind: "store", name: store } as const)
          : ({ kind: "area", area: destKind === "outbound" ? OUTBOUND : PRE_DEPLOYMENT } as const);
      await checkOutAction(chosenId, dest);
      setChosenId(null); setStore(""); onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check out failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} title="Check Out a register" onClose={onClose}>
      <label className="text-xs text-neutral-400">
        Model
        <select
          className={field}
          value={model}
          onChange={(e) => { setModel(e.target.value as Model); setChosenId(null); }}
        >
          {MODELS.map((x) => <option key={x}>{x}</option>)}
        </select>
      </label>

      <p className="text-xs text-neutral-500 mt-3 mb-1">Oldest first — pick one</p>
      <div className="max-h-44 overflow-auto flex flex-col gap-1">
        {ranked.length === 0 && <p className="text-xs text-neutral-600">No {model} on hand.</p>}
        {ranked.map((m, i) => {
          const d = parseSerialDate(m.serial);
          return (
            <button
              key={m.id}
              onClick={() => setChosenId(m.id)}
              className={`text-left rounded-md px-3 py-2 border ${
                chosenId === m.id ? "border-pos-vermilion bg-pos-vermilion/10" : "border-pos-line"
              }`}
            >
              <span className="text-xs font-medium">
                {m.serial} <span className="text-neutral-400">{roleTag(m.role)}</span>
              </span>
              <span className="text-[11px] text-neutral-500">
                {" "}· {m.location}{m.slot ? `-${m.slot}` : ""} · {d ? d.toISOString().slice(0, 10) : "date?"}
                {i === 0 ? " · oldest" : ""}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          onClick={() => setDestKind("pre")}
          className={`rounded-md py-2 text-sm border ${destKind === "pre" ? "border-pos-vermilion" : "border-pos-line"}`}
        >
          Pre-Deploy
        </button>
        <button
          onClick={() => setDestKind("outbound")}
          className={`rounded-md py-2 text-sm border ${destKind === "outbound" ? "border-pos-vermilion" : "border-pos-line"}`}
        >
          Outbound
        </button>
        <button
          onClick={() => setDestKind("store")}
          className={`rounded-md py-2 text-sm border ${destKind === "store" ? "border-pos-vermilion" : "border-pos-line"}`}
        >
          To a store
        </button>
      </div>
      {destKind === "store" && (
        <input
          className={field}
          placeholder="Store / merchant name"
          value={store}
          onChange={(e) => setStore(e.target.value)}
        />
      )}

      {error && <p className="text-status-broken text-xs mt-2">{error}</p>}
      <button
        onClick={submit}
        disabled={busy}
        className="mt-4 w-full bg-pos-vermilion rounded-md py-2 text-sm font-medium disabled:opacity-60"
      >
        {busy ? "Checking out…" : "Check Out"}
      </button>
    </Dialog>
  );
}
