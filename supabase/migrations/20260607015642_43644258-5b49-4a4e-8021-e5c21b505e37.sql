-- Upload: usuário envia para sua própria pasta (prefixo = user_id)
CREATE POLICY "Users upload own punch photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'punch-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Leitura: dono da foto ou gestor
CREATE POLICY "Users view own punch photos or admin all"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'punch-photos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );