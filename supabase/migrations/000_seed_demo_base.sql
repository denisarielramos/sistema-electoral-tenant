-- Datos demo ficticios para probar la app en Supabase de prueba.
-- No contiene datos reales.
-- Ejecutar despues de 000_current_base_schema.sql y antes de 001_saas_base.sql.

insert into public.padron (
  ci,
  nombre,
  apellido,
  localidad,
  local_votacion,
  seccional,
  mesa,
  orden,
  direccion
)
values
  (9000001, 'Ana', 'Demo', 'Ciudad Demo', 'Colegio Demo Norte', 1, 1, 101, 'Calle Ficticia 123'),
  (9000002, 'Bruno', 'Ejemplo', 'Ciudad Demo', 'Colegio Demo Norte', 1, 1, 102, 'Avenida Simulada 456'),
  (9000003, 'Carla', 'Prueba', 'Villa Demo', 'Escuela Demo Sur', 2, 2, 201, 'Pasaje Inventado 789'),
  (9000004, 'Diego', 'Muestra', 'Villa Demo', 'Escuela Demo Sur', 2, 2, 202, 'Ruta Demo Km 4'),
  (9000005, 'Elena', 'Ficticia', 'Barrio Demo', 'Centro Comunitario Demo', 3, 3, 301, 'Calle Sin Datos Reales 555'),
  (9000006, 'Fabian', 'Simulado', 'Barrio Demo', 'Centro Comunitario Demo', 3, 3, 302, 'Calle Inventada 777')
on conflict (ci) do update set
  nombre = excluded.nombre,
  apellido = excluded.apellido,
  localidad = excluded.localidad,
  local_votacion = excluded.local_votacion,
  seccional = excluded.seccional,
  mesa = excluded.mesa,
  orden = excluded.orden,
  direccion = excluded.direccion;

insert into public.coordinadores (
  ci,
  login_code,
  telefono,
  direccion_override,
  asignado_por_nombre
)
values (
  9000001,
  'COORD-DEMO',
  '+595990000001',
  null,
  'Superadmin Demo'
)
on conflict (ci) do update set
  login_code = excluded.login_code,
  telefono = excluded.telefono,
  direccion_override = excluded.direccion_override,
  asignado_por_nombre = excluded.asignado_por_nombre;

insert into public.subcoordinadores (
  ci,
  coordinador_ci,
  login_code,
  telefono,
  direccion_override,
  asignado_por_nombre,
  confirmado
)
values (
  9000002,
  9000001,
  'SUB-DEMO',
  '+595990000002',
  null,
  'Ana Demo',
  true
)
on conflict (ci) do update set
  coordinador_ci = excluded.coordinador_ci,
  login_code = excluded.login_code,
  telefono = excluded.telefono,
  direccion_override = excluded.direccion_override,
  asignado_por_nombre = excluded.asignado_por_nombre,
  confirmado = excluded.confirmado;

insert into public.votantes (
  ci,
  coordinador_ci,
  asignado_por,
  asignado_por_nombre,
  telefono,
  direccion_override,
  voto_confirmado
)
values
  (9000003, 9000001, 9000001, 'Ana Demo', '+595990000003', null, true),
  (9000004, 9000001, 9000002, 'Bruno Ejemplo', '+595990000004', null, false),
  (9000005, 9000001, 9000002, 'Bruno Ejemplo', '+595990000005', null, false),
  (9000006, 9000001, 9000001, 'Ana Demo', '+595990000006', null, false)
on conflict (ci) do update set
  coordinador_ci = excluded.coordinador_ci,
  asignado_por = excluded.asignado_por,
  asignado_por_nombre = excluded.asignado_por_nombre,
  telefono = excluded.telefono,
  direccion_override = excluded.direccion_override,
  voto_confirmado = excluded.voto_confirmado;
