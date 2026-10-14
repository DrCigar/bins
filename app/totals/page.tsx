"use client";
import useSWR from "swr";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TotalsTable } from "@/components/TotalsTable";
import { ManualTotals } from "@/components/ManualTotals";
import { CheckInDialog } from "@/components/CheckInDialog";
import { SerializeDialog } from "@/components/SerializeDialog";
import { fetcher } from "@/lib/fetcher";
import { Machine, OUT, PRE_DEPLOYMENT, MANUAL_LOCATIONS, MODELS, Model } from "@/lib/domain/types";
import type { ManualCountRow } from "@/lib/db/schema";

type Cell = { primary: number; secondary: number };
type Counts = Record<Model, Cell>;
const countsFor = (rows: ManualCountRow[], location: string): Counts =>
  MODELS.reduce((acc, m) => {
    const row = rows.find((r) => r.location === location && r.model === m);
    return { ...acc, [m]: { primary: row?.primaryCount ?? 0, secondary: row?.secondaryCount ?? 0 } };
  }, {} as Counts);

export default function TotalsPage() {
  const { data: machines = [], mutate } = useSWR<Machine[]>("/api/machines", fetcher, { refreshInterval: 4000 });
  const { data: manual = [] } = useSWR<ManualCountRow[]>("/api/manual", fetcher);
  const [serialize, setSerialize] = useState(false);
  const [checkIn, setCheckIn] = useState(false);

  const onHand = machines.filter((m) => m.location !== OUT);
  const good = onHand.filter((m) => m.status !== "Broken").length; // totals exclude broken
  const broken = onHand.filter((m) => m.status === "Broken").length;
  const pre = machines.filter((m) => m.location === PRE_DEPLOYMENT).length;

  const stat = (label: string, value: number, accent = false) => (
    <div className="bg-pos-surface2 rounded-md px-4 py-3">
      <p className="text-[13px] text-neutral-400">{label}</p>
      <p className={`text-2xl font-medium ${accent ? "text-pos-vermilion" : ""}`}>{value}</p>
    </div>
  );

  return (
    <AppShell machines={machines} onSerialize={() => setSerialize(true)} onCheckIn={() => setCheckIn(true)}>
      <div className="grid grid-cols-3 gap-3 mb-4 max-w-md">
        {stat("On hand", good)}
        {stat("Broken", broken, true)}
        {stat("Pre-Deployment", pre)}
      </div>

      <h2 className="text-base font-medium mb-3">Main warehouse</h2>
      <TotalsTable machines={machines} />

      <div className="mt-8 flex flex-col gap-6">
        <p className="text-xs text-neutral-500">Off-site locations (manually maintained)</p>
        {MANUAL_LOCATIONS.map((loc) => {
          const c = countsFor(manual, loc);
          // Key includes the loaded data so the editor seeds correctly once /api/manual resolves.
          return <ManualTotals key={`${loc}:${JSON.stringify(c)}`} location={loc} initial={c} />;
        })}
      </div>

      <SerializeDialog open={serialize} onClose={() => setSerialize(false)} onDone={() => mutate()} />
      <CheckInDialog open={checkIn} onClose={() => { setCheckIn(false); mutate(); }} machines={machines} />
    </AppShell>
  );
}
