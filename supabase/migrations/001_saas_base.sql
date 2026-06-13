-- Fase 1: base SaaS minima para Supabase de prueba.
-- Este script crea tablas nuevas y adapta tablas existentes sin activar RLS.

create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  estado text default 'activo',
  created_at timestamptz default now()
);

create table if not exists public.campanias (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  nombre text not null,
  candidato_nombre text,
  cargo text,
  anio integer,
  partido text,
  lista text,
  opcion text,
  fecha_eleccion date,
  logo_url text,
  flyer_url text,
  color_primario text,
  color_secundario text,
  activa boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.modulos (
  key text primary key,
  nombre text not null,
  descripcion text,
  activo_global boolean default true
);

create table if not exists public.campania_modulos (
  campania_id uuid references public.campanias(id),
  modulo text references public.modulos(key),
  habilitado boolean default false,
  primary key (campania_id, modulo)
);

create table if not exists public.usuarios_admin (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  campania_id uuid references public.campanias(id),
  rol text not null,
  nombre text,
  apellido text,
  email text,
  username text,
  password_hash text,
  activo boolean default true,
  created_at timestamptz default now()
);

alter table if exists public.padron
  add column if not exists campania_id uuid references public.campanias(id);

alter table if exists public.coordinadores
  add column if not exists campania_id uuid references public.campanias(id);

alter table if exists public.subcoordinadores
  add column if not exists campania_id uuid references public.campanias(id);

alter table if exists public.votantes
  add column if not exists campania_id uuid references public.campanias(id);

create index if not exists idx_campanias_tenant_id
  on public.campanias (tenant_id);

create index if not exists idx_campania_modulos_campania_id
  on public.campania_modulos (campania_id);

create index if not exists idx_campania_modulos_modulo
  on public.campania_modulos (modulo);

create index if not exists idx_usuarios_admin_campania_id
  on public.usuarios_admin (campania_id);

create index if not exists idx_usuarios_admin_auth_user_id
  on public.usuarios_admin (auth_user_id);

create index if not exists idx_usuarios_admin_rol
  on public.usuarios_admin (rol);

do $$
begin
  if to_regclass('public.padron') is not null then
    create index if not exists idx_padron_campania_id
      on public.padron (campania_id);
    create index if not exists idx_padron_campania_ci
      on public.padron (campania_id, ci);
  end if;

  if to_regclass('public.coordinadores') is not null then
    create index if not exists idx_coordinadores_campania_id
      on public.coordinadores (campania_id);
    create index if not exists idx_coordinadores_campania_ci
      on public.coordinadores (campania_id, ci);
    create index if not exists idx_coordinadores_campania_login_code
      on public.coordinadores (campania_id, login_code);
  end if;

  if to_regclass('public.subcoordinadores') is not null then
    create index if not exists idx_subcoordinadores_campania_id
      on public.subcoordinadores (campania_id);
    create index if not exists idx_subcoordinadores_campania_ci
      on public.subcoordinadores (campania_id, ci);
    create index if not exists idx_subcoordinadores_campania_login_code
      on public.subcoordinadores (campania_id, login_code);
  end if;

  if to_regclass('public.votantes') is not null then
    create index if not exists idx_votantes_campania_id
      on public.votantes (campania_id);
    create index if not exists idx_votantes_campania_ci
      on public.votantes (campania_id, ci);
  end if;
end $$;
