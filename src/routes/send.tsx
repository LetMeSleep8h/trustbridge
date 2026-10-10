import { createFileRoute, useNavigate } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import { useApp } from "@/components/AppContext";
import { useState } from "react";
import { Send as SendIcon, ArrowRight, Wallet } from "lucide-react";

export const Route = createFileRoute("/send")({
  head: () => ({ meta: [{ title: "Send — TrustBridge" }] }),
  component: SendPage,
});

const assets = ["XLM", "USDC", "EURC", "BTC"];

function SendPage() {
  const { wallet, openWalletModal, t } = useApp();
  const nav = useNavigate();
  const [form, setForm] = useState({ to: "", amount: "", asset: "XLM", memo: "" });
  const [sent, setSent] = useState(false);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.connected) return openWalletModal();
    setSent(true);
    setTimeout(() => nav({ to: "/transactions" }), 1400);
  };

  const amount = Number(form.amount) || 0;
  const fee = 0.00001;

  return (
    <AppShell title={t("send")} subtitle={t("overview")}>
      <form onSubmit={send} className="glass rounded-2xl p-6 max-w-2xl">
        <div role="note" className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
  Preview mode: on-chain sending is not enabled yet. Nothing is signed or sent, and no funds move.
</div>
        <Field label={t("recipientAddress", "Recipient address")}>
          <input
            value={form.to}
            onChange={(e) => setForm({ ...form, to: e.target.value })}
            placeholder="G…"
            className="w-full h-11 px-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary outline-none text-sm font-mono"
            required
          />
        </Field>
        <div className="grid sm:grid-cols-[1fr,140px] gap-3 mt-4">
          <Field label={t("amount")}>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0.00"
              className="w-full h-11 px-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary outline-none text-sm"
              required
              min="0"
              step="0.0001"
            />
          </Field>
          <Field label={t("asset")}>
            <select
              value={form.asset}
              onChange={(e) => setForm({ ...form, asset: e.target.value })}
              className="w-full h-11 px-3 rounded-lg bg-white/5 border border-white/10 outline-none text-sm"
            >
              {assets.map((a) => <option key={a}>{a}</option>)}
            </select>
          </Field>
        </div>
        <Field label={t("memo", "Memo")} className="mt-4">
          <input
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
            placeholder="Donation, invoice ID, etc."
            className="w-full h-11 px-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary outline-none text-sm"
          />
        </Field>

        <div className="mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2 text-sm">
          <Row label={t("amount")} value={`${amount} ${form.asset}`} />
          <Row label={t("networkFee", "Network fee")} value={`${fee} XLM`} />
          <Row label={t("total")} value={`${amount} ${form.asset} + ${fee} XLM`} bold />
        </div>

        <button
          type="submit"
          disabled={sent}
          className="mt-6 w-full h-12 rounded-xl bg-gradient-brand text-primary-foreground font-medium inline-flex items-center justify-center gap-2 hover:shadow-glow transition disabled:opacity-60"
        >
          {sent ? "Running preview…" : wallet.connected ? (<>Preview send <ArrowRight className="w-4 h-4" /></>) : (<><Wallet className="w-4 h-4" /> {t("connectWallet")}</>)}
          {wallet.connected && !sent && <SendIcon className="w-4 h-4 hidden" />}
        </button>
      </form>
    </AppShell>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <div className="text-xs font-medium text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
