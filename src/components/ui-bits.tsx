export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-white/5 text-muted-foreground border-white/10",
    success: "bg-emerald/10 text-emerald border-emerald/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-destructive/15 text-red-400 border-destructive/30",
    info: "bg-primary/10 text-primary border-primary/20",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
      <div
        className="h-full bg-gradient-brand rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 80,
  strokeWidth = 6,
  showText = true,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="var(--color-emerald)" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold font-display">{clamped}%</span>
        </div>
      )}
    </div>
  );
}

export function StatTile({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 grid place-items-center">
          <Icon className="w-4.5 h-4.5 text-primary" />
        </div>
        {delta && (
          <span className="text-[11px] text-emerald font-medium">{delta}</span>
        )}
      </div>
      <div className="font-display text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

// Tiny deterministic QR-like grid for visual purposes (not a real QR encoder)
export function FakeQR({ value, size = 200 }: { value: string; size?: number }) {
  const n = 25;
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 131 + value.charCodeAt(i)) >>> 0;
  const cells: boolean[] = [];
  for (let i = 0; i < n * n; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    cells.push((h & 1) === 1);
  }
  // finder patterns
  const setBlock = (cx: number, cy: number) => {
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 7; x++) {
        const on =
          x === 0 || y === 0 || x === 6 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
        cells[(cy + y) * n + (cx + x)] = on;
      }
  };
  setBlock(0, 0);
  setBlock(n - 7, 0);
  setBlock(0, n - 7);
  const cell = size / n;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rounded-xl bg-white p-2"
    >
      {cells.map((on, i) =>
        on ? (
          <rect
            key={i}
            x={(i % n) * cell}
            y={Math.floor(i / n) * cell}
            width={cell}
            height={cell}
            fill="#0b1220"
          />
        ) : null,
      )}
    </svg>
  );
}


/** Shown above panels that render illustrative data instead of live platform data. */
export function SampleDataNotice({ children }: { children?: React.ReactNode }) {
  return (
    <div role="note" className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
      {children ?? "Sample data: the figures below are illustrative and are not live platform statistics."}
    </div>
  );
}
