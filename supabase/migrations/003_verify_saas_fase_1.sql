-- Verificaciones de Fase 1 para Supabase de prueba.
-- Ejecutar al final para revisar tablas SaaS, modulos y asignacion de campania.

select 'tenants' as section, *
from public.tenants
order by created_at;

select 'campanias' as section, *
from public.campanias
order by created_at;

select 'modulos' as section, *
from public.modulos
order by key;

select 'campania_modulos' as section, *
from public.campania_modulos
order by campania_id, modulo;

select 'usuarios_admin' as section, *
from public.usuarios_admin
order by rol, username;

select campania_id, count(*) as total_padron
from public.padron
group by campania_id
order by campania_id nulls first;

select campania_id, count(*) as total_coordinadores
from public.coordinadores
group by campania_id
order by campania_id nulls first;

select campania_id, count(*) as total_subcoordinadores
from public.subcoordinadores
group by campania_id
order by campania_id nulls first;

select campania_id, count(*) as total_votantes
from public.votantes
group by campania_id
order by campania_id nulls first;

select 'padron' as tabla, count(*) as registros_con_campania_null
from public.padron
where campania_id is null
union all
select 'coordinadores' as tabla, count(*) as registros_con_campania_null
from public.coordinadores
where campania_id is null
union all
select 'subcoordinadores' as tabla, count(*) as registros_con_campania_null
from public.subcoordinadores
where campania_id is null
union all
select 'votantes' as tabla, count(*) as registros_con_campania_null
from public.votantes
where campania_id is null
order by tabla;
