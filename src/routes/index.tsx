import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, Factory, Leaf, Lock, ShieldCheck, Target, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_ACCOUNTS, useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Industrial Carbon Intelligence & Reduction Engine" },
      {
        name: "description",
        content:
          "Measure factory emissions, optimise reduction actions under budget and simulate what-if decarbonisation scenarios.",
      },
      { property: "og:title", content: "Industrial Carbon Intelligence & Reduction Engine" },
      {
        property: "og:description",
        content:
          "Dataset ingestion, carbon analysis, OR-Tools optimisation and auditable reports for industrial facilities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, ready, login, loginAs } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("user@carbonengine.io");
  const [password, setPassword] = useState("user123");
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && user) navigate({ to: "/dashboard", replace: true });
  }, [ready, user, navigate]);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-primary-foreground/15">
            <Zap className="size-5" />
          </span>
          Carbon Intelligence & Reduction Engine
        </div>
        <div>
          <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
            From factory data to a funded decarbonisation plan.
          </h2>
          <p className="mt-4 max-w-md text-sm text-primary-foreground/80">
            Ingest energy and production datasets, quantify Scope 1 and Scope 2 emissions, then let
            the OR-Tools solver choose the reduction portfolio that hits your target within budget.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
            {[
              { icon: Factory, text: "6 industry profiles" },
              { icon: BarChart3, text: "Source-level breakdown" },
              { icon: Target, text: "Budget-constrained solver" },
              { icon: Leaf, text: "Auditable ESG reports" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-primary-foreground/90">
                <Icon className="size-4" /> {text}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-primary-foreground/60">Demo build · sample factory datasets</p>
      </div>

      <div className="flex items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Zap className="size-5" />
            </span>
            <span className="text-sm font-semibold leading-tight">
              Carbon Intelligence
              <span className="block text-xs font-normal text-muted-foreground">
                & Reduction Engine
              </span>
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use a demo account or jump straight in with a one-click role.
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const res = login(email, password);
              if (!res.ok) setError(res.error ?? "Sign in failed");
              else navigate({ to: "/dashboard" });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">
              <Lock className="mr-2 size-4" /> Sign in
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> quick demo access
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              onClick={() => {
                loginAs("USER");
                navigate({ to: "/dashboard" });
              }}
            >
              <Factory className="mr-2 size-4" /> Enter as USER
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                loginAs("ADMIN");
                navigate({ to: "/dashboard" });
              }}
            >
              <ShieldCheck className="mr-2 size-4" /> Enter as ADMIN
            </Button>
          </div>

          <Card className="mt-6 gap-2 p-4 text-xs text-muted-foreground">
            {DEMO_ACCOUNTS.map((a) => (
              <div key={a.id} className="flex justify-between gap-3">
                <span className="font-medium text-foreground">{a.role}</span>
                <span>
                  {a.email} / {a.password}
                </span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
