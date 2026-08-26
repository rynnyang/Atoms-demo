"use client";

import type { GenerationStatus } from "@/lib/types";

const STEPS: { key: GenerationStatus; label: string }[] = [
  { key: "understanding", label: "Understanding request" },
  { key: "planning", label: "Planning app" },
  { key: "building", label: "Building interface" },
  { key: "ready", label: "App ready" },
];

function Spinner() {
  return (
    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-indigo-300 border-t-transparent" />
  );
}

export default function AgentStatus({ status }: { status: GenerationStatus }) {
  if (status === "idle") return null;

  if (status === "error") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
        <span>⚠️</span>
        <span>Something went wrong while generating.</span>
      </div>
    );
  }

  const activeIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex flex-wrap gap-2">
      {STEPS.map((s, i) => {
        const done = status === "ready" || activeIndex > i;
        const active = s.key === status;
        return (
          <span
            key={s.key}
            className={
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium " +
              (done
                ? "bg-green-50 text-green-700"
                : active
                ? "bg-indigo-50 text-indigo-700"
                : "bg-slate-100 text-slate-400")
            }
          >
            {active && !done ? <Spinner /> : done ? "✓" : "•"}
            {s.label}
          </span>
        );
      })}
    </div>
  );
}
