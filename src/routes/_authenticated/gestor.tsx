import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, LogIn, LogOut, MapPin, ImageIcon, ShieldAlert, Users, Clock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth, useIsAdmin } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getSignedPhotoUrl } from "@/lib/punch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/gestor")({
  component: GestorPage,
});

interface Entry {
  id: string;
  user_id: string;
  punch_type: "in" | "out";
  punched_at: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  photo_path: string | null;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

function GestorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin(user?.id);

  const [employee, setEmployee] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const { data: profiles = [] } = useQuery({
    queryKey: ["all-profiles"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["all-entries"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("id, user_id, punch_type, punched_at, address, latitude, longitude, photo_path")
        .order("punched_at", { ascending: false });
      if (error) throw error;
      return data as Entry[];
    },
  });

  const profileMap = useMemo(() => {
    const m = new Map<string, Profile>();
    profiles.forEach((p) => m.set(p.id, p));
    return m;
  }, [profiles]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (employee !== "all" && e.user_id !== employee) return false;
      const d = new Date(e.punched_at);
      if (from && d < new Date(from + "T00:00:00")) return false;
      if (to && d > new Date(to + "T23:59:59")) return false;
      return true;
    });
  }, [entries, employee, from, to]);

  function exportCsv() {
    const header = ["Colaborador", "E-mail", "Tipo", "Data", "Hora", "Endereço", "Latitude", "Longitude"];
    const rows = filtered.map((e) => {
      const p = profileMap.get(e.user_id);
      const d = new Date(e.punched_at);
      return [
        p?.full_name || "—",
        p?.email || "—",
        e.punch_type === "in" ? "Entrada" : "Saída",
        d.toLocaleDateString("pt-BR"),
        d.toLocaleTimeString("pt-BR"),
        e.address || "",
        e.latitude ?? "",
        e.longitude ?? "",
      ];
    });
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registros-ponto-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function openPhoto(path: string | null) {
    if (!path) return;
    const url = await getSignedPhotoUrl(path);
    if (url) setPhotoUrl(url);
  }

  if (roleLoading) {
    return (
      <AppShell>
        <p className="text-muted-foreground">Carregando…</p>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <ShieldAlert className="h-10 w-10 text-warning" />
          <h1 className="font-display text-xl font-bold">Acesso restrito</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Esta área é exclusiva para gestores. Fale com o administrador para liberar seu acesso.
          </p>
          <Button variant="outline" onClick={() => navigate({ to: "/ponto" })}>
            Voltar para o ponto
          </Button>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Painel do gestor</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} registro{filtered.length === 1 ? "" : "s"} ·{" "}
              {profiles.length} colaborador{profiles.length === 1 ? "" : "es"}
            </p>
          </div>
          <Button variant="hero" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>

        <Card className="grid gap-4 p-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Colaborador</Label>
            <Select value={employee} onValueChange={setEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os colaboradores</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name || p.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="from">De</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to">Até</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </Card>

        {isLoading ? (
          <p className="text-muted-foreground">Carregando registros…</p>
        ) : filtered.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <Users className="h-10 w-10" />
            <p>Nenhum registro encontrado para os filtros selecionados.</p>
          </Card>
        ) : (
          <Card className="divide-y divide-border p-0">
            {filtered.map((e) => {
              const p = profileMap.get(e.user_id);
              return (
                <div key={e.id} className="flex items-center gap-4 p-4">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                      e.punch_type === "in" ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
                    }`}
                  >
                    {e.punch_type === "in" ? <LogIn className="h-5 w-5" /> : <LogOut className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p?.full_name || p?.email || "Colaborador"}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.punch_type === "in" ? "Entrada" : "Saída"} ·{" "}
                      {new Date(e.punched_at).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {e.address && (
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" /> {e.address}
                      </p>
                    )}
                  </div>
                  {e.photo_path && (
                    <Button variant="ghost" size="icon" onClick={() => openPhoto(e.photo_path)}>
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </Card>
        )}
      </div>

      <Dialog open={!!photoUrl} onOpenChange={(o) => !o && setPhotoUrl(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Foto da batida</DialogTitle>
          </DialogHeader>
          {photoUrl && <img src={photoUrl} alt="Foto da batida" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}