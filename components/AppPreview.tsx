"use client";

import { useState } from "react";

type Device = "desktop" | "tablet" | "mobile";

const WIDTHS: Record<Device, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

interface Props {
  html: string;
}

export default function AppPreview({ html }: Props) {
  const [device, setDevice] = useState<Device>("desktop");
  const [showCode, setShowCode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex h-full flex-col bg-slate-100">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {(["desktop", "tablet", "mobile"] as Device[]).map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={
                "rounded-md px-2.5 py-1 text-xs font-medium capitalize " +
                (device === d
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700")
              }
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            title="Reload preview"
          >
            ↻ Refresh
          </button>
          <button
            onClick={() => setShowCode((s) => !s)}
            className={
              "rounded-lg border px-2.5 py-1 text-xs font-medium " +
              (showCode
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50")
            }
          >
            {"</>"} Code
          </button>
        </div>
      </div>

      <div className="scroll-thin flex-1 overflow-auto p-3">
        {showCode ? (
          <pre className="scroll-thin h-full overflow-auto rounded-xl bg-slate-900 p-4 text-[12px] leading-relaxed text-slate-100">
            <code>{html}</code>
          </pre>
        ) : (
          <div className="flex h-full justify-center">
            <div
              className="h-full overflow-hidden rounded-xl bg-white shadow-sm transition-all"
              style={{ width: WIDTHS[device], maxWidth: "100%" }}
            >
              <iframe
                key={refreshKey}
                title="Generated App Preview"
                srcDoc={html}
                sandbox="allow-scripts allow-same-origin"
                className="h-full w-full border-0"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
