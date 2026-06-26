"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SerialSearch } from "./SerialSearch";
import { Machine } from "@/lib/domain/types";

export function AppShell({
  children, machines, onSerialize, onCheckIn, onCheckOut, autoFocusSearch = false,
}: {
  children: React.ReactNode;
  machines: Machine[];
  onSerialize: () => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  autoFocusSearch?: boolean;
}) {
  const path = usePathname();
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
      <header className="relative flex items-center justify-between gap-3 px-4 py-3 bg-black border-l-4 border-pos-vermilion">
        <Image src="/pos360-logo.png" alt="POS360" width={149} height={40} priority />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <SerialSearch machines={machines} autoFocus={autoFocusSearch} />
        </div>
        <div className="flex items-center gap-2">
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
            onClick={onCheckOut}
            className="text-sm font-medium px-3 py-1.5 rounded-md bg-pos-vermilion text-white"
          >
            Check Out
          </button>
          <a
            href="/api/export"
            className="text-sm px-3 py-1.5 rounded-md border border-pos-line hover:bg-neutral-900"
          >
            Export CSV
          </a>
        </div>
      </header>
      <nav className="flex gap-5 px-4 bg-black border-b border-pos-line pt-1">
        {tab("/", "Floor map")}
        {tab("/totals", "Totals")}
        {tab("/activity", "Activity")}
      </nav>
      <main className="p-4">{children}</main>
    </div>
  );
}
