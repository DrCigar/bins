"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { SerialLabel } from "@/components/SerialLabel";
import { Machine } from "@/lib/domain/types";

export default function PrintPage() {
  const { data: machines = [] } = useSWR<Machine[]>("/api/machines", fetcher);
  const [serials, setSerials] = useState<string[]>([]);
  const [style, setStyle] = useState<"roll" | "sheet">("roll");

  useEffect(() => {
    const raw = sessionStorage.getItem("rl_print");
    if (raw) {
      const p = JSON.parse(raw);
      setSerials(p.serials ?? []);
      setStyle(p.printStyle ?? "roll");
    }
  }, []);

  const labels = serials
    .map((s) => machines.find((m) => m.serial === s))
    .filter((m): m is Machine => Boolean(m));

  useEffect(() => {
    if (serials.length > 0 && labels.length === serials.length) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [labels.length, serials.length]);

  return (
    <div className={style === "roll" ? "print-roll" : "print-sheet"} style={{ background: "#fff", minHeight: "100vh" }}>
      <style>{`
        @media print {
          @page { size: ${style === "roll" ? "2.25in 1.25in" : "8in 10in"}; margin: 0; }
          body { background: #fff; }
        }
        .print-sheet { display: grid; grid-template-columns: repeat(3, 2.25in); gap: 0.1in; padding: 0.2in; }
        .print-roll .serial-label { page-break-after: always; }
      `}</style>
      {labels.length === 0 ? (
        <p style={{ color: "#000", padding: 16, fontFamily: "sans-serif" }}>Preparing labels…</p>
      ) : (
        labels.map((m) => <SerialLabel key={m.id} m={m} />)
      )}
    </div>
  );
}
