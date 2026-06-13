-- Fase 1: seed demo para Supabase de prueba.
-- Ejecutar despues de 001_saas_base.sql.
-- UUID fijo de campania demo:
-- 22222222-2222-2222-2222-222222222222

insert into public.tenants (id, nombre, estado)
values (
  '11111111-1111-1111-1111-111111111111',
  'Tenant Demo',
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
  lista,
  opcion,
  color_primario,
  color_secundario,
  activa
)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Campaña Demo',
  'José Chechito López',
  'Concejal',
  2026,
  'Lista 2E',
  'Opción 2',
  '#dc2626',
  '#991b1b',
  true
)
on conflict (id) do update set
  tenant_id = excluded.tenant_id,
  nombre = excluded.nombre,
  candidato_nombre = excluded.candidato_nombre,
  cargo = excluded.cargo,
  anio = excluded.anio,
  lista = excluded.lista,
  opcion = excluded.opcion,
  color_primario = excluded.color_primario,
  color_secundario = excluded.color_secundario,
  activa = excluded.activa;

insert into public.modulos (key, nombre, descripcion, activo_global)
values
  ('vista_seccional', 'Vista por seccional', 'Permite segmentar y visualizar datos por seccional.', true),
  ('invitaciones_whatsapp', 'Invitaciones por WhatsApp', 'Permite generar enlaces o mensajes de invitacion por WhatsApp.', true),
  ('pdf', 'PDF', 'Permite generar reportes PDF.', true),
  ('exportar_excel', 'Exportar Excel', 'Permite exportar datos a Excel o CSV.', true),
  ('dashboard_bi', 'Dashboard BI', 'Permite acceder a tableros e indicadores avanzados.', true),
  ('gestion_coordinadores', 'Gestion de coordinadores', 'Permite crear y administrar coordinadores y subcoordinadores.', true),
  ('gestion_votantes', 'Gestion de votantes', 'Permite asignar, editar y confirmar votantes.', true)
on conflict (key) do update set
  nombre = excluded.nombre,
  descripcion = excluded.descripcion,
  activo_global = excluded.activo_global;

insert into public.campania_modulos (campania_id, modulo, habilitado)
select
  '22222222-2222-2222-2222-222222222222'::uuid,
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
values
  (
    '33333333-3333-3333-3333-333333333333',
    null,
    null,
    'admin_general',
    'Admin',
    'General',
    'admin.general.demo@example.com',
    'admin_general_demo',
    null,
    true
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    null,
    '22222222-2222-2222-2222-222222222222',
    'superadmin_cliente',
    'Superadmin',
    'Cliente Demo',
    'superadmin.cliente.demo@example.com',
    'superadmin_cliente_demo',
    null,
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
