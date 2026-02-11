# Mini Super Curiel - Tienda Digital (Cliente)

Aplicación web para clientes de Mini Super Curiel. Permite a los usuarios explorar productos, realizar pedidos y gestionar sus compras.

## 🚀 Tecnologías

- **React 19** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **React Router DOM** - Navegación
- **Axios** - Cliente HTTP
- **CSS Modules** - Estilos

## 📦 Instalación

```bash
npm install
```

## 🛠️ Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🏗️ Build para Producción

```bash
npm run build
```

## 📁 Estructura del Proyecto

```
mariam-store-client/
├── src/
│   ├── components/      # Componentes reutilizables
│   ├── contexts/        # Context API (Auth, etc.)
│   ├── config/          # Configuración (API, etc.)
│   ├── pages/           # Páginas/Views
│   ├── services/         # Servicios API
│   └── assets/          # Recursos estáticos
├── public/              # Archivos públicos
└── package.json
```

## 🔐 Autenticación

- Login: `/login`
- Registro: `/register`
- Rutas protegidas requieren autenticación

## 🌐 API

La aplicación se conecta a:
- Producción: `https://mariam-pos-web-api.onrender.com`
- Desarrollo: `http://localhost:4000` (configurable en `src/config/api.js`)

## 🖼️ Imágenes de Productos

La aplicación incluye un sistema de fallback para productos sin imágenes:
- **Prioridad 1:** Imágenes propias del producto
- **Prioridad 2:** Imagen de la categoría
- **Prioridad 3:** Imagen desde API externa (Pexels/Unsplash)
- **Prioridad 4:** Placeholder con nombre del producto

### Configurar API Key (Opcional)

Para mejores resultados con imágenes reales, puedes configurar una API key de Pexels:

1. Obtén tu API key en: https://www.pexels.com/api/
2. Crea un archivo `.env` en la raíz del proyecto
3. Agrega: `VITE_PEXELS_API_KEY=tu_api_key_aqui`

**Nota:** Si no configuras la API key, se usará un placeholder confiable con el nombre del producto. El servicio de Unsplash Source ha sido removido debido a problemas de disponibilidad (503 errors).

## 📝 Próximos Pasos

- [ ] Página de productos
- [ ] Carrito de compras
- [ ] Historial de pedidos
- [ ] Perfil de usuario
- [ ] Integración con Efectivo Express

