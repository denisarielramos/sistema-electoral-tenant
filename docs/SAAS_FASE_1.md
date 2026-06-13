# SaaS Fase 1

Esta fase agrega la base minima para empezar a convertir el sistema electoral en una plataforma multi-cliente y multi-campania sin cambiar todavia la logica principal de la aplicacion.

## Archivos SQL

Ejecutar en este orden sobre un proyecto nuevo de Supabase de prueba:

1. `supabase/migrations/001_saas_base.sql`
2. `supabase/migrations/002_seed_saas_demo.sql`

No ejecutar estos scripts sobre Supabase productivo hasta revisar y adaptar el plan de migracion final.

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
4. Pegar el contenido de `supabase/migrations/001_saas_base.sql`.
5. Ejecutar el query.
6. Crear otro query nuevo.
7. Pegar el contenido de `supabase/migrations/002_seed_saas_demo.sql`.
8. Ejecutar el query.

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

## Que falta para Fase 2

- Crear `CampaignContext`.
- Crear `campaniaService`.
- Leer campania activa.
- Leer modulos habilitados.
- Agregar helper `hasModule("vista_seccional")`.
- Empezar a propagar `campania_id` en consultas.
- Separar cache IndexedDB por campania.
- Definir la estrategia final de login y permisos antes de activar RLS.
