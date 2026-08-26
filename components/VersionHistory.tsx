"use client";

import type { AppVersion } from "@/lib/types";

interface Props {
  versions: AppVersion[];
  onPreview: (code: string) => void;
  onRestore: (version: AppVersion) => void;
  onClose: () => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function VersionHistory({
  versions,
  onPreview,
  onRestore,
  onClose,
}: Props) {
  const ordered = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">Version History</h3>
        <button
          onClick={onClose}
          className="rounded-md px-2 py-1 text-slate-400 hover:bg-slate-100"
        >
          ✕
        </button>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto p-3">
        {ordered.length === 0 ? (
          <p className="px-1 py-3 text-xs text-slate-400">No versions yet.</p>
        ) : (
          <ul className="space-y-2">
            {ordered.map((v) => (
              <li
                key={v.id}
                className="rounded-xl border border-slate-200 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    V{v.versionNumber}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {timeAgo(v.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{v.summary}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => onPreview(v.code)}
                    className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => onRestore(v)}
                    className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Restore
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
