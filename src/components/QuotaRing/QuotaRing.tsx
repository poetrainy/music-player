import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  size: number;
  totalUnits: number;
  usedUnits: number;
}

const STROKE_WIDTH = 3;

export function QuotaRing({ children, size, totalUnits, usedUnits }: Props) {
  const ratio = totalUnits > 0 ? Math.min(usedUnits / totalUnits, 1) : 0;
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ratio);
  const fillColorClassName =
    ratio >= 0.9
      ? "text-red-500"
      : ratio >= 0.7
        ? "text-amber-500"
        : "text-brand";

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`APIリクエスト使用量 ${Math.round(ratio * 100)}%`}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          className="stroke-current text-white/25"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={`stroke-current transition-[stroke-dashoffset] duration-500 ${fillColorClassName}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
