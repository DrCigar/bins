"use client";
import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { unlockAction } from "@/app/actions";

export default function UnlockPage() {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await unlockAction(formData);
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(res.error ?? "Try again");
      }
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5">
      <Image src="/pos360-logo.png" alt="POS360" width={224} height={60} priority />
      <p className="text-xs tracking-[0.18em] text-neutral-500 -mt-2">SYSTEMS MADE SIMPLE</p>
      <form action={onSubmit} className="flex flex-col gap-3 w-72">
        <input
          name="passcode"
          type="password"
          placeholder="Team passcode"
          autoFocus
          className="bg-pos-surface border border-pos-line rounded-md px-3 py-2 text-sm text-white"
        />
        <button
          disabled={pending}
          className="bg-pos-vermilion rounded-md py-2 text-sm font-medium disabled:opacity-60"
        >
          {pending ? "Unlocking…" : "Unlock"}
        </button>
        {error && <p className="text-status-broken text-xs">{error}</p>}
      </form>
    </div>
  );
}
