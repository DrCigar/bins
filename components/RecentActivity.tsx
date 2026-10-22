"use client";
import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { SerializationEvent, roleTag } from "@/lib/domain/types";

const fmtTime = (d: Date | string) => {
  const date = new Date(d);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Compact live feed of the most recently serialized units. Collapsible rail on wide screens.
export function RecentActivity({ onClose }: { onClose: () => void }) {
  const { data: events = [] } = useSWR<SerializationEvent[]>("/api/serialization", fetcher, { refreshInterval: 8000 });
  const recent = [...events]
    .sort((a, b) => new Date(b.serializedAt).getTime() - new Date(a.serializedAt).getTime())
    .slice(0, 15);

  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0 border-l border-pos-line bg-pos-surface/60 max-h-[calc(100vh-7.5rem)] sticky top-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-pos-line">
        <p className="text-sm font-medium">Recent activity</p>
        <button onClick={onClose} aria-label="Hide activity panel" className="text-neutral-500 hover:text-white text-sm leading-none">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {recent.length === 0 ? (
          <p className="text-xs text-neutral-500 p-3">No serialization activity yet.</p>
        ) : (
          <ul className="divide-y divide-pos-line">
            {recent.map((e) => (
              <li key={e.id} className="px-3 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-white truncate">{e.serial}</span>
                  <span className="text-[10px] text-neutral-500 shrink-0">{fmtTime(e.serializedAt)}</span>
                </div>
                <p className="text-[11px] text-neutral-400 truncate">
                  {e.model} <span className="text-neutral-500">{roleTag(e.role)}</span>
                  {e.assembledBy ? <span className="text-neutral-600"> · {e.assembledBy}</span> : null}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-pos-line px-3 py-2">
        <Link href="/activity" className="text-xs text-pos-vermilion hover:underline">View all activity →</Link>
      </div>
    </aside>
  );
}
