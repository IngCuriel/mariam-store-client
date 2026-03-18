# Ver productos más buscados y más vistos en Google Analytics 4

La app envía a GA4 estos eventos:

| Evento       | Cuándo se envía        | Uso en GA4                          |
|-------------|-------------------------|-------------------------------------|
| `search`    | Usuario busca productos | Términos más buscados               |
| `view_item` | Usuario abre un producto| Productos más vistos                |

## Dónde verlos en GA4

### 1. Productos más buscados (términos de búsqueda)

1. Entra en [analytics.google.com](https://analytics.google.com) y elige la propiedad con ID **G-3NKXHSWK3T**.
2. Menú izquierdo: **Informes** → **Participación** → **Eventos**.
3. Busca el evento **`search`** en la tabla.
4. Haz clic en el nombre del evento para ver los **parámetros**.
5. El parámetro **`search_term`** contiene el texto que buscó el usuario.  
   Puedes ordenar o filtrar por ese parámetro para ver los términos más usados.

**Para un informe solo de búsquedas:**

- Menú: **Explorar** (Explore) → **Exploración libre**.
- Dimensiones: añade **Nombre del evento** (filtrar por `search`) y **Parámetro de evento** → `search_term` (si GA4 lo muestra como dimensión; si no, usa el desglose por parámetros del evento `search` en Informes → Eventos).

### 2. Productos más vistos

1. **Informes** → **Participación** → **Eventos**.
2. Busca el evento **`view_item`**.
3. Al hacer clic en `view_item` verás el desglose por **parámetros**.  
   Los más útiles son:
   - **`item_id`**: ID del producto.
   - **`item_name`**: nombre del producto (si se envía).

Para ver “ranking” de productos por vistas:

- **Explorar** → **Exploración libre**.
- Métrica: **Número de eventos** (o “Conteo de eventos”).
- Filtro: **Nombre del evento** = `view_item`.
- Dimensiones: usa el parámetro **item_id** o **item_name** como dimensión (si GA4 los ofrece en ese informe).

### 3. Crear dimensiones personalizadas (opcional)

Para que `search_term` e `item_id` / `item_name` aparezcan siempre en informes y exploraciones:

1. **Admin** (engranaje) → **Personalización definida por eventos** (o **Definiciones personalizadas**).
2. Crear **Parámetro de evento personalizado**:
   - **search_term**: evento `search`, parámetro `search_term`.
   - **item_id**: evento `view_item`, parámetro `item_id` (o el que GA4 asocie al ítem).
3. Guardar. En 24–48 h podrás usar estas dimensiones en informes y exploraciones para “más buscados” y “más vistos”.

## Resumen

- **Más buscados**: Evento `search` → parámetro `search_term` en **Informes → Participación → Eventos** (y en Exploración libre).
- **Más vistos**: Evento `view_item` → parámetros `item_id` / `item_name` en el mismo apartado de eventos y en exploraciones.

Los datos pueden tardar unas horas en aparecer después de las primeras búsquedas y vistas.
