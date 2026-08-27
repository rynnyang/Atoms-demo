"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AppVersion,
  ChatMessage,
  GenerationStatus,
  Project,
} from "@/lib/types";
import {
  deleteProject,
  loadProjects,
  newId,
  upsertProject,
} from "@/lib/store";
import ProjectSidebar from "@/components/ProjectSidebar";
import AgentChat from "@/components/AgentChat";
import AppPreview from "@/components/AppPreview";
import VersionHistory from "@/components/VersionHistory";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

type MobileTab = "projects" | "chat" | "preview";
type AgentMode = "local" | "qwen" | null;

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Keep the latest request visible before the API succeeds. A failed first
  // generation has no Project yet, so it cannot live in project.messages.
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [agentMode, setAgentMode] = useState<AgentMode>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [previewOverride, setPreviewOverride] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");

  const retryRef = useRef<(() => void) | null>(null);

  const active = useMemo(
    () => projects.find((p) => p.id === activeId) ?? null,
    [projects, activeId]
  );

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  const persist = useCallback((p: Project) => {
    setProjects(upsertProject(p));
  }, []);

  const handleNew = useCallback(() => {
    setActiveId(null);
    setStatus("idle");
    setError(null);
    setPendingMessage(null);
    setPreviewOverride(null);
    setShowVersions(false);
    setMobileTab("chat");
    setAgentMode(null);
  }, []);

  const handleOpen = useCallback((id: string) => {
    setActiveId(id);
    setStatus("ready");
    setError(null);
    setPendingMessage(null);
    setPreviewOverride(null);
    setShowVersions(false);
    setMobileTab("preview");
    setAgentMode(null);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      if (!confirm("Delete this project? This cannot be undone.")) return;
      setProjects(deleteProject(id));
      if (activeId === id) handleNew();
    },
    [activeId, handleNew]
  );

  const runGenerate = useCallback(
    async (prompt: string) => {
      setError(null);
      setPendingMessage(prompt);
      setIsWorking(true);
      setStatus("understanding");
      await delay(450);
      setStatus("planning");
      await delay(550);
      setStatus("building");

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Generation failed.");

        const now = Date.now();
        const userMsg: ChatMessage = {
          id: newId(),
          role: "user",
          content: prompt,
          createdAt: now,
        };
        const assistantMsg: ChatMessage = {
          id: newId(),
          role: "assistant",
          content: data.summary,
          createdAt: now + 1,
        };
        const version: AppVersion = {
          id: newId(),
          versionNumber: 1,
          prompt: null,
          code: data.html,
          summary: data.summary,
          createdAt: now,
        };
        const project: Project = {
          id: newId(),
          name: data.name || "Untitled App",
          initialPrompt: prompt,
          currentCode: data.html,
          currentSummary: data.summary,
          messages: [userMsg, assistantMsg],
          versions: [version],
          createdAt: now,
          updatedAt: now,
        };

        persist(project);
        setActiveId(project.id);
        setPendingMessage(null);
        setAgentMode(data.demo ? "local" : "qwen");
        setStatus("ready");
        setMobileTab("preview");
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Generation failed.");
        retryRef.current = () => runGenerate(prompt);
      } finally {
        setIsWorking(false);
      }
    },
    [persist]
  );

  const runModify = useCallback(
    async (prompt: string) => {
      if (!active) return;
      setError(null);
      setPendingMessage(prompt);
      setIsWorking(true);
      setStatus("building");

      try {
        const res = await fetch("/api/modify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            currentHtml: active.currentCode,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Modification failed.");

        const now = Date.now();
        const nextVersion = active.versions.length + 1;
        const version: AppVersion = {
          id: newId(),
          versionNumber: nextVersion,
          prompt,
          code: data.html,
          summary: data.summary,
          createdAt: now,
        };
        const updated: Project = {
          ...active,
          currentCode: data.html,
          currentSummary: data.summary,
          messages: [
            ...active.messages,
            { id: newId(), role: "user", content: prompt, createdAt: now },
            {
              id: newId(),
              role: "assistant",
              content: data.summary,
              createdAt: now + 1,
            },
          ],
          versions: [...active.versions, version],
          updatedAt: now,
        };

        persist(updated);
        setPendingMessage(null);
        setPreviewOverride(null);
        setAgentMode(data.demo ? "local" : "qwen");
        setStatus("ready");
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Modification failed.");
        retryRef.current = () => runModify(prompt);
      } finally {
        setIsWorking(false);
      }
    },
    [active, persist]
  );

  const handleSend = useCallback(
    (value: string) => {
      if (active) runModify(value);
      else runGenerate(value);
    },
    [active, runGenerate, runModify]
  );

  const handleRetry = useCallback(() => {
    retryRef.current?.();
  }, []);

  const handlePreviewVersion = useCallback((code: string) => {
    setPreviewOverride(code);
    setShowVersions(false);
    setMobileTab("preview");
  }, []);

  const handleRestoreVersion = useCallback(
    (v: AppVersion) => {
      if (!active) return;
      const now = Date.now();
      const nextVersion = active.versions.length + 1;
      const restored: AppVersion = {
        id: newId(),
        versionNumber: nextVersion,
        prompt: `Restored from V${v.versionNumber}`,
        code: v.code,
        summary: `Restored from V${v.versionNumber}`,
        createdAt: now,
      };
      const updated: Project = {
        ...active,
        currentCode: v.code,
        currentSummary: restored.summary,
        versions: [...active.versions, restored],
        updatedAt: now,
      };
      persist(updated);
      setPreviewOverride(null);
      setShowVersions(false);
    },
    [active, persist]
  );

  const previewHtml = previewOverride ?? active?.currentCode ?? "";

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span className="text-base">⚛️</span>
          <span className="hidden sm:inline">Mini Atoms</span>
          <span className="hidden text-slate-400 sm:inline">· AI App Builder</span>
        </div>
        <div className="flex items-center gap-2">
          {agentMode && (
            <span
              className={
                "rounded-full px-2.5 py-1 text-[11px] font-semibold " +
                (agentMode === "local"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700")
              }
            >
              {agentMode === "local"
                ? "Local Agent · no API calls"
                : "Qwen LLM Agent"}
            </span>
          )}
          {active && (
            <button
              onClick={() => setShowVersions(true)}
              className="hidden rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 md:inline-block"
            >
              Version History
            </button>
          )}
          {/* Mobile tab switcher */}
          <div className="flex gap-1 md:hidden">
            {(["projects", "chat", "preview"] as MobileTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setMobileTab(t)}
                className={
                  "rounded-md px-2.5 py-1 text-xs font-medium capitalize " +
                  (mobileTab === t
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-500")
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={
            (mobileTab === "projects" ? "flex" : "hidden") +
            " md:flex w-64 shrink-0"
          }
        >
          <ProjectSidebar
            projects={projects}
            activeId={activeId}
            onOpen={handleOpen}
            onNew={handleNew}
            onDelete={handleDelete}
          />
        </div>

        {/* Chat */}
        <div
          className={
            (mobileTab === "chat" ? "flex" : "hidden") +
            " md:flex w-full flex-col border-r border-slate-200 md:w-[40%] md:max-w-[460px]"
          }
        >
          <AgentChat
            messages={active?.messages ?? []}
            pendingMessage={pendingMessage}
            status={status}
            error={error}
            isWorking={isWorking}
            onSend={handleSend}
            onRetry={handleRetry}
            placeholder={
              active
                ? "Ask the agent to change the app…"
                : "Describe what you want to build…"
            }
            buttonLabel={active ? "Update" : "Build"}
          />
        </div>

        {/* Preview */}
        <div
          className={
            (mobileTab === "preview" ? "flex" : "hidden") +
            " md:flex flex-1 flex-col"
          }
        >
          {!active ? (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-400">
              Your live app preview will appear here once you build something.
            </div>
          ) : showVersions ? (
            <VersionHistory
              versions={active.versions}
              onPreview={handlePreviewVersion}
              onRestore={handleRestoreVersion}
              onClose={() => setShowVersions(false)}
            />
          ) : (
            <>
              {previewOverride !== null && (
                <div className="flex items-center justify-between bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
                  <span>Viewing an older version</span>
                  <button
                    onClick={() => setPreviewOverride(null)}
                    className="font-semibold underline"
                  >
                    Back to latest
                  </button>
                </div>
              )}
              <div className="min-h-0 flex-1">
                <AppPreview html={previewHtml} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
