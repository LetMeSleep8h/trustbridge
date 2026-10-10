import { createFileRoute, Link } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import { StatTile, Badge, SampleDataNotice } from "@/components/ui-bits";
import { useApp } from "@/components/AppContext";
import { RequireAuth } from "@/components/RequireAuth";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import {
  Wallet,
  Heart,
  Megaphone,
  Users,
  ArrowLeftRight,
  Send,
  Download,
  PlusCircle,
  Copy,
  ExternalLink,
  Network as NetIcon,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getBalanceHistory } from "@/services/api";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TrustBridge" }] }),
  component: Dashboard,
});

const txs = [
  { id: "tx_01", type: "Donation received", campaign: "Clean Water Yemen", amount: "+125 XLM", status: "confirmed", time: "2 min ago" },
  { id: "tx_02", type: "Sent", campaign: "Direct transfer", amount: "-50 XLM", status: "confirmed", time: "1 h ago" },
  { id: "tx_03", type: "Donation received", campaign: "Earthquake Relief Türkiye", amount: "+300 XLM", status: "pending", time: "3 h ago" },
  { id: "tx_04", type: "Disbursement", campaign: "School Books Kenya", amount: "-1,200 XLM", status: "confirmed", time: "yesterday" },
  { id: "tx_05", type: "Donation received", campaign: "Medical Aid Sudan", amount: "+75 XLM", status: "failed", time: "yesterday" },
];

