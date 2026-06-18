"use client";
import { Machine } from "@/lib/domain/types";
import { computeTotals } from "@/lib/domain/totals";

export function TotalsTable({ machines }: { machines: Machine[] }) {
  const { rows, grand } = computeTotals(machines);
  return (
    <table className="w-full text-sm border border-pos-line">
      <thead>
        <tr className="bg-pos-vermilion text-white text-left">
          <th className="p-2 font-medium">Model</th>
          <th className="p-2 font-medium">Role</th>
          <th className="p-2 font-medium">New</th>
          <th className="p-2 font-medium">Used</th>
          <th className="p-2 font-medium">Broken</th>
          <th className="p-2 font-medium">Total</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={`${r.model}-${r.role}`} className={i % 2 ? "bg-white/[0.03]" : ""}>
            <td className="p-2">{r.model}</td>
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
  );
}
