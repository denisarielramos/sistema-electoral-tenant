# SaaS Fase 7: CI Unica Por Campania

Esta fase prepara el modelo para SaaS real corrigiendo el problema de usar `ci` como primary key global.

## Por Que Cambiar

En una plataforma multi-campania, una misma persona puede aparecer en mas de una campania. Si `ci` es primary key global, la base impide insertar esa CI en otra campania aunque corresponda a otro cliente/campania.

La CI debe seguir siendo el identificador visible de la persona, pero la identidad tecnica del registro debe ser propia de cada fila.

## Nuevo Modelo

Tablas ajustadas:

- `padron`
- `coordinadores`
- `subcoordinadores`
- `votantes`

Cada tabla queda con:

```text
id uuid primary key default gen_random_uuid()
campania_id uuid not null
ci bigint not null
```

La unicidad pasa a ser por campania:

```text
unique (campania_id, ci)
```

Esto permite:

- misma CI en campanias distintas
- CI unica dentro de una misma campania
- UI y logica visible siguen usando `ci`
- updates/deletes siguen filtrando por `campania_id + ci`

## Foreign Keys

Las foreign keys antiguas basadas solo en `ci` se reemplazan por relaciones compuestas:

- `coordinadores(campania_id, ci)` -> `padron(campania_id, ci)`
- `subcoordinadores(campania_id, ci)` -> `padron(campania_id, ci)`
- `subcoordinadores(campania_id, coordinador_ci)` -> `coordinadores(campania_id, ci)`
- `votantes(campania_id, ci)` -> `padron(campania_id, ci)`
- `votantes(campania_id, coordinador_ci)` -> `coordinadores(campania_id, ci)`

## Como Ejecutar

En Supabase de prueba, ejecutar:

```text
supabase/migrations/007_fix_campaign_scoped_ci_keys.sql
```

Antes de ejecutar, todos los registros existentes de estas tablas deben tener `campania_id`:

- `padron`
- `coordinadores`
- `subcoordinadores`
- `votantes`

Si hay registros sin `campania_id`, ejecutar primero:

```text
supabase/migrations/004_assign_demo_campaign.sql
```

## Como Probar Misma CI En Dos Campanias

Ejemplo de prueba con una CI ficticia:

```sql
insert into public.padron (
  campania_id,
  ci,
  nombre,
  apellido
)
values
  ('22222222-2222-2222-2222-222222222222', 9991234, 'Persona', 'Demo Uno'),
  ('77777777-7777-7777-7777-777777777777', 9991234, 'Persona', 'Demo Dos');
```

Resultado esperado:

- ambos inserts pasan porque son campanias distintas
- repetir la misma `ci` dentro de la misma `campania_id` falla por `unique(campania_id, ci)`

## Impacto En Frontend

El frontend no necesita mostrar ni usar `id` todavia.

La app sigue trabajando con `ci`, pero las operaciones sensibles deben filtrar siempre por:

```text
campania_id + ci
```

Esto ya quedo preparado en la fase de aislamiento por `campania_id`.

## Importante

Esta fase no activa RLS y no implementa Supabase Auth.

Para produccion todavia falta:

- RLS por `campania_id`
- Supabase Auth o backend seguro
- hashing real de credenciales
- politicas por rol
- revisar seeds antiguos que usen `on conflict (ci)` si se vuelven a ejecutar despues de esta migracion
