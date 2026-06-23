"use client";
import { Machine, MODELS } from "@/lib/domain/types";
import { computeLineTotals } from "@/lib/domain/totals";

export function TotalsTable({ machines }: { machines: Machine[] }) {
  const { rows, grand, byModel } = computeLineTotals(machines);
  return (
    <div>
      <table className="w-full text-sm border border-pos-line">
        <thead>
          <tr className="bg-pos-vermilion text-white text-left">
            <th className="p-2 font-medium">Product line</th>
            <th className="p-2 font-medium">Role</th>
            <th className="p-2 font-medium">New</th>
            <th className="p-2 font-medium">Used</th>
            <th className="p-2 font-medium">Broken</th>
            <th className="p-2 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.line}-${r.role}`} className={i % 2 ? "bg-white/[0.03]" : ""}>
              <td className="p-2">{r.line}</td>
              <td className="p-2 text-neutral-400">{r.role}</td>
              <td className="p-2">{r.New}</td>
              <td className="p-2">{r.Used}</td>
              <td className="p-2">{r.Broken}</td>
              <td className="p-2 font-medium">{r.total}</td>
            </tr>
          ))}
          <tr className="border-t border-pos-line font-medium">
            <td className="p-2">All</td>
            <td className="p-2" />
            <td className="p-2">{grand.New}</td>
            <td className="p-2">{grand.Used}</td>
            <td className="p-2 text-status-broken">{grand.Broken}</td>
            <td className="p-2">{grand.total}</td>
          </tr>
        </tbody>
      </table>

      <p className="text-xs text-neutral-500 mt-5 mb-2">By model (on hand)</p>
      <div className="grid grid-cols-3 gap-3 max-w-md">
        {MODELS.map((model) => (
          <div key={model} className="bg-pos-surface2 rounded-md px-4 py-3">
            <p className="text-[13px] text-neutral-400">{model}</p>
            <p className="text-2xl font-medium">{byModel[model]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
