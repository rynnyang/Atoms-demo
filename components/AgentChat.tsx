"use client";

import type { ChatMessage, GenerationStatus } from "@/lib/types";
import AgentStatus from "./AgentStatus";
import PromptInput from "./PromptInput";

interface Props {
  messages: ChatMessage[];
  status: GenerationStatus;
  error: string | null;
  pendingMessage?: string | null;
  isWorking: boolean;
  onSend: (value: string) => void;
  onRetry: () => void;
  placeholder?: string;
  buttonLabel?: string;
}

const EXAMPLES = [
  "Build a pomodoro timer with a task list",
  "Build an expense tracker where I can add expenses, choose categories, see the total and delete entries. Persist locally.",
  "Build a clean landing page for a coffee shop",
];

export default function AgentChat({
  messages,
  status,
  error,
  pendingMessage,
  isWorking,
  onSend,
  onRetry,
  placeholder,
  buttonLabel,
}: Props) {
  const pendingId = "pending-message";
  const displayMessages = pendingMessage
    ? [
        ...messages,
        {
          id: pendingId,
          role: "user" as const,
          content: pendingMessage,
          createdAt: 0,
        },
      ]
    : messages;
  const empty = displayMessages.length === 0;

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="scroll-thin flex-1 overflow-y-auto px-4 py-4">
        {empty ? (
          <div className="mx-auto mt-10 max-w-md text-center">
            <div className="mb-3 text-3xl">⚛️</div>
            <h2 className="text-xl font-bold text-slate-800">
              What do you want to build?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Describe a small interactive web app. Your assistant will generate
              it, run it live, and let you refine it by chatting.
            </p>
            <div className="mt-5 space-y-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => onSend(ex)}
                  disabled={isWorking}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {displayMessages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-indigo-600 px-3.5 py-2 text-sm text-white">
                    {m.content}
                    {m.id === pendingId && (
                      <div className="mt-1 text-[10px] font-medium text-indigo-100">
                        {isWorking ? "Sending…" : "Request failed — retry when ready"}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-slate-100 px-3.5 py-2 text-sm text-slate-700">
                    <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-500">
                      Agent
                    </div>
                    {m.content}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 px-4 pb-2 pt-3">
        <AgentStatus status={status} />
        {error && (
          <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <span className="min-w-0 break-words">{error}</span>
            <button
              onClick={onRetry}
              className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <PromptInput
        onSend={onSend}
        disabled={isWorking}
        placeholder={placeholder}
        buttonLabel={buttonLabel ?? "Send"}
      />
    </div>
  );
}
