export type GenerationStatus =
  | "idle"
  | "understanding"
  | "planning"
  | "building"
  | "ready"
  | "error";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
}

export interface AppVersion {
  id: string;
  versionNumber: number;
  prompt: string | null;
  code: string;
  summary: string;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  initialPrompt: string;
  currentCode: string;
  currentSummary: string;
  messages: ChatMessage[];
  versions: AppVersion[];
  createdAt: number;
  updatedAt: number;
}

export interface GenerateResponse {
  name: string;
  summary: string;
  html: string;
  demo: boolean;
  error?: string;
}

export interface ModifyResponse {
  summary: string;
  html: string;
  demo: boolean;
  error?: string;
}
