"use client";

import type { Project } from "@/lib/types";

interface Props {
  projects: Project[];
  activeId: string | null;
  onOpen: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function ProjectSidebar({
  projects,
  activeId,
  onOpen,
  onNew,
  onDelete,
}: Props) {
  return (
    <aside className="flex h-full flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚛️</span>
          <span className="font-semibold text-slate-800">Mini Atoms</span>
        </div>
        <button
          onClick={onNew}
          className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          + New
        </button>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto p-2">
        <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Projects
        </div>
        {projects.length === 0 ? (
          <p className="px-2 py-3 text-xs text-slate-400">
            No projects yet. Build your first app.
          </p>
        ) : (
          <ul className="space-y-1">
            {projects.map((p) => (
              <li key={p.id}>
                <div
                  className={
                    "group flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 " +
                    (p.id === activeId
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-100")
                  }
                  onClick={() => onOpen(p.id)}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {relativeTime(p.updatedAt)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(p.id);
                    }}
                    className="ml-2 hidden shrink-0 rounded px-1.5 text-slate-400 hover:bg-red-100 hover:text-red-600 group-hover:block"
                    title="Delete project"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-200 px-3 py-2 text-[11px] text-slate-400">
        Projects are saved in this browser.
      </div>
    </aside>
  );
}
