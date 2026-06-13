# SaaS Fase 1

Esta fase agrega la base minima para empezar a convertir el sistema electoral en una plataforma multi-cliente y multi-campania sin cambiar todavia la logica principal de la aplicacion.

## Archivos SQL

Para un proyecto nuevo de Supabase vacio, ejecutar en este orden:

1. `supabase/migrations/000_current_base_schema.sql`
2. `supabase/migrations/000_seed_demo_base.sql` si queres datos demo ficticios
3. `supabase/migrations/001_saas_base.sql`
4. `supabase/migrations/002_seed_saas_demo.sql`
5. `supabase/migrations/004_assign_demo_campaign.sql` si hay registros con `campania_id` null
6. `supabase/migrations/003_verify_saas_fase_1.sql` para verificar

No ejecutar estos scripts sobre Supabase productivo hasta revisar y adaptar el plan de migracion final.

## Tablas base actuales

`000_current_base_schema.sql` crea las tablas minimas que la app actual espera encontrar:

- `padron`
- `coordinadores`
- `subcoordinadores`
- `votantes`

Tambien crea indices basicos por `ci`, `login_code`, `coordinador_ci` y `asignado_por`.

Este script existe para Supabase de prueba vacio. No activa RLS y no cambia la app.

## Datos demo base

`000_seed_demo_base.sql` carga datos ficticios para probar el flujo actual:

- 6 personas inventadas en `padron`
- 1 coordinador con `login_code = COORD-DEMO`
- 1 subcoordinador con `login_code = SUB-DEMO`
- 4 votantes ficticios

No contiene datos reales.

## Tablas agregadas

### tenants

Representa al cliente u organizacion dueña de una o varias campanias.

Campos principales:

- `id`
- `nombre`
- `estado`
- `created_at`

### campanias

Representa una campania electoral concreta asociada a un tenant.

Campos principales:

- `tenant_id`
- `nombre`
- `candidato_nombre`
- `cargo`
- `anio`
- `partido`
- `lista`
- `opcion`
- `fecha_eleccion`
- `logo_url`
- `flyer_url`
- `color_primario`
- `color_secundario`
- `activa`

### modulos

Catalogo global de funcionalidades disponibles en la plataforma.

Modulos iniciales:

- `vista_seccional`
- `invitaciones_whatsapp`
- `pdf`
- `exportar_excel`
- `dashboard_bi`
- `gestion_coordinadores`
- `gestion_votantes`

### campania_modulos

Relaciona una campania con los modulos habilitados para esa campania.

Ejemplo:

```text
campania_id + modulo + habilitado
```

### usuarios_admin

Base inicial para usuarios administrativos.

Roles previstos:

- `admin_general`: administra toda la plataforma.
- `superadmin_cliente`: administra una campania concreta.

En esta fase `auth_user_id` y `password_hash` quedan preparados, pero el login actual todavia no se migra.

## Tablas actuales adaptadas

El script agrega `campania_id` nullable a:

- `padron`
- `coordinadores`
- `subcoordinadores`
- `votantes`

La columna queda nullable para no romper cargas, importaciones ni la app actual.

Tambien se agregan indices:

- `padron(campania_id)`
- `padron(campania_id, ci)`
- `coordinadores(campania_id)`
- `coordinadores(campania_id, ci)`
- `coordinadores(campania_id, login_code)`
- `subcoordinadores(campania_id)`
- `subcoordinadores(campania_id, ci)`
- `subcoordinadores(campania_id, login_code)`
- `votantes(campania_id)`
- `votantes(campania_id, ci)`

## Como ejecutar en Supabase de prueba

Opcion recomendada desde el SQL Editor:

1. Abrir el proyecto nuevo de Supabase de prueba.
2. Ir a `SQL Editor`.
3. Crear un query nuevo.
4. Pegar y ejecutar `supabase/migrations/000_current_base_schema.sql`.
5. Si queres datos demo, pegar y ejecutar `supabase/migrations/000_seed_demo_base.sql`.
6. Pegar y ejecutar `supabase/migrations/001_saas_base.sql`.
7. Pegar y ejecutar `supabase/migrations/002_seed_saas_demo.sql`.
8. Si hay datos con `campania_id` null, pegar y ejecutar `supabase/migrations/004_assign_demo_campaign.sql`.
9. Pegar y ejecutar `supabase/migrations/003_verify_saas_fase_1.sql`.

La campania demo usa este UUID fijo:

```text
22222222-2222-2222-2222-222222222222
```

Si se usa Supabase CLI:

```bash
supabase db reset
```

O aplicar los scripts manualmente contra la base de prueba, respetando el mismo orden.

## Que NO se hizo todavia

- No se cambio el login actual.
- No se integro Supabase Auth.
- No se activo RLS.
- No se cambio la logica del Dashboard.
- No se filtran queries por `campania_id` todavia.
- No se cambio el cache IndexedDB.
- No se cambio branding dinamico en UI ni PDF.
- No se creo un panel de admin general.
- No se importo automaticamente el padron a una campania.
- No se cargaron datos reales.

## Que falta para Fase 2

- Crear `CampaignContext`.
- Crear `campaniaService`.
- Leer campania activa.
- Leer modulos habilitados.
- Agregar helper `hasModule("vista_seccional")`.
- Empezar a propagar `campania_id` en consultas.
- Separar cache IndexedDB por campania.
- Definir la estrategia final de login y permisos antes de activar RLS.
