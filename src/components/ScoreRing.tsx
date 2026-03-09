"use client";

interface ScoreRingProps {
  score: number;
  maxScore: number;
  size?: "sm" | "md" | "lg";
}

export function ScoreRing({ score, maxScore, size = "md" }: ScoreRingProps) {
  const percentage = Math.round((score / maxScore) * 100);

  const sizeClasses = {
    sm: { container: "w-16 h-16", text: "text-lg", label: "text-[8px]" },
    md: { container: "w-24 h-24", text: "text-2xl", label: "text-[10px]" },
    lg: { container: "w-36 h-36", text: "text-4xl", label: "text-xs" },
  };

  const strokeWidth = size === "lg" ? 8 : size === "md" ? 6 : 4;
  const radius = size === "lg" ? 60 : size === "md" ? 42 : 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 80) return "#10b981"; // green
    if (percentage >= 60) return "#f59e0b"; // amber
    if (percentage >= 40) return "#f97316"; // orange
    return "#ef4444"; // red
  };

  return (
    <div className={`relative ${sizeClasses[size].container}`}>
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          fill="none"
          stroke="#1f2937"
          strokeWidth={strokeWidth}
        />
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold ${sizeClasses[size].text}`} style={{ color: getColor() }}>
          {percentage}
        </span>
        <span className={`text-zinc-500 uppercase tracking-wider ${sizeClasses[size].label}`}>
          Score
        </span>
      </div>
    </div>
  );
}
