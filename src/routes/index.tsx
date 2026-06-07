import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Clock, MapPin, Camera, BarChart3, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ponto Certo — Registro de Ponto da sua equipe" },
      {
        name: "description",
        content:
          "Controle de ponto simples com geolocalização, foto e painel de gestão. Seus colaboradores batem o ponto em segundos.",
      },
      { property: "og:title", content: "Ponto Certo — Registro de Ponto" },
      {
        property: "og:description",
        content:
          "Controle de ponto simples com geolocalização, foto e painel de gestão.",
      },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Clock, title: "Batida em segundos", desc: "Entrada e saída com um toque, direto do celular." },
  { icon: MapPin, title: "Geolocalização", desc: "Cada registro guarda o local exato da batida." },
  { icon: Camera, title: "Foto na batida", desc: "Confirmação visual com selfie no momento do ponto." },
  { icon: BarChart3, title: "Painel do gestor", desc: "Acompanhe todos e exporte relatórios em CSV." },
];

function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/ponto" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}>
            <Clock className="h-5 w-5" />
          </span>
          Ponto Certo
        </span>
        <Button asChild variant="outline">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              Controle de ponto sem complicação
            </span>
            <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
              O ponto da sua equipe, simples e confiável.
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              Seus colaboradores registram entrada e saída com foto e localização.
              Você acompanha tudo em um painel e exporta relatórios quando quiser.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/auth">
                  Começar agora <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div
              className="rounded-3xl p-8 text-primary-foreground shadow-[var(--shadow-elegant)]"
              style={{ background: "var(--gradient-hero)" }}
            >
              <p className="text-sm text-primary-foreground/70">Terça-feira, 7 de junho</p>
              <p className="font-display text-6xl font-bold tabular-nums">08:32</p>
              <div className="mt-6 rounded-2xl bg-background/10 p-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-background/20">
                    <Camera className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-medium">Foto + localização</p>
                    <p className="text-xs text-primary-foreground/70">Av. Paulista, São Paulo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
              <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
