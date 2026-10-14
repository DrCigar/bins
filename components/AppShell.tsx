"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { SerialSearch } from "./SerialSearch";
import { ScanDialog } from "./ScanDialog";
import { Machine } from "@/lib/domain/types";

export function AppShell({
  children, machines, onSerialize, onCheckIn, autoFocusSearch = false,
}: {
  children: React.ReactNode;
  machines: Machine[];
  onSerialize: () => void;
  onCheckIn: () => void;
  autoFocusSearch?: boolean;
}) {
  const path = usePathname();
  const [scanOpen, setScanOpen] = useState(false);
  const tab = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm pb-1.5 border-b-2 ${
        path === href ? "text-white border-pos-vermilion" : "text-neutral-400 border-transparent"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div>
      <header className="flex flex-col items-center gap-3 px-4 py-3 bg-black border-l-4 border-pos-vermilion">
        <Image src="/pos360-logo.png" alt="POS360" width={149} height={40} priority className="mx-auto" />
        <div className="flex w-full flex-wrap items-center justify-center gap-3 sm:justify-between">
          <SerialSearch machines={machines} autoFocus={autoFocusSearch} />
          <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={onSerialize}
            className="text-sm font-medium px-3 py-1.5 rounded-md border border-pos-line hover:bg-neutral-900"
          >
            Serialize
          </button>
          <button
            onClick={onCheckIn}
            className="text-sm font-medium px-3 py-1.5 rounded-md border border-pos-line hover:bg-neutral-900"
          >
            Check In
          </button>
          <button
            onClick={() => setScanOpen(true)}
            className="text-sm font-medium px-3 py-1.5 rounded-md bg-pos-vermilion text-white flex items-center gap-1.5"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M6 12h12" />
            </svg>
            Scan / Find
          </button>
          <a
            href="/api/export"
            className="text-sm px-3 py-1.5 rounded-md border border-pos-line hover:bg-neutral-900"
          >
            Export CSV
          </a>
          </div>
        </div>
      </header>
      <nav className="flex gap-5 px-4 bg-black border-b border-pos-line pt-1">
        {tab("/", "Floor map")}
        {tab("/totals", "Totals")}
        {tab("/activity", "Activity")}
      </nav>
      <main className="p-2 sm:p-4">{children}</main>
      <ScanDialog open={scanOpen} onClose={() => setScanOpen(false)} machines={machines} />
    </div>
  );
}
