"use client";

import { useState } from "react";
import { CategoryResult } from "@/lib/types";
import { ScoreRing } from "./ScoreRing";
import { CheckResultCard } from "./CheckResult";

interface CategoryCardProps {
  category: CategoryResult;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const passedCount = category.checks.filter((c) => c.status === "pass").length;
  const failedCount = category.checks.filter((c) => c.status === "fail").length;
  const warningCount = category.checks.filter((c) => c.status === "warning").length;

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <ScoreRing score={category.score} maxScore={category.maxScore} size="sm" />
          <div className="text-left">
            <h3 className="text-lg font-semibold text-white">{category.category}</h3>
            <p className="text-sm text-zinc-400">{category.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            {passedCount > 0 && (
              <span className="flex items-center gap-1 text-emerald-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {passedCount}
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 text-amber-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                </svg>
                {warningCount}
              </span>
            )}
            {failedCount > 0 && (
              <span className="flex items-center gap-1 text-red-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {failedCount}
              </span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-zinc-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isExpanded && (
        <div className="px-5 pb-5 space-y-3">
          {category.checks.map((check) => (
            <CheckResultCard key={check.id} check={check} />
          ))}
        </div>
      )}
    </div>
  );
}