function Dashboard() {
  const { wallet, openWalletModal, t } = useApp();
  const [copied, setCopied] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>("");
  const [balanceHistory, setBalanceHistory] = useState<any[]>([]);
  const address = wallet.address ?? "GA…CONNECT_WALLET_TO_VIEW";

  useEffect(() => {
    if (!wallet.address) {
      setQrSvg("");
      return;
    }
    QRCode.toString(`stellar:${wallet.address}?amount=`, { type: "svg", margin: 1, width: 300 })
      .then(setQrSvg)
      .catch(() => setQrSvg(""));
  }, [wallet.address]);
  const copy = () => {
    navigator.clipboard?.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Fetch balance history
  useEffect(() => {
    if (!wallet.address) {
      setBalanceHistory([]);
      return;
    }
    getBalanceHistory(wallet.address, 30)
      .then((data) => {
        if (data.history && data.history.length > 0) {
          setBalanceHistory(data.history);
        } else {
          setBalanceHistory([]);
        }
      })
      .catch(() => setBalanceHistory([]));
  }, [wallet.address]);

  return (
    <RequireAuth>
      <AppShell
        title="Dashboard"
        subtitle="Overview of your wallet, campaigns and recent on-chain activity."
        actions={
          <>
            <span className="inline-flex items-center gap-2 px-3 h-9 rounded-lg glass text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald shadow-glow" /> {t("stellarMainnet")}
            </span>
            <Link to="/create-campaign" className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-gradient-brand text-primary-foreground text-sm font-medium hover:shadow-glow transition">
              <PlusCircle className="w-4 h-4" /> {t("createCampaign")}
            </Link>
          </>
        }
      >
        <SampleDataNotice>Sample data: the recent activity list below is illustrative. Your real transactions are on the Transactions page.</SampleDataNotice>
        <div className="grid lg:grid-cols-3 gap-6">
        {/* Wallet panel - spans 2 cols */}
        <div className="lg:col-span-2 glass rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("walletBalance")}</div>
              <div className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
                {wallet.connected ? "12,480.25" : "—"} <span className="text-base text-muted-foreground font-normal">XLM</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                ≈ ${wallet.connected ? "1,485.32" : "0.00"} USD
              </div>
            </div>
            {!wallet.connected ? (
              <button onClick={openWalletModal} className="h-11 px-4 rounded-lg bg-gradient-brand text-primary-foreground text-sm font-medium inline-flex items-center gap-2 hover:shadow-glow transition self-start">
                <Wallet className="w-4 h-4" /> {t("connect")}
              </button>
            ) : (
              <Badge tone="success">{t("connected")} · {wallet.provider}</Badge>
            )}
          </div>

          {/* Address bar */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/5 text-xs font-mono">
            <span className="truncate flex-1">{address}</span>
            <button onClick={copy} className="px-2 py-1 rounded hover:bg-white/10 inline-flex items-center gap-1">
              <Copy className="w-3 h-3" /> {copied ? t("copied") : t("copy")}
            </button>
            <a href="#" className="px-2 py-1 rounded hover:bg-white/10 inline-flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> {t("explorer")}
            </a>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            <Link to="/send" className="h-12 rounded-xl bg-gradient-brand text-primary-foreground font-medium inline-flex items-center justify-center gap-2 hover:shadow-glow transition">
              <Send className="w-4 h-4" /> {t("send")}
            </Link>
            <Link to="/receive" className="h-12 rounded-xl glass hover:border-white/25 font-medium inline-flex items-center justify-center gap-2 transition">
              <Download className="w-4 h-4" /> {t("receive")}
            </Link>
            <Link to="/create-campaign" className="h-12 rounded-xl glass hover:border-white/25 font-medium inline-flex items-center justify-center gap-2 transition">
              <PlusCircle className="w-4 h-4" /> {t("campaign")}
            </Link>
          </div>
        </div>

        {/* Network status panel */}
        <div className="glass rounded-2xl p-4 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("network")}</div>
            <Badge tone="success">{t("operational")}</Badge>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald/10 grid place-items-center">
              <NetIcon className="w-5 h-5 text-emerald" />
            </div>
            <div>
              <div className="font-medium">{t("stellarMainnet")}</div>
              <div className="text-xs text-muted-foreground">{t("ledger")} 52,148,920</div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <Row label={t("avgConfirmation")} value={t("confirmationTime")} />
            <Row label={t("avgFee")} value={t("fee")} />
            <Row label={t("validators")} value={`178 ${t("online")}`} />
          </div>
          {/* QR Code - properly contained, no overlap */}
          <div className="mt-auto pt-4 flex flex-col items-center">
            {qrSvg ? (
              <div className="rounded-xl bg-white p-2 shadow-lg" style={{ width: 140, height: 140 }}>
                <div style={{ width: 124, height: 124 }} dangerouslySetInnerHTML={{ __html: qrSvg }} />
              </div>
            ) : (
              <div className="w-[140px] h-[140px] rounded-xl bg-white/5 flex items-center justify-center">
                <span className="text-[11px] text-muted-foreground">{t("connect")}</span>
              </div>
            )}
            <div className="text-center text-[11px] text-muted-foreground mt-2">
              {wallet.connected ? t("scanToSend") : t("connect")}
            </div>
          </div>
        </div>
      </div>

      {/* Balance history chart */}
      <div className="glass rounded-2xl p-4 sm:p-6 mt-6">
        <div className="font-display font-semibold mb-4">Balance History (30 days)</div>
        {balanceHistory.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  stroke="rgba(255,255,255,0.1)"
                  tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  stroke="rgba(255,255,255,0.1)"
                  tickFormatter={(value) => `${value.toLocaleString()} XLM`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(15, 15, 25, 0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "currentColor"
                  }}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  formatter={(value: number) => [`${value.toLocaleString()} XLM`, "Balance"]}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="currentColor" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "currentColor" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            {wallet.connected ? "Not enough transaction history yet to display a chart." : "Connect your wallet to view balance history."}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <StatTile label={t("totalRaised")} value="$48,290" delta="+12.4%" icon={Heart} />
        <StatTile label={t("activeCampaigns")} value="7" delta="+2" icon={Megaphone} />
        <StatTile label={t("beneficiaries")} value="1,284" delta="+38" icon={Users} />
        <StatTile label={t("transactionsCount")} value="9,420" delta="+5.1%" icon={ArrowLeftRight} />
      </div>

      {/* Recent activity */}
      <div className="glass rounded-2xl mt-6 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <div className="font-display font-semibold">{t("recentActivity")}</div>
            <div className="text-xs text-muted-foreground">{t("latestOnChain")}</div>
          </div>
          <Link to="/transactions" className="text-xs text-primary hover:underline">{t("viewAll")} →</Link>
        </div>
        <div className="divide-y divide-white/5">
          {txs.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 sm:gap-4 p-4 hover:bg-white/[0.02] transition">
              <div className="w-9 h-9 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                <ArrowLeftRight className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {tx.type === "Donation received" && t("donationReceived")}
                  {tx.type === "Sent" && t("sent")}
                  {tx.type === "Disbursement" && t("disbursement")}
                </div>
                <div className="text-xs text-muted-foreground truncate">{tx.campaign}</div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-sm font-mono ${tx.amount.startsWith("+") ? "text-emerald" : "text-foreground"}`}>
                  {tx.amount}
                </div>
                <div className="text-[11px] text-muted-foreground">{tx.time}</div>
              </div>
              <Badge
                tone={tx.status === "confirmed" ? "success" : tx.status === "pending" ? "warning" : "danger"}
              >
                {tx.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
      </AppShell>
    </RequireAuth>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}