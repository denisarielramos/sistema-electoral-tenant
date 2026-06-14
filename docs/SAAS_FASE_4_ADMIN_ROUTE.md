# SaaS Fase 4: Ruta Admin General

Esta fase separa el acceso de campaña del acceso de Admin General.

## Rutas

```text
/
```

Acceso normal de cliente/campaña.

Debe usarse para:

- `superadmin_cliente`
- `coordinador`
- `subcoordinador`

```text
/admin
```

Acceso exclusivo del `admin_general`.

Debe usarse para:

- `admin_general`

## Credencial Demo Admin General

```text
username: admin
password: admin123
```

Este usuario debe existir en `usuarios_admin`, cargado por:

```text
supabase/migrations/005_seed_admin_demo_login.sql
```

## Credencial Demo Cliente

```text
username: superdemo
password: demo123
```

Este usuario entra desde `/`, no desde `/admin`.

## Codigos Demo De Campaña

Estos accesos siguen funcionando desde `/`:

```text
COORD-DEMO
SUB-DEMO
```

## Comportamiento

- `/` muestra el login normal de campaña.
- `/admin` muestra el login exclusivo de Admin General.
- Si un `admin_general` intenta entrar desde `/`, se muestra: `El Admin General debe ingresar desde /admin`.
- Si un usuario de campaña intenta entrar desde `/admin`, se muestra: `Este acceso es solo para Admin General.`
- Si un `admin_general` ya está logueado y entra a `/admin`, ve `AdminGeneralDashboard`.
- Si un `superadmin_cliente`, coordinador o subcoordinador entra a `/`, ve el flujo normal.

## Vercel

Se agregó `vercel.json` con rewrites hacia `index.html` para que `/admin` no devuelva 404 al refrescar o abrir directo en Vercel.

## Seguridad

Esto sigue siendo demo.

No se implementó Supabase Auth, hashing real, RLS ni seguridad final. Antes de producción hay que migrar el login administrativo a un mecanismo seguro.
