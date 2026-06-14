# SaaS Fase 6: Aislamiento Por Campania

Esta fase hace que la app de campania lea y escriba datos usando `campania_id`.

## Que Se Filtro

- `padron`: carga solo registros de la campania del usuario logueado.
- `coordinadores`: SELECT/INSERT/UPDATE/DELETE usan `campania_id`.
- `subcoordinadores`: SELECT/INSERT/UPDATE/DELETE usan `campania_id`.
- `votantes`: SELECT/INSERT/UPDATE/DELETE usan `campania_id`.
- `CampaignContext`: si el usuario tiene `campania_id`, carga esa campania por id y sus modulos.
- `IndexedDB`: el cache del padron queda separado por campania con bases tipo `padronDB_<campania_id>`.

`/admin` no queda limitado por campania y sigue viendo todos los tenants, campanias, modulos y usuarios.

## Como Probar Con Dos Campanias

Ejecutar en Supabase de prueba:

```text
supabase/migrations/006_seed_second_demo_campaign.sql
```

Credenciales de la campania original:

```text
username: superdemo
password: demo123
campania: Campania Demo
```

Credenciales de la segunda campania:

```text
username: sanlorenzo
password: demo123
campania: Campania Demo San Lorenzo
```

Prueba esperada:

1. Entrar en `/` con `superdemo/demo123`.
2. Ver solo padron, coordinadores, subcoordinadores y votantes de `Campania Demo`.
3. Cerrar sesion.
4. Entrar en `/` con `sanlorenzo/demo123`.
5. Ver solo datos ficticios de `Campania Demo San Lorenzo`.
6. Entrar en `/admin` con `admin/admin123`.
7. Confirmar que Admin General sigue viendo ambas campanias.

## Datos Demo De La Segunda Campania

- Tenant: `Cliente Demo San Lorenzo`
- Campania: `Campania Demo San Lorenzo`
- Superadmin: `sanlorenzo/demo123`
- Coordinador demo: `COORD-SL`
- Subcoordinador demo: `SUB-SL`
- Padron ficticio: CIs `9100001` a `9100006`

## Importante

Esta fase no activa RLS y no implementa seguridad final. El aislamiento se hace desde la app cliente.

Tambien queda una deuda de modelo de datos: las tablas actuales usan `ci` como primary key. Eso impide reutilizar la misma CI en dos campanias. Para produccion conviene migrar a una de estas alternativas:

- primary key compuesta `(campania_id, ci)`, o
- columna `id uuid primary key` y unique `(campania_id, ci)`.

## Falta Para Produccion

- Supabase Auth para usuarios admin y usuarios de campania.
- Hashing real o auth gestionada; no guardar passwords en texto plano.
- RLS por `campania_id`.
- Politicas por rol (`admin_general`, `superadmin_cliente`, `coordinador`, `subcoordinador`).
- Migracion de claves para permitir la misma CI en multiples campanias.
