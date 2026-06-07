import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, LogIn, LogOut, MapPin, Loader2, RotateCcw, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/use-auth";
import { registerPunch, type PunchType } from "@/lib/punch";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/ponto")({
  component: PontoPage,
});

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function PontoPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const now = useNow();
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: lastEntry } = useQuery({
    queryKey: ["last-entry", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("punch_type, punched_at")
        .eq("user_id", user!.id)
        .order("punched_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const nextType: PunchType = lastEntry?.punch_type === "in" ? "out" : "in";

  const mutation = useMutation({
    mutationFn: async (type: PunchType) => {
      if (!user) throw new Error("Sessão expirada.");
      if (!photo) throw new Error("Tire uma foto antes de registrar o ponto.");
      return registerPunch({ userId: user.id, type, photoFile: photo });
    },
    onSuccess: (res, type) => {
      toast.success(
        `${type === "in" ? "Entrada" : "Saída"} registrada${res.location.address ? ` em ${res.location.address}` : ""}!`,
      );
      setPhoto(null);
      setPreview(null);
      queryClient.invalidateQueries({ queryKey: ["last-entry"] });
      queryClient.invalidateQueries({ queryKey: ["my-entries"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Falha ao registrar o ponto.";
      if (msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("permission")) {
        toast.error("Permita o acesso à localização para registrar o ponto.");
      } else {
        toast.error(msg);
      }
    },
  });

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <p className="font-display text-6xl font-bold tabular-nums tracking-tight">
            {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            <span className="text-2xl text-muted-foreground">
              :{now.toLocaleTimeString("pt-BR", { second: "2-digit" }).padStart(2, "0").slice(-2)}
            </span>
          </p>
          {lastEntry && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Última batida: {lastEntry.punch_type === "in" ? "Entrada" : "Saída"} às{" "}
              {new Date(lastEntry.punched_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>

        <Card className="overflow-hidden p-0">
          <div className="relative aspect-square w-full bg-muted">
            {preview ? (
              <img src={preview} alt="Foto do ponto" className="h-full w-full object-cover" />
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground transition-colors hover:bg-secondary"
              >
                <Camera className="h-12 w-12" />
                <span className="font-medium">Toque para tirar uma foto</span>
              </button>
            )}
            {preview && (
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-3 right-3 shadow"
                onClick={() => fileRef.current?.click()}
              >
                <RotateCcw className="h-4 w-4" /> Refazer
              </Button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={onPickPhoto}
          />
        </Card>

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> Sua localização será registrada junto com a batida.
        </p>

        <Button
          variant={nextType === "in" ? "success" : "hero"}
          size="xl"
          className="w-full"
          disabled={mutation.isPending || !photo}
          onClick={() => mutation.mutate(nextType)}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Registrando…
            </>
          ) : nextType === "in" ? (
            <>
              <LogIn className="h-5 w-5" /> Registrar entrada
            </>
          ) : (
            <>
              <LogOut className="h-5 w-5" /> Registrar saída
            </>
          )}
        </Button>
      </div>
    </AppShell>
  );
}