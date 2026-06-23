"use client";
import useSWR from "swr";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TotalsTable } from "@/components/TotalsTable";
import { CheckInDialog } from "@/components/CheckInDialog";
import { CheckOutDialog } from "@/components/CheckOutDialog";
import { SerializeDialog } from "@/components/SerializeDialog";
import { fetcher } from "@/lib/fetcher";
import { Machine, OUT, PRE_DEPLOYMENT } from "@/lib/domain/types";

export default function TotalsPage() {
  const { data: machines = [], mutate } = useSWR<Machine[]>("/api/machines", fetcher, { refreshInterval: 4000 });
  const [serialize, setSerialize] = useState(false);
  const [checkIn, setCheckIn] = useState(false);
  const [checkOut, setCheckOut] = useState(false);

  const onHand = machines.filter((m) => m.location !== OUT);
  const broken = onHand.filter((m) => m.status === "Broken").length;
  const pre = machines.filter((m) => m.location === PRE_DEPLOYMENT).length;

  const stat = (label: string, value: number, accent = false) => (
    <div className="bg-pos-surface2 rounded-md px-4 py-3">
      <p className="text-[13px] text-neutral-400">{label}</p>
      <p className={`text-2xl font-medium ${accent ? "text-pos-vermilion" : ""}`}>{value}</p>
    </div>
  );

  return (
    <AppShell machines={machines} onSerialize={() => setSerialize(true)} onCheckIn={() => setCheckIn(true)} onCheckOut={() => setCheckOut(true)}>
      <div className="grid grid-cols-3 gap-3 mb-4 max-w-md">
        {stat("On hand", onHand.length)}
        {stat("Broken", broken, true)}
        {stat("Pre-Deployment", pre)}
      </div>
      <TotalsTable machines={machines} />
      <SerializeDialog open={serialize} onClose={() => setSerialize(false)} onDone={() => mutate()} />
      <CheckInDialog open={checkIn} onClose={() => { setCheckIn(false); mutate(); }} machines={machines} />
      <CheckOutDialog open={checkOut} onClose={() => { setCheckOut(false); mutate(); }} machines={machines} />
    </AppShell>
  );
}
