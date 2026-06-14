-- Fase 7: preparar claves para SaaS real.
-- Objetivo: que la misma CI pueda existir en campanias distintas.
--
-- Cambios:
-- - id uuid pasa a ser la primary key tecnica.
-- - campania_id y ci pasan a ser not null.
-- - la unicidad visible queda en (campania_id, ci).
-- - se reemplazan foreign keys globales por foreign keys compuestas por campania.
--
-- Ejecutar solo en Supabase de prueba despues de asignar campania_id a datos existentes.

create extension if not exists pgcrypto;

do $$
declare
  table_name text;
  null_count bigint;
begin
  foreach table_name in array array['padron', 'coordinadores', 'subcoordinadores', 'votantes']
  loop
    execute format(
      'select count(*) from public.%I where campania_id is null or ci is null',
      table_name
    )
    into null_count;

    if null_count > 0 then
      raise exception
        'No se puede aplicar 007: public.% tiene % registros con campania_id o ci null. Ejecutar 004_assign_demo_campaign.sql o completar campania_id antes.',
        table_name,
        null_count;
    end if;
  end loop;
end $$;

alter table if exists public.coordinadores
  drop constraint if exists coordinadores_ci_padron_fk;

alter table if exists public.subcoordinadores
  drop constraint if exists subcoordinadores_ci_padron_fk,
  drop constraint if exists subcoordinadores_coordinador_fk;

alter table if exists public.votantes
  drop constraint if exists votantes_ci_padron_fk,
  drop constraint if exists votantes_coordinador_fk;

alter table if exists public.padron
  add column if not exists id uuid default gen_random_uuid();

alter table if exists public.coordinadores
  add column if not exists id uuid default gen_random_uuid();

alter table if exists public.subcoordinadores
  add column if not exists id uuid default gen_random_uuid();

alter table if exists public.votantes
  add column if not exists id uuid default gen_random_uuid();

update public.padron
set id = gen_random_uuid()
where id is null;

update public.coordinadores
set id = gen_random_uuid()
where id is null;

update public.subcoordinadores
set id = gen_random_uuid()
where id is null;

update public.votantes
set id = gen_random_uuid()
where id is null;

do $$
declare
  table_name text;
  pk_name text;
begin
  foreach table_name in array array['padron', 'coordinadores', 'subcoordinadores', 'votantes']
  loop
    select conname
      into pk_name
    from pg_constraint
    where conrelid = format('public.%I', table_name)::regclass
      and contype = 'p';

    if pk_name is not null then
      execute format('alter table public.%I drop constraint %I', table_name, pk_name);
    end if;

    execute format('alter table public.%I alter column id set not null', table_name);
    execute format('alter table public.%I alter column id set default gen_random_uuid()', table_name);
    execute format('alter table public.%I alter column ci set not null', table_name);
    execute format('alter table public.%I alter column campania_id set not null', table_name);
    execute format('alter table public.%I add constraint %I primary key (id)', table_name, table_name || '_pkey');
  end loop;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.padron'::regclass
      and conname = 'padron_campania_ci_key'
  ) then
    alter table public.padron
      add constraint padron_campania_ci_key unique (campania_id, ci);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.coordinadores'::regclass
      and conname = 'coordinadores_campania_ci_key'
  ) then
    alter table public.coordinadores
      add constraint coordinadores_campania_ci_key unique (campania_id, ci);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.subcoordinadores'::regclass
      and conname = 'subcoordinadores_campania_ci_key'
  ) then
    alter table public.subcoordinadores
      add constraint subcoordinadores_campania_ci_key unique (campania_id, ci);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.votantes'::regclass
      and conname = 'votantes_campania_ci_key'
  ) then
    alter table public.votantes
      add constraint votantes_campania_ci_key unique (campania_id, ci);
  end if;
end $$;

create index if not exists idx_padron_id
  on public.padron (id);

create index if not exists idx_coordinadores_id
  on public.coordinadores (id);

create index if not exists idx_subcoordinadores_id
  on public.subcoordinadores (id);

create index if not exists idx_votantes_id
  on public.votantes (id);

create index if not exists idx_padron_campania_ci
  on public.padron (campania_id, ci);

create index if not exists idx_coordinadores_campania_ci
  on public.coordinadores (campania_id, ci);

create index if not exists idx_subcoordinadores_campania_ci
  on public.subcoordinadores (campania_id, ci);

create index if not exists idx_votantes_campania_ci
  on public.votantes (campania_id, ci);

create index if not exists idx_coordinadores_campania_login_code
  on public.coordinadores (campania_id, login_code);

create index if not exists idx_subcoordinadores_campania_login_code
  on public.subcoordinadores (campania_id, login_code);

create index if not exists idx_subcoordinadores_campania_coordinador_ci
  on public.subcoordinadores (campania_id, coordinador_ci);

create index if not exists idx_votantes_campania_coordinador_ci
  on public.votantes (campania_id, coordinador_ci);

create index if not exists idx_votantes_campania_asignado_por
  on public.votantes (campania_id, asignado_por);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.coordinadores'::regclass
      and conname = 'coordinadores_campania_ci_padron_fk'
  ) then
    alter table public.coordinadores
      add constraint coordinadores_campania_ci_padron_fk
      foreign key (campania_id, ci)
      references public.padron (campania_id, ci);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.subcoordinadores'::regclass
      and conname = 'subcoordinadores_campania_ci_padron_fk'
  ) then
    alter table public.subcoordinadores
      add constraint subcoordinadores_campania_ci_padron_fk
      foreign key (campania_id, ci)
      references public.padron (campania_id, ci);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.subcoordinadores'::regclass
      and conname = 'subcoordinadores_campania_coordinador_fk'
  ) then
    alter table public.subcoordinadores
      add constraint subcoordinadores_campania_coordinador_fk
      foreign key (campania_id, coordinador_ci)
      references public.coordinadores (campania_id, ci);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.votantes'::regclass
      and conname = 'votantes_campania_ci_padron_fk'
  ) then
    alter table public.votantes
      add constraint votantes_campania_ci_padron_fk
      foreign key (campania_id, ci)
      references public.padron (campania_id, ci);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.votantes'::regclass
      and conname = 'votantes_campania_coordinador_fk'
  ) then
    alter table public.votantes
      add constraint votantes_campania_coordinador_fk
      foreign key (campania_id, coordinador_ci)
      references public.coordinadores (campania_id, ci);
  end if;
end $$;
