# SaaS Fase 8: Importacion CSV De Padron

Esta fase agrega importacion de padron por campania desde `/admin`.

## Formato CSV

El archivo debe incluir estas columnas requeridas:

```csv
ci,nombre,apellido,local_votacion,seccional,mesa,orden,direccion
```

`localidad` es opcional. Si no existe, se guarda como `null`.

`created_at` no es requerido. Si existe en el CSV, el importador lo ignora para que Supabase use el valor default.

Tambien se acepta este formato real:

```csv
ci,nombre,apellido,seccional,local_votacion,mesa,orden,direccion,created_at
```

Ejemplo seguro incluido en el repo:

```text
public/demo-padron.csv
```

Ese archivo contiene solo datos ficticios.

## Como Importar

1. Entrar a `/admin` con `admin/admin123`.
2. Ir a la seccion `Importar padron por campania`.
3. Seleccionar la campania destino.
4. Seleccionar un archivo `.csv`.
5. Presionar `Previsualizar`.
6. Revisar las primeras 10 filas y la cantidad total.
7. Presionar `Importar`.

La importacion agrega automaticamente `campania_id` a cada registro y procesa en lotes de 500 filas.

Las filas con CI invalida se saltan y se reportan como errores/saltadas. No se imprime el padron completo en consola.

## Upsert

La importacion usa la unicidad:

```text
unique(campania_id, ci)
```

Por eso:

- si la CI no existe en esa campania, se inserta
- si la CI ya existe en esa campania, se actualiza
- la misma CI puede existir en otra campania

## No Subir Padrones Reales

No subir archivos reales de padron al repositorio.

El repo solo debe incluir archivos demo o anonimizados. Si se trabaja con datos reales localmente, usar archivos ignorados por Git y mantenerlos fuera de `public/`.

## Falta Para Produccion

- RLS por `campania_id`.
- Supabase Auth o backend seguro.
- Auditoria de importaciones.
- Validacion mas estricta de tipos y duplicados.
- Importacion Excel si se necesita.
- Manejo de archivos grandes por lotes desde backend.
