-- Usuarios admin demo para login basico de Fase 3.
-- Solo para Supabase de prueba. No usar este esquema de password en produccion.
-- Antes de produccion migrar a Supabase Auth o hashing real.

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
    'admin',
    'admin123',
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
    'superdemo',
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
