import { createFileRoute } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { useRef, useState } from "react";
import { CheckCircle2, Upload, Sparkles } from "lucide-react";
import * as api from "@/services/api";

export const Route = createFileRoute("/create-campaign")({
  head: () => ({ meta: [{ title: "Create Campaign — TrustBridge" }] }),
  component: CreateCampaign,
});

const cats = ["Food & Water", "Disaster Relief", "Medical", "Education", "Shelter", "Other"];

function CreateCampaign() {
  const [form, setForm] = useState<{
    title: string;
    org: string;
    desc: string;
    goal: string;
    cat: string;
    location: string;
    end: string;
    image: File | string;
  }>({
    title: "",
    org: "",
    desc: "",
    goal: "",
    cat: "Food & Water",
    location: "",
    end: "",
    image: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // A ref updates synchronously, so two clicks in the same tick cannot both start a request.
  const inFlight = useRef(false);

  const update = (k: keyof typeof form, v: string | File) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inFlight.current) return; // ignore rapid repeat clicks while a request is in flight
    const errs: Record<string, string> = {};
    if (form.title.trim().length < 6) errs.title = "At least 6 characters.";
    if (form.org.trim().length < 2) errs.org = "Required.";
    if (form.desc.trim().length < 30) errs.desc = "Describe in at least 30 characters.";
    const g = Number(form.goal);
    if (!g || g < 100) errs.goal = "Minimum 100 XLM.";
    if (!form.location.trim()) errs.location = "Required.";
    if (!form.end) errs.end = "Pick an end date.";
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      inFlight.current = true;
      setSubmitting(true);
      setSubmitError(null);
      try {
        const fd = new FormData();
        fd.append("title", form.title);
        fd.append("description", form.desc);
        fd.append("organization", form.org);
        fd.append("category", form.cat);
        fd.append("goal", String(form.goal));
        fd.append("endDate", form.end);
        fd.append("urgent", "false");
        if (form.image instanceof File) fd.append("image", form.image);
        await api.createCampaign(fd);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
        setForm({ title: "", org: "", desc: "", goal: "", cat: "Food & Water", location: "", end: "", image: "" });
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "Failed to create campaign");
      } finally {
        inFlight.current = false;
        setSubmitting(false);
      }
    }
  };

  return (
    <RequireAuth>
      <AppShell title="Create Campaign" subtitle="Launch a humanitarian campaign on Stellar.">
      {success && (
        <div className="mb-6 glass-strong rounded-xl p-4 flex items-center gap-3 border-emerald/30">
          <div className="w-9 h-9 rounded-lg bg-emerald/20 grid place-items-center">
            <CheckCircle2 className="w-5 h-5 text-emerald" />
          </div>
          <div>
            <div className="font-medium">Campaign created</div>
            <div className="text-xs text-muted-foreground">Your campaign is now live and visible to donors.</div>
          </div>
        </div>
      )}

      {submitError && (
        <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {submitError}
        </div>
      )}

      <form onSubmit={submit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl p-6 space-y-5">
          <Field label="Campaign title" error={errors.title}>
            <input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Clean Water for Yemen" className={input} />
          </Field>
          <Field label="Organization name" error={errors.org}>
            <input value={form.org} onChange={(e) => update("org", e.target.value)} placeholder="e.g. Mercy Wells Foundation" className={input} />
          </Field>
          <Field label="Description" error={errors.desc}>
            <textarea value={form.desc} onChange={(e) => update("desc", e.target.value)} rows={5} placeholder="Tell donors about the impact, beneficiaries, and timeline…" className={input + " resize-none"} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Goal amount (XLM)" error={errors.goal}>
              <input type="number" value={form.goal} onChange={(e) => update("goal", e.target.value)} placeholder="50000" className={input} />
            </Field>
            <Field label="Category">
              <select value={form.cat} onChange={(e) => update("cat", e.target.value)} className={input}>
                {cats.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Location" error={errors.location}>
              <input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Country / region" className={input} />
            </Field>
            <Field label="End date" error={errors.end}>
              <input type="date" value={form.end} onChange={(e) => update("end", e.target.value)} className={input} />
            </Field>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Cover image</div>
            <label className="block aspect-video rounded-xl border-2 border-dashed border-white/15 hover:border-primary/50 transition grid place-items-center cursor-pointer bg-white/[0.02]">
              {form.image instanceof File ? (
                <img src={URL.createObjectURL(form.image)} alt="Preview" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <div className="text-center px-4">
                  <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                  <div className="text-sm font-medium">Drop or browse</div>
                  <div className="text-xs text-muted-foreground">PNG, JPG up to 5 MB</div>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => update("image", e.target.files?.[0] ?? "")} />
            </label>
             {form.image instanceof File && <div className="mt-2 text-xs text-emerald">Selected: {form.image.name}</div>}
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="font-display font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald" /> Verification
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Campaigns go live immediately. Donations are sent to the wallet linked to your profile. Administrators can deactivate campaigns that break our guidelines.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-xl bg-gradient-brand text-primary-foreground font-medium hover:shadow-glow transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating…" : "Create campaign"}
          </button>
        </div>
      </form>
      </AppShell>
    </RequireAuth>
  );
}

const input =
  "w-full h-11 px-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary outline-none text-sm";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-muted-foreground mb-1.5">{label}</div>
      {children}
      {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
    </label>
  );
}
