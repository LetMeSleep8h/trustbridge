import { useState, useEffect } from "react";
import { X, CheckCircle2, ArrowRight, Loader2, Heart } from "lucide-react";
import { useApp } from "../AppContext";

const presets = [10, 25, 50, 100, 250];

export default function DonateModal() {
  const { donateTarget, closeDonate, wallet, openWalletModal } = useApp();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState<number>(25);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    if (donateTarget) {
      setStep(1);
      setAmount(25);
      setCustom("");
    }
  }, [donateTarget]);

  if (!donateTarget) return null;

  const finalAmount = custom ? Number(custom) || 0 : amount;
  const fee = 0.00001;

  const confirm = () => {
    setStep(2);
    setTimeout(() => setStep(3), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeDonate}>
      <div className="glass-strong rounded-2xl w-full max-w-md shadow-elegant" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <div className="text-xs text-muted-foreground">Donate to</div>
            <div className="font-display font-semibold truncate">{donateTarget.title}</div>
          </div>
          <button onClick={closeDonate} className="w-8 h-8 grid place-items-center rounded-md hover:bg-white/5 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {step === 1 && (
            <>
              <div role="note" className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
  Preview mode: on-chain donations are not enabled yet. Nothing is signed or sent, and no funds move.
</div>

              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Select amount (XLM)
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {presets.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setAmount(p);
                      setCustom("");
                    }}
                    className={`h-11 rounded-lg border text-sm font-medium transition ${
                      !custom && amount === p
                        ? "bg-primary/15 border-primary text-primary"
                        : "border-white/10 hover:border-white/25"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Custom amount"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                className="w-full h-11 px-4 rounded-lg bg-white/5 border border-white/10 focus:border-primary outline-none text-sm"
              />
              <div className="mt-5 space-y-2 text-sm">
                <Row label="Amount" value={`${finalAmount} XLM`} />
                <Row label="Network fee" value={`${fee} XLM`} />
                <Row label="Total" value={`${(finalAmount + fee).toFixed(5)} XLM`} bold />
              </div>
              <button
                disabled={finalAmount <= 0}
                onClick={() => (wallet.connected ? confirm() : openWalletModal())}
                className="mt-6 w-full h-11 rounded-xl bg-gradient-brand text-primary-foreground font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-glow transition"
              >
                {wallet.connected ? "Preview donation" : "Connect wallet to preview"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
          {step === 2 && (
            <div className="py-10 text-center">
              <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin mb-4" />
              <div className="font-medium">Running preview…</div>
              <div className="text-xs text-muted-foreground mt-1">No transaction is being sent</div>
            </div>
          )}
          {step === 3 && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald/20 grid place-items-center mx-auto mb-4 animate-float">
                <CheckCircle2 className="w-9 h-9 text-emerald" />
              </div>
              <div className="font-display text-xl font-semibold">Preview complete</div>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                This was a preview of a {finalAmount} XLM donation to <span className="text-foreground">{donateTarget.title}</span>.
                No transaction was sent and no funds moved.
              </p>
              <div className="mt-6 flex gap-2">
                <button onClick={closeDonate} className="flex-1 h-10 rounded-lg glass hover:border-white/25 transition text-sm">
                  Close
                </button>
                <button onClick={closeDonate} className="flex-1 h-10 rounded-lg bg-gradient-brand text-primary-foreground inline-flex items-center justify-center gap-2 text-sm">
                  <Heart className="w-4 h-4" /> Share
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
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
