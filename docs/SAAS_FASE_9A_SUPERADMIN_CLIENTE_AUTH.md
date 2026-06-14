# SaaS Fase 9A: Supabase Auth para superadmin_cliente

Esta guia prepara la transicion completa de los `superadmin_cliente` a Supabase Auth antes de activar RLS.

No activa RLS. No elimina `password_hash`. No cambia el login por `login_code` de coordinadores y subcoordinadores.

## Flujo actual esperado

Para usuarios admin de campania:

1. Si el usuario escribe un email, la app intenta login directo con Supabase Auth.
2. Si escribe un username, la app busca ese username en `usuarios_admin`, obtiene el email y luego usa Supabase Auth.
3. Si Supabase Auth acepta la credencial, la app busca el perfil en `usuarios_admin` por `auth_user_id`.
4. Si el perfil tiene `rol = superadmin_cliente`, entra por `/`.
5. Si el perfil tiene `rol = admin_general`, debe entrar por `/admin`.

El fallback temporal con `username + password_hash` sigue disponible para usuarios que aun no fueron vinculados a Supabase Auth.

## Crear un usuario Auth para superadmin_cliente

En Supabase de prueba:

1. Ir a **Authentication > Users**.
2. Crear el usuario con email y contrasena.
3. Abrir el usuario creado.
4. Copiar el **User UID**.
5. Vincular ese UID en `usuarios_admin.auth_user_id`.

No subir contrasenas al repositorio.

## Vincular un superadmin_cliente existente

Ejemplo:

```sql
update public.usuarios_admin
set
  auth_user_id = 'UID',
  email = 'cliente@dominio.com',
  username = 'cliente',
  rol = 'superadmin_cliente',
  activo = true
where username = 'USUARIO_EXISTENTE';
```

Tambien debe tener `campania_id` con la campania correcta:

```sql
update public.usuarios_admin
set campania_id = 'ID_DE_LA_CAMPANIA'
where username = 'cliente'
  and rol = 'superadmin_cliente';
```

## Crear un superadmin_cliente nuevo

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
  'UID',
  'ID_DE_LA_CAMPANIA',
  'superadmin_cliente',
  'Nombre',
  'Apellido',
  'cliente@dominio.com',
  'cliente',
  null,
  true
);
```

## Mensajes de error esperados

- Si el usuario Auth existe pero no tiene perfil en `usuarios_admin`, la app muestra un mensaje indicando que falta el perfil.
- Si el perfil existe pero esta inactivo, la app informa que el perfil esta inactivo.
- Si un `superadmin_cliente` intenta entrar por `/admin`, la app muestra que el acceso es solo para Admin General.
- Si el `admin_general` intenta entrar por `/`, la app indica que debe ingresar desde `/admin`.

## Admin General

El usuario `superadmin@sistema.electoral` es `admin_general`.

Debe quedar asi:

```text
rol = admin_general
campania_id = null
username = superadmin
email = superadmin@sistema.electoral
```

No debe tratarse como `superadmin_cliente` ni asociarse a una campania.

## Que falta antes de RLS

- Confirmar que cada `superadmin_cliente` tenga `auth_user_id`.
- Confirmar que cada `superadmin_cliente` tenga `campania_id`.
- Confirmar que `activo = true`.
- Probar ingreso por `/` usando email y usando username.
- Mantener `password_hash` solo como fallback temporal hasta Fase 9D.

RLS sigue desactivado en esta fase.
