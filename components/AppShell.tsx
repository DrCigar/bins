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
      <header className="flex items-center gap-3 px-4 py-3 bg-black border-l-4 border-pos-vermilion flex-wrap">
        <Image src="/pos360-logo.png" alt="POS360" width={121} height={28} priority />
        <span className="w-px h-4 bg-neutral-700" />
        <div className="leading-tight">
          <p className="text-sm font-medium">Register Locator</p>
          <p className="text-[10px] tracking-[0.18em] text-neutral-500">SYSTEMS MADE SIMPLE</p>
        </div>
        <div className="ml-2"><SerialSearch machines={machines} autoFocus={autoFocusSearch} /></div>
        <div className="ml-auto flex items-center gap-2">
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
