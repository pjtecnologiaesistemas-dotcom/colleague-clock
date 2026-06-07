import { supabase } from "@/integrations/supabase/client";
import { resolveLocation } from "@/lib/geo";

export type PunchType = "in" | "out";

export interface PunchInput {
  userId: string;
  type: PunchType;
  photoFile: File;
}

export async function registerPunch({ userId, type, photoFile }: PunchInput) {
  // 1. Localização
  const location = await resolveLocation();

  // 2. Upload da foto
  const ext = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("punch-photos")
    .upload(path, photoFile, { contentType: photoFile.type || "image/jpeg" });
  if (uploadError) throw uploadError;

  // 3. Registro
  const { error: insertError } = await supabase.from("time_entries").insert({
    user_id: userId,
    punch_type: type,
    latitude: location.latitude,
    longitude: location.longitude,
    address: location.address,
    photo_path: path,
  });
  if (insertError) throw insertError;

  return { location, path };
}

export async function getSignedPhotoUrl(path: string) {
  const { data, error } = await supabase.storage
    .from("punch-photos")
    .createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}