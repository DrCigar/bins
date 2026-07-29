"use client";
import { useState } from "react";
import { MODELS, Model } from "@/lib/domain/types";
import { setManualCountAction } from "@/app/actions";

type Cell = { primary: number; secondary: number };
type Counts = Record<Model, Cell>;

const emptyCounts = (): Counts =>
  MODELS.reduce((acc, m) => ({ ...acc, [m]: { primary: 0, secondary: 0 } }), {} as Counts);

const field = "bg-pos-surface2 border border-pos-line rounded-md px-2 py-1 text-sm w-16 text-white";

// Editable manual counts for an off-site location (San Diego / San Francisco). Saves on blur.
export function ManualTotals({ location, initial }: { location: string; initial: Counts }) {
  const [counts, setCounts] = useState<Counts>({ ...emptyCounts(), ...initial });
  const [savedAt, setSavedAt] = useState<Model | null>(null);
  const [error, setError] = useState("");

  const set = (model: Model, key: keyof Cell, value: number) =>
    setCounts((c) => ({ ...c, [model]: { ...c[model], [key]: value } }));

  async function save(model: Model) {
    setError("");
    const cell = counts[model];
    const res = await setManualCountAction(location, model, cell.primary, cell.secondary);
    if ("error" in res) { setError(res.error); return; }
    setSavedAt(model);
    setTimeout(() => setSavedAt((m) => (m === model ? null : m)), 1500);
  }

  const grand = MODELS.reduce((s, m) => s + counts[m].primary + counts[m].secondary, 0);

  return (
    <div>
      <p className="text-sm font-medium mb-2">
        {location} <span className="text-neutral-500 font-normal">· {grand} total (manual)</span>
      </p>
      <table className="w-full text-sm border border-pos-line max-w-md">
        <thead>
          <tr className="bg-pos-surface2 text-left text-neutral-400">
            <th className="p-2 font-medium">Model</th>
            <th className="p-2 font-medium">Primary</th>
            <th className="p-2 font-medium">Secondary</th>
            <th className="p-2 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {MODELS.map((model, i) => {
            const c = counts[model];
            return (
              <tr key={model} className={i % 2 ? "bg-white/[0.03]" : ""}>
                <td className="p-2">{model} {savedAt === model && <span className="text-status-new text-[11px]">✓</span>}</td>
                <td className="p-2">
                  <input type="number" min={0} className={field} value={c.primary}
                    onChange={(e) => set(model, "primary", Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                    onBlur={() => save(model)} />
                </td>
                <td className="p-2">
                  <input type="number" min={0} className={field} value={c.secondary}
                    onChange={(e) => set(model, "secondary", Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                    onBlur={() => save(model)} />
                </td>
                <td className="p-2 font-medium">{c.primary + c.secondary}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {error && <p className="text-status-broken text-xs mt-1">{error}</p>}
    </div>
  );
}
