-- Base actual minima para Supabase de prueba.
-- Ejecutar primero si el proyecto de Supabase esta vacio.
-- No activa RLS y no carga datos reales.

create table if not exists public.padron (
  ci bigint primary key,
  nombre text,
  apellido text,
  localidad text,
  local_votacion text,
  seccional integer,
  mesa integer,
  orden integer,
  direccion text,
  created_at timestamptz default now()
);

create table if not exists public.coordinadores (
  ci bigint primary key,
  login_code text,
  telefono text,
  direccion_override text,
  asignado_por_nombre text,
  created_at timestamptz default now(),
  constraint coordinadores_ci_padron_fk
    foreign key (ci) references public.padron(ci)
);

create table if not exists public.subcoordinadores (
  ci bigint primary key,
  coordinador_ci bigint,
  login_code text,
  telefono text,
  direccion_override text,
  asignado_por_nombre text,
  confirmado boolean default false,
  created_at timestamptz default now(),
  constraint subcoordinadores_ci_padron_fk
    foreign key (ci) references public.padron(ci),
  constraint subcoordinadores_coordinador_fk
    foreign key (coordinador_ci) references public.coordinadores(ci)
);

create table if not exists public.votantes (
  ci bigint primary key,
  coordinador_ci bigint,
  asignado_por bigint,
  asignado_por_nombre text,
  telefono text,
  direccion_override text,
  voto_confirmado boolean default false,
  created_at timestamptz default now(),
  constraint votantes_ci_padron_fk
    foreign key (ci) references public.padron(ci),
  constraint votantes_coordinador_fk
    foreign key (coordinador_ci) references public.coordinadores(ci)
);

create index if not exists idx_base_padron_ci
  on public.padron (ci);

create index if not exists idx_base_coordinadores_ci
  on public.coordinadores (ci);

create index if not exists idx_base_coordinadores_login_code
  on public.coordinadores (login_code);

create index if not exists idx_base_subcoordinadores_ci
  on public.subcoordinadores (ci);

create index if not exists idx_base_subcoordinadores_coordinador_ci
  on public.subcoordinadores (coordinador_ci);

create index if not exists idx_base_subcoordinadores_login_code
  on public.subcoordinadores (login_code);

create index if not exists idx_base_votantes_ci
  on public.votantes (ci);

create index if not exists idx_base_votantes_coordinador_ci
  on public.votantes (coordinador_ci);

create index if not exists idx_base_votantes_asignado_por
  on public.votantes (asignado_por);
