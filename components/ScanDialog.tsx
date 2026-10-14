"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "./Dialog";
import { Machine, OUT, isOpenArea } from "@/lib/domain/types";
import { slotLabel } from "@/lib/layout/warehouse";

// Describe where a unit sits, for the confirm prompt.
function whereLabel(m: Machine): string {
  if (isOpenArea(m.location)) return m.location;
  const slot = m.slot != null ? `, slot ${slotLabel(m.location, m.slot)}` : "";
  return `Rack ${m.location}${slot}`;
}

type Phase =
  | { kind: "input" }
  | { kind: "confirm"; machine: Machine }
  | { kind: "out"; machine: Machine }
  | { kind: "notfound"; query: string };

// Scan or type a serial, find it in ANY location, then offer to switch there (pulsing the unit).
export function ScanDialog({ open, onClose, machines }: { open: boolean; onClose: () => void; machines: Machine[] }) {
  const [q, setQ] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "input" });
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setQ("");
      setPhase({ kind: "input" });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  function find() {
    const query = q.trim().toLowerCase();
    if (!query) return;
    const hit = machines.find((m) => m.serial?.toLowerCase() === query);
    if (!hit) setPhase({ kind: "notfound", query: q.trim() });
    else if (hit.location === OUT) setPhase({ kind: "out", machine: hit });
    else setPhase({ kind: "confirm", machine: hit });
  }

  function goTo(m: Machine) {
    router.push(`/rack/${encodeURIComponent(m.location)}?hl=${m.id}`);
    onClose();
  }

  const reset = () => { setQ(""); setPhase({ kind: "input" }); setTimeout(() => inputRef.current?.focus(), 50); };

  return (
    <Dialog open={open} title="Scan / find a register" onClose={onClose}>
      <div className="flex items-center gap-2 bg-pos-surface2 border border-pos-line rounded-md px-3 py-2">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setPhase({ kind: "input" }); }}
          onKeyDown={(e) => e.key === "Enter" && find()}
          placeholder="Scan or type a serial…"
          className="bg-transparent text-sm outline-none w-full text-white"
        />
        <button onClick={find} className="text-sm font-medium text-pos-vermilion">Find</button>
      </div>

      {phase.kind === "notfound" && (
        <p className="mt-3 text-sm text-status-broken">
          “{phase.query}” isn’t in the system (nothing on the floor has that serial).
        </p>
      )}

      {phase.kind === "out" && (
        <p className="mt-3 text-sm text-neutral-300">
          <span className="font-medium">{phase.machine.serial}</span> is checked out
          {phase.machine.destination ? <> to <span className="font-medium">{phase.machine.destination}</span></> : ""} — not on the floor.
        </p>
      )}

      {phase.kind === "confirm" && (
        <div className="mt-3">
          <p className="text-sm text-neutral-200">
            Found <span className="font-medium">{phase.machine.serial}</span> in{" "}
            <span className="font-medium text-pos-vermilion">{whereLabel(phase.machine)}</span>.
          </p>
          <p className="text-sm text-neutral-400 mt-0.5">Switch to that location?</p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => goTo(phase.machine)} className="flex-1 bg-pos-vermilion rounded-md py-2 text-sm font-medium">
              Yes, take me there
            </button>
            <button onClick={reset} className="px-3 rounded-md border border-pos-line text-sm hover:bg-neutral-900">
              Search again
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
