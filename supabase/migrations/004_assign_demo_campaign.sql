-- Asigna registros existentes sin campania_id a la campania demo.
-- No borra datos y no modifica registros que ya tienen campania_id.
-- Campania demo creada por 002_seed_saas_demo.sql:
-- 22222222-2222-2222-2222-222222222222

update public.padron
set campania_id = '22222222-2222-2222-2222-222222222222'
where campania_id is null;

update public.coordinadores
set campania_id = '22222222-2222-2222-2222-222222222222'
where campania_id is null;

update public.subcoordinadores
set campania_id = '22222222-2222-2222-2222-222222222222'
where campania_id is null;

update public.votantes
set campania_id = '22222222-2222-2222-2222-222222222222'
where campania_id is null;
