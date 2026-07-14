"use client";
import { Machine, MODELS, STATUSES, Status } from "@/lib/domain/types";
import { computeLineTotals, computeStatusBreakdown } from "@/lib/domain/totals";
import { StatusChart } from "./StatusChart";

const STATUS_TEXT: Record<Status, string> = {
  New: "text-status-new",
  Used: "text-status-used",
  Broken: "text-status-broken",
};

export function TotalsTable({ machines }: { machines: Machine[] }) {
  const { rows, grand } = computeLineTotals(machines);
  const breakdown = computeStatusBreakdown(machines);

  return (
    <div className="flex flex-col gap-6">
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

      <div>
        <p className="text-xs text-neutral-500 mb-2">On-hand by model &amp; status</p>
        <StatusChart breakdown={breakdown} />
      </div>

      {STATUSES.map((status) => {
        const section = breakdown[status];
        return (
          <div key={status}>
            <p className={`text-sm font-medium mb-2 ${STATUS_TEXT[status]}`}>
              {status} <span className="text-neutral-500 font-normal">· {section.total} on hand</span>
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
                  const c = section.byModel[model];
                  return (
                    <tr key={model} className={i % 2 ? "bg-white/[0.03]" : ""}>
                      <td className="p-2">{model}</td>
                      <td className="p-2">{c.primary}</td>
                      <td className="p-2">{c.secondary}</td>
                      <td className="p-2 font-medium">{c.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
