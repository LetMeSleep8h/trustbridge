import { createFileRoute } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Progress, StatTile, SampleDataNotice } from "@/components/ui-bits";
import { Heart, Megaphone, Users, ArrowLeftRight, Globe } from "lucide-react";
import { useState, useMemo } from "react";
import { useApp } from "@/components/AppContext";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — TrustBridge" }] }),
  component: Analytics,
});

const ranges = ["24h", "7d", "30d", "90d"] as const;

const categoryData = [
  { name: "Food & Water", pct: 38, color: "from-blue-500 to-emerald-400" },
  { name: "Disaster Relief", pct: 27, color: "from-rose-500 to-amber-400" },
  { name: "Medical", pct: 21, color: "from-emerald-500 to-cyan-400" },
  { name: "Education", pct: 14, color: "from-violet-500 to-blue-500" },
];

const topCampaigns = [
  { name: "Food Aid Gaza", org: "Hope Kitchen", raised: 312000, donors: 9201, pct: 89 },
  { name: "Earthquake Relief Türkiye", org: "Global Aid Network", raised: 198400, donors: 4820, pct: 79 },
  { name: "Clean Water Yemen", org: "Mercy Wells", raised: 84200, donors: 1284, pct: 70 },
  { name: "Vaccines DRC", org: "MedBridge", raised: 73400, donors: 1140, pct: 92 },
];

function makeSeries(seed: number, n: number) {
  let v = 40 + (seed % 30);
  return Array.from({ length: n }, () => {
    v += (Math.sin(v) + 1) * 8 - 6 + (Math.random() * 6 - 3);
    v = Math.max(10, Math.min(95, v));
    return Math.round(v);
  });
}

function Sparkline({ data, height = 120 }: { data: number[]; height?: number }) {
  const w = 100;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = height - ((d - min) / (max - min || 1)) * height;
      return `${x},${y}`;
    })
    .join(" ");
  const area = `0,${height} ${pts} ${w},${height}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.68 0.16 235)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="oklch(0.68 0.16 235)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#g)" />
      <polyline points={pts} fill="none" stroke="oklch(0.74 0.16 165)" strokeWidth="1.2" />
    </svg>
  );
}

function Analytics() {
  const { t } = useApp();
  const [range, setRange] = useState<(typeof ranges)[number]>("7d");
  const n = range === "24h" ? 24 : range === "7d" ? 14 : range === "30d" ? 30 : 60;
  const series = useMemo(() => makeSeries(n * 3, n), [n]);

  return (
    <RequireAuth>
      <AppShell
        title={t("analytics")}
        subtitle={t("overview")}
        actions={
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`h-11 px-3 rounded-md text-xs font-medium transition ${
                range === r ? "bg-gradient-brand text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      }
    >
      <SampleDataNotice />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label={t("totalRaised")} value="$12.4M" delta="+8.2%" icon={Heart} />
        <StatTile label={t("campaigns")} value="342" delta="+14" icon={Megaphone} />
        <StatTile label={t("beneficiaries")} value="89,240" delta="+3.4%" icon={Users} />
        <StatTile label={t("transactionsCount")} value="1.28M" delta="+11.7%" icon={ArrowLeftRight} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-display font-semibold">Donation activity</div>
              <div className="text-xs text-muted-foreground">XLM volume across {range}</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-semibold">$184,920</div>
              <div className="text-xs text-emerald">+12.4% vs prev</div>
            </div>
          </div>
          <div className="h-48"><Sparkline data={series} height={180} /></div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="font-display font-semibold mb-4">Top categories</div>
          <div className="space-y-4">
            {categoryData.map((c) => (
              <div key={c.name}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span>{c.name}</span>
                  <span className="text-muted-foreground">{c.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${c.color} rounded-full`} style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden mb-6">
        <div className="p-5 border-b border-white/5 font-display font-semibold">
          Top performing campaigns
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-5 py-3">Campaign</th>
              <th className="text-left font-medium px-5 py-3 hidden sm:table-cell">Organization</th>
              <th className="text-right font-medium px-5 py-3">Raised</th>
              <th className="text-right font-medium px-5 py-3 hidden md:table-cell">Donors</th>
              <th className="text-left font-medium px-5 py-3 w-40">Funded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {topCampaigns.map((c) => (
              <tr key={c.name} className="hover:bg-white/[0.02]">
                <td className="px-5 py-3 font-medium">{c.name}</td>
                <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">{c.org}</td>
                <td className="px-5 py-3 text-right font-mono">${c.raised.toLocaleString()}</td>
                <td className="px-5 py-3 text-right hidden md:table-cell">{c.donors.toLocaleString()}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Progress value={c.pct} />
                    <span className="text-xs text-primary font-medium w-9 text-right">{c.pct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-brand grid place-items-center shadow-glow shrink-0">
          <Globe className="w-8 h-8 text-primary-foreground" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="font-display text-xl font-semibold">Global impact</div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Donations reaching <b className="text-foreground">182 countries</b>, with
            <b className="text-foreground"> 4.2s</b> average settlement and
            <b className="text-foreground"> 99.97%</b> of funds delivered to beneficiaries on-chain.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[["182", "Countries"], ["4.2s", "Settlement"], ["99.97%", "Delivered"]].map(([v, l]) => (
            <div key={l}>
              <div className="font-display text-xl font-semibold">{v}</div>
              <div className="text-[11px] text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </div>
      </AppShell>
    </RequireAuth>
  );
}
