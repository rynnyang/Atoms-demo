"use client";

import { useState } from "react";

interface Props {
  onSend: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  buttonLabel?: string;
}

export default function PromptInput({
  onSend,
  disabled,
  placeholder = "Describe what you want to build…",
  buttonLabel = "Send",
}: Props) {
  const [value, setValue] = useState("");

  function submit() {
    const v = value.trim();
    if (!v || disabled) return;
    onSend(v);
    setValue("");
  }

  return (
    <div className="border-t border-slate-200 bg-white p-3">
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          disabled={disabled}
          rows={2}
          placeholder={placeholder}
          className="scroll-thin flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
        />
        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="h-10 shrink-0 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {buttonLabel}
        </button>
      </div>
      <p className="mt-1 px-1 text-[11px] text-slate-400">
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  );
}
