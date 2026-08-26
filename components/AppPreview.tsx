"use client";

import { useMemo, useState } from "react";

type Device = "desktop" | "tablet" | "mobile";
type Panel = "preview" | "code" | "review";
type ReviewStatus = "pass" | "warning" | "fail";

const WIDTHS: Record<Device, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

const DEVICE_LABELS: Record<Device, string> = {
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Mobile",
};

interface ReviewCheck {
  label: string;
  detail: string;
  status: ReviewStatus;
}

interface Props {
  html: string;
}

function countMatches(value: string, pattern: RegExp): number {
  return value.match(pattern)?.length ?? 0;
}

function reviewHtml(html: string): ReviewCheck[] {
  const hasDocument = /<!doctype\s+html/i.test(html) && /<html[\s>]/i.test(html);
  const hasStyles = /<style[\s>][\s\S]*?<\/style>/i.test(html);
  const hasScript = /<script[\s>][\s\S]*?<\/script>/i.test(html);
  const buttonCount = countMatches(html, /<button[\s>]/gi);
  const eventCount =
    countMatches(html, /\.onclick\s*=|addEventListener\s*\(/gi) +
    countMatches(html, /\sonclick\s*=/gi);
  const externalResource = /<(?:script|link|img)[^>]+(?:src|href)=["']https?:\/\//i.test(html);
  const usesStorage = /localStorage/i.test(html);

  return [
    {
      label: "Complete HTML document",
      detail: hasDocument
        ? "Includes <!DOCTYPE html> and an HTML root element."
        : "The preview may be incomplete because a full HTML document was not found.",
      status: hasDocument ? "pass" : "fail",
    },
    {
      label: "Self-contained presentation",
      detail: hasStyles
        ? "Inline CSS was found, so the app can render without a build step."
        : "No inline <style> block was found.",
      status: hasStyles ? "pass" : "warning",
    },
    {
      label: "Interactive behavior",
      detail:
        hasScript && eventCount > 0
          ? `${buttonCount} button(s) and ${eventCount} event binding(s) were detected.`
          : "No clear button event binding was detected; test the preview manually.",
      status: hasScript && eventCount > 0 ? "pass" : "warning",
    },
    {
      label: "External dependencies",
      detail: externalResource
        ? "An external resource URL was detected. It may fail offline or under restrictive preview rules."
        : "No external script, stylesheet, or image URL was detected.",
      status: externalResource ? "warning" : "pass",
    },
    {
      label: "Local data persistence",
      detail: usesStorage
        ? "The app uses localStorage for browser-local persistence."
        : "No localStorage usage was found. This is fine for stateless apps.",
      status: usesStorage ? "pass" : "warning",
    },
  ];
}

function statusClass(status: ReviewStatus): string {
  if (status === "pass") return "bg-emerald-50 text-emerald-700";
  if (status === "warning") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

function statusLabel(status: ReviewStatus): string {
  if (status === "pass") return "Pass";
  if (status === "warning") return "Review";
  return "Issue";
}

export default function AppPreview({ html }: Props) {
  const [device, setDevice] = useState<Device>("desktop");
  const [panel, setPanel] = useState<Panel>("preview");
  const [refreshKey, setRefreshKey] = useState(0);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const checks = useMemo(() => reviewHtml(html), [html]);
  const passedChecks = checks.filter((check) => check.status === "pass").length;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(html);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  function downloadCode() {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = "mini-atoms-app.html";
    link.click();
    URL.revokeObjectURL(href);
  }

  function refreshPreview() {
    setRefreshKey((key) => key + 1);
    setPanel("preview");
  }

  const lines = html ? html.split("\n").length : 0;

  return (
    <div className="flex h-full flex-col bg-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1" aria-label="Preview viewport">
          {(["desktop", "tablet", "mobile"] as Device[]).map((item) => (
            <button
              key={item}
              onClick={() => {
                setDevice(item);
                setPanel("preview");
              }}
              className={
                "rounded-md px-2.5 py-1 text-xs font-medium transition " +
                (device === item
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700")
              }
            >
              {DEVICE_LABELS[item]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={refreshPreview}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            title="Reload preview"
          >
            Refresh
          </button>
          <button
            onClick={() => setPanel("code")}
            className={
              "rounded-lg border px-2.5 py-1 text-xs font-medium " +
              (panel === "code"
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50")
            }
          >
            Code
          </button>
          <button
            onClick={() => setPanel("review")}
            className={
              "rounded-lg border px-2.5 py-1 text-xs font-medium " +
              (panel === "review"
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50")
            }
          >
            Review
          </button>
        </div>
      </div>

      <div className="scroll-thin flex-1 overflow-auto p-3">
        {panel === "code" ? (
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-700 px-3 py-2 text-xs text-slate-300">
              <span>{lines} lines · read-only</span>
              <div className="flex gap-2">
                <button onClick={copyCode} className="rounded bg-slate-700 px-2 py-1 hover:bg-slate-600">
                  {copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed" : "Copy"}
                </button>
                <button onClick={downloadCode} className="rounded bg-indigo-600 px-2 py-1 text-white hover:bg-indigo-500">
                  Download HTML
                </button>
              </div>
            </div>
            <pre className="scroll-thin min-h-0 flex-1 overflow-auto p-4 text-[12px] leading-relaxed text-slate-100">
              <code>{html}</code>
            </pre>
          </div>
        ) : panel === "review" ? (
          <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800">Local code review</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Static checks only — use the live preview to verify runtime behavior.
                </p>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                {passedChecks}/{checks.length} checks passed
              </span>
            </div>
            <ul className="mt-4 space-y-3">
              {checks.map((check) => (
                <li key={check.label} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-700">{check.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(check.status)}`}>
                      {statusLabel(check.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{check.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-2">
            <span className="text-xs font-medium text-slate-400">
              {DEVICE_LABELS[device]} viewport · {WIDTHS[device]}
            </span>
            <div
              className="h-full min-h-[340px] w-full overflow-hidden rounded-xl bg-white shadow-sm transition-all"
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
