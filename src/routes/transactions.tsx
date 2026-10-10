import { createFileRoute } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Badge } from "@/components/ui-bits";
import {
  Search,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Heart,
  Loader2,
  Download,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/components/AppContext";
import * as api from "@/services/api";

export const Route = createFileRoute("/transactions")({
  head: () => ({ meta: [{ title: "Transactions — TrustBridge" }] }),
  component: Transactions,
});

type Tx = {
  id: number;
  hash: string;
  type: "donation" | "send" | "receive";
  amount: number;
  asset: string;
  status: "confirmed" | "pending" | "failed";
  created_at: string;
  memo?: string | null;
  campaign_title?: string | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const tabsKey = ["all", "donation", "sent", "received"] as const;
type Tab = (typeof tabsKey)[number];

const typeToParam: Record<Tab, string | undefined> = {
  all: undefined,
  donation: "donation",
  sent: "send",
  received: "receive",
};

function Transactions() {
  const { t } = useApp();
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    setExportError(null);
    try {
      const csv = await api.exportTransactionsCsv({ type: typeToParam[tab], q: q || undefined });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, tab]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.getMyTransactions({
      type: typeToParam[tab],
      q: q || undefined,
      page,
      limit: 10,
    })
      .then((res) => {
        if (cancelled) return;
        setTransactions(res.transactions || []);
        setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Failed to load transactions");
        setTransactions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, page, q]);

  const visibleCount = useMemo(() => transactions.length, [transactions]);

  const goToPage = (p: number) => {
    setPage(Math.min(Math.max(1, p), Math.max(1, pagination.totalPages)));
  };

  return (
    <RequireAuth>
      <AppShell title={t("transactions")} subtitle={t("overview")}>
        <div className="glass rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-3 md:items-center">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="h-10 px-4 rounded-lg border border-white/10 bg-white/5 text-xs font-medium inline-flex items-center justify-center gap-2 hover:bg-white/10 transition disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
          {exportError && <span role="alert" className="text-xs text-red-400">{exportError}</span>}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10 overflow-x-auto">
            {tabsKey.map((tKey) => (
              <button
                key={tKey}
                onClick={() => setTab(tKey)}
                className={`h-11 px-3 rounded-md text-xs font-medium whitespace-nowrap transition ${
                  tab === tKey
                    ? "bg-gradient-brand text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(tKey)}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary outline-none text-sm"
            />
          </div>
        </div>

        <div className="glass rounded-2xl overflow-hidden divide-y divide-white/5">
          {loading && (
            <div className="p-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> {t("loading")}
            </div>
          )}

          {!loading && error && (
            <div className="p-8 text-center text-sm text-red-400">{error}</div>
          )}

          {!loading && !error && transactions.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No transactions match your filters.
            </div>
          )}

          {!loading &&
            !error &&
            transactions.map((tx) => {
              const isOpen = open === tx.id;
              const incoming = tx.type === "receive";
              const Icon = tx.type === "donation" ? Heart : incoming ? ArrowDownLeft : ArrowUpRight;
              const label = tx.campaign_title || (tx.type === "donation" ? t("donation") : tx.type === "send" ? t("sent") : t("received"));
              const signed = incoming ? `+${tx.amount}` : `-${tx.amount}`;
              const shortHash = tx.hash.length > 12 ? `${tx.hash.slice(0, 6)}…${tx.hash.slice(-4)}` : tx.hash;
              return (
                <div key={tx.id}>
                  <button
                    onClick={() => setOpen(isOpen ? null : tx.id)}
                    className="w-full flex items-center gap-3 sm:gap-4 p-4 hover:bg-white/[0.02] transition text-left"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${
                        incoming ? "bg-emerald/10 text-emerald" : "bg-primary/10 text-primary"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium capitalize truncate">
                        {tx.type} · {label}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        {shortHash} · #{tx.id}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-sm font-mono ${incoming ? "text-emerald" : ""}`}>
                        {signed} {tx.asset}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{tx.created_at}</div>
                    </div>
                    <Badge
                      tone={tx.status === "confirmed" ? "success" : tx.status === "pending" ? "warning" : "danger"}
                    >
                      {tx.status === "confirmed"
                        ? t("statusConfirmed")
                        : tx.status === "pending"
                          ? t("statusPending")
                          : t("statusFailed")}
                    </Badge>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition shrink-0 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="bg-white/[0.02] px-4 pb-4 grid sm:grid-cols-2 gap-3 text-xs">
                      <Detail label="Transaction ID" value={`#${tx.id}`} />
                      <Detail label="Hash" value={tx.hash} mono />
                      <Detail label="Campaign" value={label} />
                      <Detail label="Memo" value={tx.memo ?? "—"} />
                      <a
                        href="#"
                        className="sm:col-span-2 inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        View on Stellar Expert <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Pagination controls */}
        {!loading && !error && pagination.totalPages > 0 && (
          <div className="glass rounded-2xl mt-6 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              {visibleCount > 0 && (
                <>
                  {t("page")} {pagination.page} {t("of")} {pagination.totalPages} ·{" "}
                  {pagination.total} {t("transactionsCount").toLowerCase()}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="h-9 px-3 rounded-lg glass text-xs font-medium inline-flex items-center gap-1 hover:border-white/25 transition disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" /> {t("previous")}
              </button>
              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="h-9 px-3 rounded-lg glass text-xs font-medium inline-flex items-center gap-1 hover:border-white/25 transition disabled:opacity-40 disabled:pointer-events-none"
              >
                {t("next")} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </AppShell>
    </RequireAuth>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="glass rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 truncate ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}