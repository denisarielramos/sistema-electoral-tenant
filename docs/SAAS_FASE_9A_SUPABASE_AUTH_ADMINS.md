# SaaS Fase 9A: Supabase Auth para admins

Esta fase migra el login de `admin_general` y `superadmin_cliente` hacia Supabase Auth.

No activa RLS. No elimina `password_hash`. El login por `login_code` de coordinadores y subcoordinadores se mantiene igual.

## Objetivo

- Usar Supabase Auth para credenciales de Admin General y superadmins de campaña.
- Mantener `usuarios_admin` como tabla de perfil y autorización.
- Vincular cada usuario Auth con `usuarios_admin.auth_user_id`.
- Dejar `password_hash` solo como fallback temporal demo hasta la Fase 9D.

## Migración SQL

Ejecutar en Supabase de prueba:

```sql
supabase/migrations/008_auth_admin_profiles.sql
```

La migración crea índices para:

- `auth_user_id`
- `email`
- `username`
- `campania_id`

También crea un índice único parcial para `auth_user_id` cuando no es null.

## Crear usuarios en Supabase Auth

En Supabase:

1. Ir a **Authentication > Users**.
2. Crear el usuario con email y contraseña.
3. Abrir el usuario creado.
4. Copiar el **User UID**.
5. Pegar ese UID en `usuarios_admin.auth_user_id`.

## Admin General de plataforma

El usuario:

```text
superadmin@sistema.electoral
```

debe vincularse como Admin General, no como superadmin de campaña.

Ejemplo:

```sql
update public.usuarios_admin
set
  auth_user_id = 'PEGAR_USER_UID_DE_SUPABASE_AUTH',
  rol = 'admin_general',
  campania_id = null,
  username = 'superadmin',
  email = 'superadmin@sistema.electoral',
  activo = true
where email = 'superadmin@sistema.electoral'
   or username = 'superadmin';
```

Si la fila no existe:

```sql
insert into public.usuarios_admin (
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
  'PEGAR_USER_UID_DE_SUPABASE_AUTH',
  null,
  'admin_general',
  'Admin',
  'General',
  'superadmin@sistema.electoral',
  'superadmin',
  null,
  true
);
```

Este usuario debe ingresar únicamente por `/admin`.

## Superadmin de campaña

Para un futuro `superadmin_cliente`:

1. Crear usuario en Supabase Auth.
2. Copiar el User UID.
3. Crear o actualizar una fila en `usuarios_admin`.
4. Asignar:

```text
rol = superadmin_cliente
campania_id = id de la campaña
auth_user_id = User UID de Supabase Auth
```

Ejemplo:

```sql
update public.usuarios_admin
set
  auth_user_id = 'PEGAR_USER_UID_DE_SUPABASE_AUTH',
  rol = 'superadmin_cliente',
  campania_id = 'PEGAR_CAMPANIA_ID',
  activo = true
where username = 'usuario_cliente';
```

El `superadmin_cliente` debe ingresar por `/`.

## Fallback temporal

Durante esta fase, si Supabase Auth falla o el usuario todavía no tiene `auth_user_id`, la app mantiene el fallback demo:

```text
username + password_hash
```

Esto no es seguridad final. Se elimina en Fase 9D.

## Qué no se hizo

- No se activó RLS.
- No se eliminó `password_hash`.
- No se migró coordinador/subcoordinador a Supabase Auth.
- No se tocó el modelo de padrón.
- No se cambió el importador de padrón.

## Verificación esperada

- `superadmin@sistema.electoral` vinculado como `admin_general` entra por `/admin`.
- Un `superadmin_cliente` vinculado por `auth_user_id` entra por `/`.
- `COORD-DEMO` y `SUB-DEMO` siguen entrando con `login_code`.
- RLS sigue desactivado.
