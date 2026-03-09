"use client";

import { useState } from "react";
import { AnalysisResult } from "@/lib/types";
import { ScoreRing } from "./ScoreRing";
import { CategoryCard } from "./CategoryCard";

export function Analyzer() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateRecommendationsText = () => {
    if (!result) return "";

    const lines: string[] = [
      `# GEO Recommendations for ${result.url}`,
      `Generated: ${new Date(result.analyzedAt).toLocaleString()}`,
      `Score: ${result.overallScore}/${result.maxScore}`,
      "",
      "## Issues to Fix",
      "",
    ];

    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

    for (const category of result.categories) {
      const issueChecks = category.checks.filter(
        (c) => c.status !== "pass" && c.recommendation
      );

      if (issueChecks.length === 0) continue;

      // Sort by priority
      issueChecks.sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      );

      lines.push(`### ${category.category}`);
      lines.push("");

      for (const check of issueChecks) {
        const statusLabel =
          check.status === "fail"
            ? "❌ FAILED"
            : check.status === "warning"
              ? "⚠️ WARNING"
              : "❓ NOT FOUND";
        lines.push(
          `- **${check.name}** [${check.priority.toUpperCase()}] ${statusLabel}`
        );
        lines.push(`  ${check.recommendation}`);
        if (check.details) {
          lines.push(`  Details: ${check.details}`);
        }
        lines.push("");
      }
    }

    return lines.join("\n");
  };

  const handleCopyRecommendations = async () => {
    const text = generateRecommendationsText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze URL");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">GEO Analyzer</h1>
              <p className="text-sm text-zinc-500">Generative Engine Optimization Checker</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search form */}
        <form onSubmit={handleAnalyze} className="mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL to analyze (e.g., manano.ai)"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Analyze
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error state */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-8">
            {/* Summary header */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ScoreRing score={result.overallScore} maxScore={result.maxScore} size="lg" />
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold mb-1">GEO Analysis Complete</h2>
                  <p className="text-zinc-400 mb-4">{result.url}</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-sm">
                        <span className="font-semibold text-white">{result.summary.passed}</span>{" "}
                        <span className="text-zinc-400">Passed</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-sm">
                        <span className="font-semibold text-white">{result.summary.warnings}</span>{" "}
                        <span className="text-zinc-400">Warnings</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm">
                        <span className="font-semibold text-white">{result.summary.failed}</span>{" "}
                        <span className="text-zinc-400">Failed</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-zinc-500" />
                      <span className="text-sm">
                        <span className="font-semibold text-white">{result.summary.notFound}</span>{" "}
                        <span className="text-zinc-400">Not Found</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="text-center">
                    <div className="text-sm text-zinc-500">Analyzed</div>
                    <div className="text-sm text-zinc-400">
                      {new Date(result.analyzedAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={handleCopyRecommendations}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-emerald-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy All Recommendations
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Category cards */}
            <div className="space-y-4">
              {result.categories.map((category) => (
                <CategoryCard key={category.category} category={category} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !isLoading && !error && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Analyze your site for GEO</h2>
            <p className="text-zinc-500 max-w-md mx-auto mb-8">
              Enter a URL above to check how well optimized your site is for AI crawlers and generative engines like ChatGPT, Claude, and Perplexity.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
              {[
                { title: "AI Discovery Files", desc: "llms.txt, context APIs" },
                { title: "Crawler Permissions", desc: "robots.txt for AI bots" },
                { title: "Structured Data", desc: "JSON-LD Schema.org" },
                { title: "Meta & Content", desc: "Titles, descriptions, headings" },
                { title: "Technical SEO", desc: "HTTPS, sitemap, mobile" },
                { title: "Content Quality", desc: "Facts, definitions, sources" },
              ].map((item) => (
                <div key={item.title} className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                  <h3 className="font-medium text-sm text-white">{item.title}</h3>
                  <p className="text-xs text-zinc-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-zinc-500">
          GEO Analyzer by Manano
        </div>
      </footer>
    </div>
  );
}
