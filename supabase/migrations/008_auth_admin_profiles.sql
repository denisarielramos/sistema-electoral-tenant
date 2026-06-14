-- Fase 9A: preparar perfiles admin para Supabase Auth.
-- No activa RLS.
-- No elimina password_hash: queda deprecado y solo como fallback temporal
-- hasta la Fase 9D.

create unique index if not exists idx_usuarios_admin_auth_user_id_unique
  on public.usuarios_admin (auth_user_id)
  where auth_user_id is not null;

create index if not exists idx_usuarios_admin_auth_user_id
  on public.usuarios_admin (auth_user_id);

create index if not exists idx_usuarios_admin_email
  on public.usuarios_admin (email);

create index if not exists idx_usuarios_admin_username
  on public.usuarios_admin (username);

create index if not exists idx_usuarios_admin_campania_id
  on public.usuarios_admin (campania_id);

comment on column public.usuarios_admin.password_hash is
  'DEPRECADO Fase 9A: solo fallback temporal demo. Usar Supabase Auth para credenciales reales.';
