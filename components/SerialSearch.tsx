"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Machine, OUT } from "@/lib/domain/types";

export function SerialSearch({ machines }: { machines: Machine[] }) {
  const [q, setQ] = useState("");
  const [miss, setMiss] = useState(false);
  const router = useRouter();

  function go() {
    const hit = machines.find((m) => m.serial?.toLowerCase() === q.trim().toLowerCase());
    if (hit && hit.location !== OUT) {
      setMiss(false);
      router.push(`/rack/${encodeURIComponent(hit.location)}?slot=${hit.slot ?? ""}`);
    } else {
      setMiss(true);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 bg-pos-surface2 border border-pos-line rounded-md px-3 py-1.5">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setMiss(false); }}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="Search serial…"
          className="bg-transparent text-sm outline-none w-44 text-white"
        />
        <button onClick={go} className="text-xs text-neutral-400 hover:text-white">Go</button>
      </div>
      {miss && <span className="text-xs text-status-broken">Not found on hand</span>}
    </div>
  );
}
