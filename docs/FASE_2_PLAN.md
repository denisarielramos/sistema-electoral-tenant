# Fase 2 Plan

La Fase 2 debe conectar la aplicacion actual con la base SaaS creada en Fase 1, sin convertir todo el sistema de golpe.

## Objetivo

Introducir contexto de campania y modulos habilitados para que la app empiece a comportarse como multi-campania, manteniendo la experiencia actual estable.

## Paso 1: CampaignContext

Crear un contexto React para exponer:

- `campaniaActiva`
- `tenant`
- `modulos`
- `loadingCampania`
- `hasModule(modulo)`

Este contexto deberia envolver `Dashboard` y, mas adelante, tambien el login.

## Paso 2: campaniaService

Crear un servicio centralizado para leer:

- campania por `id`
- tenant asociado
- modulos habilitados de la campania
- configuracion visual de campania

Funciones sugeridas:

```js
getCampaniaById(campaniaId)
getCampaniaModulos(campaniaId)
getCampaniaBootstrap(campaniaId)
```

## Paso 3: lectura de campania activa

Para no cambiar todo el login todavia, usar una estrategia temporal:

- `VITE_DEFAULT_CAMPANIA_ID` solo en entorno de prueba, o
- una constante local de desarrollo, o
- tomar la primera campania activa del seed demo.

La opcion final deberia depender del login del usuario, pero eso corresponde a una fase posterior.

## Paso 4: helper hasModule

Implementar:

```js
hasModule("vista_seccional")
hasModule("pdf")
hasModule("exportar_excel")
```

Uso esperado:

- ocultar boton PDF si `pdf` esta deshabilitado
- ocultar futuras exportaciones si `exportar_excel` esta deshabilitado
- controlar vistas futuras como `vista_seccional`

## Paso 5: empezar a filtrar por campania_id

Modificar servicios de datos de forma gradual:

- primero `cargarEstructuraCompleta`
- luego inserts
- luego updates
- luego deletes

Cada query deberia incluir `campania_id` cuando la tabla lo tenga disponible.

Ejemplo:

```js
supabase
  .from("coordinadores")
  .select("*")
  .eq("campania_id", campaniaId)
```

## Paso 6: separar cache IndexedDB por campania

El cache actual usa un nombre unico:

```js
padronDB
```

Debe pasar a ser separado por campania:

```js
padronDB_${campaniaId}
```

Esto evita mezclar padrones de clientes distintos en el navegador.

## Paso 7: mantener limites claros

En Fase 2 todavia no conviene:

- reescribir todo `Dashboard.jsx`
- activar RLS
- migrar todo el login
- crear panel admin general completo
- rediseñar UI

La meta es que la app conozca la campania activa y pueda leer su configuracion, no terminar todo el SaaS.
