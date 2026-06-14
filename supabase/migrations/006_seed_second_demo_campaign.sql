-- Fase 6: segunda campania demo para probar aislamiento por campania_id.
-- Solo para Supabase de prueba. No contiene datos reales.
-- Ejecutar despues de 005_seed_admin_demo_login.sql.
--
-- Tenant demo San Lorenzo:
-- 66666666-6666-6666-6666-666666666666
-- Campania demo San Lorenzo:
-- 77777777-7777-7777-7777-777777777777
-- Superadmin demo:
-- username: sanlorenzo
-- password: demo123

insert into public.tenants (id, nombre, estado)
values (
  '66666666-6666-6666-6666-666666666666',
  'Cliente Demo San Lorenzo',
  'activo'
)
on conflict (id) do update set
  nombre = excluded.nombre,
  estado = excluded.estado;

insert into public.campanias (
  id,
  tenant_id,
  nombre,
  candidato_nombre,
  cargo,
  anio,
  partido,
  lista,
  opcion,
  fecha_eleccion,
  color_primario,
  color_secundario,
  activa
)
values (
  '77777777-7777-7777-7777-777777777777',
  '66666666-6666-6666-6666-666666666666',
  'Campania Demo San Lorenzo',
  'Mariana Demo Ferreira',
  'Intendente',
  2026,
  'Movimiento Demo',
  'Lista 7',
  'Opcion SL',
  '2026-11-15',
  '#2563eb',
  '#1e40af',
  true
)
on conflict (id) do update set
  tenant_id = excluded.tenant_id,
  nombre = excluded.nombre,
  candidato_nombre = excluded.candidato_nombre,
  cargo = excluded.cargo,
  anio = excluded.anio,
  partido = excluded.partido,
  lista = excluded.lista,
  opcion = excluded.opcion,
  fecha_eleccion = excluded.fecha_eleccion,
  color_primario = excluded.color_primario,
  color_secundario = excluded.color_secundario,
  activa = excluded.activa;

insert into public.campania_modulos (campania_id, modulo, habilitado)
select
  '77777777-7777-7777-7777-777777777777'::uuid,
  key,
  true
from public.modulos
where key in (
  'vista_seccional',
  'invitaciones_whatsapp',
  'pdf',
  'exportar_excel',
  'dashboard_bi',
  'gestion_coordinadores',
  'gestion_votantes'
)
on conflict (campania_id, modulo) do update set
  habilitado = excluded.habilitado;

insert into public.usuarios_admin (
  id,
  auth_user_id,
  campania_id,
  rol,
  nombre,
  apellido,
  email,
  username,
  password_hash,
  activo
)
values (
  '88888888-8888-8888-8888-888888888888',
  null,
  '77777777-7777-7777-7777-777777777777',
  'superadmin_cliente',
  'Superadmin',
  'San Lorenzo Demo',
  'superadmin.sanlorenzo.demo@example.com',
  'sanlorenzo',
  'demo123',
  true
)
on conflict (id) do update set
  auth_user_id = excluded.auth_user_id,
  campania_id = excluded.campania_id,
  rol = excluded.rol,
  nombre = excluded.nombre,
  apellido = excluded.apellido,
  email = excluded.email,
  username = excluded.username,
  password_hash = excluded.password_hash,
  activo = excluded.activo;

insert into public.padron (
  ci,
  nombre,
  apellido,
  localidad,
  local_votacion,
  seccional,
  mesa,
  orden,
  direccion,
  campania_id
)
values
  (9100001, 'Lucia', 'Sanabria', 'San Lorenzo Demo', 'Colegio Demo Este', 4, 10, 1001, 'Calle Demo Azul 101', '77777777-7777-7777-7777-777777777777'),
  (9100002, 'Mateo', 'Benitez', 'San Lorenzo Demo', 'Colegio Demo Este', 4, 10, 1002, 'Calle Demo Azul 102', '77777777-7777-7777-7777-777777777777'),
  (9100003, 'Sofia', 'Rojas', 'Capilla Demo', 'Escuela Demo Central', 5, 11, 1101, 'Avenida Demo 201', '77777777-7777-7777-7777-777777777777'),
  (9100004, 'Tomas', 'Acosta', 'Capilla Demo', 'Escuela Demo Central', 5, 11, 1102, 'Avenida Demo 202', '77777777-7777-7777-7777-777777777777'),
  (9100005, 'Valeria', 'Nunez', 'Reducto Demo', 'Centro Demo Sur', 6, 12, 1201, 'Pasaje Demo 301', '77777777-7777-7777-7777-777777777777'),
  (9100006, 'Hugo', 'Caceres', 'Reducto Demo', 'Centro Demo Sur', 6, 12, 1202, 'Pasaje Demo 302', '77777777-7777-7777-7777-777777777777')
on conflict (ci) do update set
  nombre = excluded.nombre,
  apellido = excluded.apellido,
  localidad = excluded.localidad,
  local_votacion = excluded.local_votacion,
  seccional = excluded.seccional,
  mesa = excluded.mesa,
  orden = excluded.orden,
  direccion = excluded.direccion,
  campania_id = excluded.campania_id;

insert into public.coordinadores (
  ci,
  login_code,
  telefono,
  direccion_override,
  asignado_por_nombre,
  campania_id
)
values (
  9100001,
  'COORD-SL',
  '+595991000001',
  null,
  'Superadmin San Lorenzo Demo',
  '77777777-7777-7777-7777-777777777777'
)
on conflict (ci) do update set
  login_code = excluded.login_code,
  telefono = excluded.telefono,
  direccion_override = excluded.direccion_override,
  asignado_por_nombre = excluded.asignado_por_nombre,
  campania_id = excluded.campania_id;

insert into public.subcoordinadores (
  ci,
  coordinador_ci,
  login_code,
  telefono,
  direccion_override,
  asignado_por_nombre,
  confirmado,
  campania_id
)
values (
  9100002,
  9100001,
  'SUB-SL',
  '+595991000002',
  null,
  'Lucia Sanabria',
  true,
  '77777777-7777-7777-7777-777777777777'
)
on conflict (ci) do update set
  coordinador_ci = excluded.coordinador_ci,
  login_code = excluded.login_code,
  telefono = excluded.telefono,
  direccion_override = excluded.direccion_override,
  asignado_por_nombre = excluded.asignado_por_nombre,
  confirmado = excluded.confirmado,
  campania_id = excluded.campania_id;

insert into public.votantes (
  ci,
  coordinador_ci,
  asignado_por,
  asignado_por_nombre,
  telefono,
  direccion_override,
  voto_confirmado,
  campania_id
)
values
  (9100003, 9100001, 9100001, 'Lucia Sanabria', '+595991000003', null, true, '77777777-7777-7777-7777-777777777777'),
  (9100004, 9100001, 9100002, 'Mateo Benitez', '+595991000004', null, false, '77777777-7777-7777-7777-777777777777'),
  (9100005, 9100001, 9100002, 'Mateo Benitez', '+595991000005', null, false, '77777777-7777-7777-7777-777777777777'),
  (9100006, 9100001, 9100001, 'Lucia Sanabria', '+595991000006', null, false, '77777777-7777-7777-7777-777777777777')
on conflict (ci) do update set
  coordinador_ci = excluded.coordinador_ci,
  asignado_por = excluded.asignado_por,
  asignado_por_nombre = excluded.asignado_por_nombre,
  telefono = excluded.telefono,
  direccion_override = excluded.direccion_override,
  voto_confirmado = excluded.voto_confirmado,
  campania_id = excluded.campania_id;
