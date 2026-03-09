"use client";

import { CheckResult as CheckResultType } from "@/lib/types";

interface CheckResultProps {
  check: CheckResultType;
}

const statusConfig = {
  pass: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: "text-emerald-500",
    iconPath: "M5 13l4 4L19 7",
  },
  fail: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: "text-red-500",
    iconPath: "M6 18L18 6M6 6l12 12",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: "text-amber-500",
    iconPath: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  },
  not_found: {
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/20",
    icon: "text-zinc-500",
    iconPath: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
};

const priorityConfig = {
  critical: { bg: "bg-red-500", text: "Critical" },
  high: { bg: "bg-orange-500", text: "High" },
  medium: { bg: "bg-blue-500", text: "Medium" },
  low: { bg: "bg-zinc-500", text: "Low" },
};

export function CheckResultCard({ check }: CheckResultProps) {
  const status = statusConfig[check.status];
  const priority = priorityConfig[check.priority];

  return (
    <div
      className={`rounded-lg border p-4 ${status.bg} ${status.border} transition-all hover:scale-[1.01]`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${status.icon}`}>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={status.iconPath} />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-white">{check.name}</h4>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium text-white ${priority.bg}`}
            >
              {priority.text}
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">{check.description}</p>
          {check.details && (
            <p className="text-sm text-zinc-300 mt-2 font-mono bg-zinc-800/50 rounded px-2 py-1">
              {check.details}
            </p>
          )}
          {check.recommendation && check.status !== "pass" && (
            <div className="mt-3 text-sm text-zinc-300 bg-zinc-800/30 rounded p-2 border-l-2 border-amber-500">
              <span className="font-medium text-amber-400">Recommendation:</span>{" "}
              {check.recommendation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
