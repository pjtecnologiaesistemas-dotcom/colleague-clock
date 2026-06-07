import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogIn, LogOut, MapPin, ImageIcon, Clock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getSignedPhotoUrl } from "@/lib/punch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/historico")({
  component: HistoricoPage,
});

interface Entry {
  id: string;
  punch_type: "in" | "out";
  punched_at: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  photo_path: string | null;
}

function groupByDay(entries: Entry[]) {
  const map = new Map<string, Entry[]>();
  for (const e of entries) {
    const key = new Date(e.punched_at).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries());
}

function HistoricoPage() {
  const { user } = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["my-entries", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("id, punch_type, punched_at, address, latitude, longitude, photo_path")
        .eq("user_id", user!.id)
        .order("punched_at", { ascending: false });
      if (error) throw error;
      return data as Entry[];
    },
  });

  async function openPhoto(path: string | null) {
    if (!path) return;
    const url = await getSignedPhotoUrl(path);
    if (url) setPhotoUrl(url);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Meu histórico</h1>
          <p className="text-sm text-muted-foreground">Todas as suas batidas de ponto.</p>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : entries.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <Clock className="h-10 w-10" />
            <p>Você ainda não registrou nenhum ponto.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupByDay(entries).map(([day, dayEntries]) => (
              <div key={day} className="space-y-2">
                <h2 className="text-sm font-semibold capitalize text-muted-foreground">{day}</h2>
                <Card className="divide-y divide-border p-0">
                  {dayEntries.map((e) => (
                    <div key={e.id} className="flex items-center gap-4 p-4">
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                          e.punch_type === "in"
                            ? "bg-success/15 text-success"
                            : "bg-primary/15 text-primary"
                        }`}
                      >
                        {e.punch_type === "in" ? <LogIn className="h-5 w-5" /> : <LogOut className="h-5 w-5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {e.punch_type === "in" ? "Entrada" : "Saída"} ·{" "}
                          {new Date(e.punched_at).toLocaleTimeString("pt-BR", {
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
                  ))}
                </Card>
              </div>
            ))}
          </div>
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