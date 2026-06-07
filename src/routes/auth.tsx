import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Ponto Certo" },
      { name: "description", content: "Acesse sua conta para registrar o ponto." },
    ],
  }),
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres").max(72),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, "Informe seu nome completo").max(120),
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/ponto" });
  }, [user, loading, navigate]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) {
      toast.error("Não foi possível entrar. Verifique e-mail e senha.");
      return;
    }
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/ponto" });
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = signupSchema.safeParse({
      fullName: form.get("fullName"),
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.fullName },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("already")
          ? "Este e-mail já está cadastrado."
          : "Não foi possível criar a conta.",
      );
      return;
    }
    toast.success("Conta criada! Verifique seu e-mail para confirmar o cadastro.");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 text-primary-foreground lg:flex"
        style={{ background: "var(--gradient-hero)" }}>
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <Clock className="h-6 w-6" /> Ponto Certo
        </Link>
        <div className="space-y-4">
          <h1 className="font-display text-4xl font-bold leading-tight">
            O controle de ponto da sua equipe, simples e confiável.
          </h1>
          <p className="max-w-md text-primary-foreground/80">
            Registro com geolocalização e foto, histórico individual e um painel
            completo para a gestão acompanhar tudo em tempo real.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} Ponto Certo
        </p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Clock className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-bold">Ponto Certo</span>
          </div>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-mail</Label>
                  <Input id="login-email" name="email" type="email" autoComplete="email" placeholder="voce@empresa.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input id="login-password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome completo</Label>
                  <Input id="signup-name" name="fullName" type="text" autoComplete="name" placeholder="Maria da Silva" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input id="signup-email" name="email" type="email" autoComplete="email" placeholder="voce@empresa.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input id="signup-password" name="password" type="password" autoComplete="new-password" placeholder="Mínimo 6 caracteres" required />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}