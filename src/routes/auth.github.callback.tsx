import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useApp } from "@/components/AppContext";
import * as api from "@/services/api";

export const Route = createFileRoute("/auth/github/callback")({
  head: () => ({ meta: [{ title: "Signing in with GitHub…" }] }),
  component: GithubCallback,
});

function GithubCallback() {
  const nav = useNavigate();
  const { setUser } = useApp();
  // The one-time code and state may only be used once; guard against effects
  // running twice (React StrictMode in development).
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    // Reject the callback unless the state matches the one this browser started with.
    if (!code || !api.consumeGithubState(params.get("state"))) {
      nav({ to: "/login" });
      return;
    }
    api.githubCallback(code)
      .then((res) => {
        localStorage.setItem("trustbridge_token", res.token);
        setUser(res.user);
        nav({ to: "/dashboard" });
      })
      .catch(() => {
        nav({ to: "/login" });
      });
  }, [nav, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Signing in with GitHub…</p>
      </div>
    </div>
  );
}