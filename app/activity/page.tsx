"use client";
import useSWR from "swr";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CheckInDialog } from "@/components/CheckInDialog";
import { CheckOutDialog } from "@/components/CheckOutDialog";
import { SerializeDialog } from "@/components/SerializeDialog";
import { fetcher } from "@/lib/fetcher";
import { groupSerializationByDay } from "@/lib/domain/activity";
import { Machine, SerializationEvent, roleTag } from "@/lib/domain/types";

const prettyDay = (day: string) =>
  new Date(day + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
const prettyTime = (d: Date) =>
  new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export default function ActivityPage() {
  const { data: machines = [], mutate } = useSWR<Machine[]>("/api/machines", fetcher, { refreshInterval: 8000 });
  const { data: events = [] } = useSWR<SerializationEvent[]>("/api/serialization", fetcher, { refreshInterval: 8000 });
  const [serialize, setSerialize] = useState(false);
  const [checkIn, setCheckIn] = useState(false);
  const [checkOut, setCheckOut] = useState(false);

  const groups = groupSerializationByDay(events);

  return (
    <AppShell machines={machines} onSerialize={() => setSerialize(true)} onCheckIn={() => setCheckIn(true)} onCheckOut={() => setCheckOut(true)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-medium">Serialization activity</h2>
          <p className="text-xs text-neutral-500">{events.length} unit{events.length === 1 ? "" : "s"} serialized, all time</p>
        </div>
        <a href="/api/export/serialization" className="text-sm px-3 py-1.5 rounded-md border border-pos-line hover:bg-neutral-900">
          Export activity CSV
        </a>
      </div>

      {groups.length === 0 && <p className="text-sm text-neutral-500">No serialization activity yet.</p>}

      <div className="flex flex-col gap-5">
        {groups.map((g) => (
          <div key={g.day}>
            <div className="flex items-baseline gap-3 mb-2">
              <h3 className="text-sm font-medium">{prettyDay(g.day)}</h3>
              <span className="text-xs text-neutral-500">{g.events.length} serialized</span>
            </div>
            <table className="w-full text-sm border border-pos-line">
              <thead>
                <tr className="bg-pos-surface2 text-left text-neutral-400">
                  <th className="p-2 font-medium">Time</th>
                  <th className="p-2 font-medium">Serial</th>
                  <th className="p-2 font-medium">Product</th>
                  <th className="p-2 font-medium">Model</th>
                  <th className="p-2 font-medium">Assembled by</th>
                </tr>
              </thead>
              <tbody>
                {g.events.map((e) => (
                  <tr key={e.id} className="border-t border-pos-line">
                    <td className="p-2 text-neutral-400">{prettyTime(e.serializedAt)}</td>
                    <td className="p-2 font-medium">{e.serial}</td>
                    <td className="p-2">{e.productLine} <span className="text-neutral-400">{roleTag(e.role)}</span></td>
                    <td className="p-2 text-neutral-400">{e.model}</td>
                    <td className="p-2 text-neutral-400">{e.assembledBy ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <SerializeDialog open={serialize} onClose={() => setSerialize(false)} onDone={() => mutate()} />
      <CheckInDialog open={checkIn} onClose={() => { setCheckIn(false); mutate(); }} machines={machines} />
      <CheckOutDialog open={checkOut} onClose={() => { setCheckOut(false); mutate(); }} machines={machines} />
    </AppShell>
  );
}
