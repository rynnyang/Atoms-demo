// Client-side persistence layer (localStorage).
// V1 default: zero-setup browser storage. Projects survive page reload and can
// be reopened. See README for the optional Supabase upgrade path.

import type { Project } from "./types";

const KEY = "mini-atoms:projects";

export function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Project[]) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(projects));
  } catch {
    // ignore quota / private-mode errors
  }
}

export function upsertProject(project: Project): Project[] {
  const all = loadProjects();
  const idx = all.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    all[idx] = project;
  } else {
    all.unshift(project);
  }
  saveProjects(all);
  return all;
}

export function getProject(id: string): Project | null {
  return loadProjects().find((p) => p.id === id) || null;
}

export function deleteProject(id: string): Project[] {
  const all = loadProjects().filter((p) => p.id !== id);
  saveProjects(all);
  return all;
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "p_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
