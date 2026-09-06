"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Input } from "@/components/ui/input";

export function VerifyForm() {
  const router = useRouter();
  const [serial, setSerial] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = serial.trim().toUpperCase();
    if (trimmed) router.push(`/certificates/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Input
        value={serial}
        onChange={(e) => setSerial(e.target.value)}
        placeholder="ADH-2026-XXXXXXXX"
        aria-label="Certificate serial"
        className="font-mono"
      />
      <button
        type="submit"
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-85"
      >
        Verify
      </button>
    </form>
  );
}
