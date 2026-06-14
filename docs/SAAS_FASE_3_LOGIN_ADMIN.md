# SaaS Fase 3: Login Admin Basico

Esta fase agrega un login demo para `usuarios_admin` y una primera vista readonly para `admin_general`.

## Usuarios Demo

Ejecutar antes:

```text
supabase/migrations/005_seed_admin_demo_login.sql
```

Credenciales demo:

```text
admin_general
username: admin
password: admin123
```

```text
superadmin_cliente
username: superdemo
password: demo123
```

## Que Se Implemento

- Login por `usuarios_admin.username`.
- Validacion simple contra `usuarios_admin.password_hash`.
- `admin_general` entra a `AdminGeneralDashboard`.
- `superadmin_cliente` entra al Dashboard actual como superadmin de la campaña asignada.
- Se mantiene el login actual por `login_code` para coordinadores y subcoordinadores.
- Se mantiene `localStorage.currentUser` agregando campos SaaS:
  - `role`
  - `rol`
  - `username`
  - `nombre`
  - `campania_id`
  - `esAdminGeneral`
  - `esSuperadminCliente`

## Panel Admin General

La vista `AdminGeneralDashboard` muestra en modo solo lectura:

- tenants
- campañas
- módulos habilitados por campaña
- usuarios admin existentes

No crea, edita ni elimina datos todavía.

## Importante Sobre Seguridad

Esta fase NO es seguridad final.

`password_hash` se usa como texto simple solo para pruebas locales/demo. Antes de producción hay que migrar a:

- Supabase Auth, o
- hashing real del lado servidor, o
- una capa backend segura con políticas adecuadas.

Tambien falta activar y diseñar RLS antes de usar datos reales.

## Que NO Se Hizo

- No se activo RLS.
- No se cambio el login de coordinadores/subcoordinadores.
- No se implemento panel CRUD de tenants/campañas.
- No se implementaron pagos.
- No se filtro todo el Dashboard por `campania_id`.
- No se cambio Supabase productivo.
- No se cargaron datos reales.

## Proxima Fase Sugerida

- Filtrar lecturas principales por `campania_id`.
- Asociar `CampaignContext` al `campania_id` del usuario logueado.
- Preparar cambio a Supabase Auth.
- Agregar CRUD inicial para crear campañas y habilitar módulos.
