"use client";
import { Machine, STATUSES, Status } from "@/lib/domain/types";
import { computeLineTotals, computeStatusBreakdown, computeStatusCombos, LINE_ROLES } from "@/lib/domain/totals";
import { StatusChart } from "./StatusChart";

const STATUS_TEXT: Record<Status, string> = {
  New: "text-status-new",
  Used: "text-status-used",
  Review: "text-status-review",
  Breakdown: "text-status-broken",
};

export function TotalsTable({ machines }: { machines: Machine[] }) {
  const { rows, grand } = computeLineTotals(machines);
  const breakdown = computeStatusBreakdown(machines);
  const combos = computeStatusCombos(machines);

  return (
    <div className="flex flex-col gap-6">
      <table className="w-full text-sm border border-pos-line">
        <thead>
          <tr className="bg-pos-vermilion text-white text-left">
            <th className="p-2 font-medium">Product line</th>
            <th className="p-2 font-medium">Role</th>
            {STATUSES.map((s) => <th key={s} className="p-2 font-medium">{s}</th>)}
            <th className="p-2 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.line}-${r.role}`} className={i % 2 ? "bg-white/[0.03]" : ""}>
              <td className="p-2">{r.line}</td>
              <td className="p-2 text-neutral-400">{r.role}</td>
              {STATUSES.map((s) => <td key={s} className="p-2">{r.byStatus[s]}</td>)}
              <td className="p-2 font-medium">{r.total}</td>
            </tr>
          ))}
          <tr className="border-t border-pos-line font-medium">
            <td className="p-2">All</td>
            <td className="p-2" />
            {STATUSES.map((s) => <td key={s} className={`p-2 ${STATUS_TEXT[s]}`}>{grand.byStatus[s]}</td>)}
            <td className="p-2">{grand.total}</td>
          </tr>
        </tbody>
      </table>

      <div>
        <p className="text-xs text-neutral-500 mb-2">On-hand by model &amp; status</p>
        <StatusChart breakdown={breakdown} />
      </div>

      <div>
        <p className="text-xs text-neutral-500 mb-2">By status &amp; product line</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {STATUSES.map((status) => {
            const section = combos[status];
            return (
              <div key={status} className="border border-pos-line rounded-md overflow-hidden">
                <p className={`text-sm font-medium px-3 py-2 bg-pos-surface2 ${STATUS_TEXT[status]}`}>
                  {status} <span className="text-neutral-500 font-normal">· {section.total}</span>
                </p>
                <table className="w-full text-sm">
                  <tbody>
                    {LINE_ROLES.map((lr, i) => (
                      <tr key={lr.label} className={i % 2 ? "bg-white/[0.03]" : ""}>
                        <td className="px-3 py-1.5 text-neutral-300 whitespace-nowrap">{lr.label}</td>
                        <td className="px-3 py-1.5 text-right font-medium">{section.counts[i]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
