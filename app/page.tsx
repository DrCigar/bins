"use client";
import useSWR from "swr";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { FloorMap } from "@/components/FloorMap";
import { CheckInDialog } from "@/components/CheckInDialog";
import { CheckOutDialog } from "@/components/CheckOutDialog";
import { SerializeDialog } from "@/components/SerializeDialog";
import { fetcher } from "@/lib/fetcher";
import { Machine, OUT } from "@/lib/domain/types";

export default function Home() {
  const { data: machines = [], mutate } = useSWR<Machine[]>("/api/machines", fetcher, { refreshInterval: 4000 });
  const [serialize, setSerialize] = useState(false);
  const [checkIn, setCheckIn] = useState(false);
  const [checkOut, setCheckOut] = useState(false);
  const router = useRouter();

  const onHand = machines.filter((m) => m.location !== OUT);
  const broken = onHand.filter((m) => m.status === "Broken").length;

  return (
    <AppShell machines={machines} autoFocusSearch onSerialize={() => setSerialize(true)} onCheckIn={() => setCheckIn(true)} onCheckOut={() => setCheckOut(true)}>
      <div className="mb-3 flex items-center gap-4">
        <div className="text-xs text-neutral-400 flex gap-4 ml-auto">
          <span><b className="text-white">{onHand.length}</b> on hand</span>
          <span><b className="text-pos-vermilion">{broken}</b> broken</span>
        </div>
      </div>
      <FloorMap machines={machines} onSelect={(label) => router.push(`/rack/${encodeURIComponent(label)}`)} />
      <SerializeDialog open={serialize} onClose={() => setSerialize(false)} onDone={() => mutate()} />
      <CheckInDialog open={checkIn} onClose={() => { setCheckIn(false); mutate(); }} machines={machines} />
      <CheckOutDialog open={checkOut} onClose={() => { setCheckOut(false); mutate(); }} machines={machines} />
    </AppShell>
  );
}
