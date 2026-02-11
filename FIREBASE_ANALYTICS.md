# Firebase Analytics - Guía de Uso

Este proyecto está configurado con Firebase Analytics para rastrear eventos y comportamientos de los usuarios.

## Configuración

Firebase Analytics se inicializa automáticamente al cargar la aplicación en `src/main.jsx`. La configuración se encuentra en `src/config/firebase.js`.

## Uso del Hook `useAnalytics`

El hook `useAnalytics` proporciona funciones útiles para registrar eventos en Analytics:

```javascript
import { useAnalytics } from '../hooks/useAnalytics';

function MyComponent() {
  const { logAnalyticsEvent, logLogin, logSignUp, logPageView } = useAnalytics();

  // Registrar un evento personalizado
  logAnalyticsEvent('custom_event', {
    custom_parameter: 'value'
  });

  // Registrar login
  logLogin('email');

  // Registrar registro de usuario
  logSignUp('email');

  // Registrar vista de página
  logPageView('Nombre de la Página', '/ruta');
}
```

## Eventos Predefinidos

### Eventos de Autenticación
- `logLogin(method)` - Registra cuando un usuario inicia sesión
- `logSignUp(method)` - Registra cuando un usuario se registra

### Eventos de Cash Express
- `logCashExpressRequest(amount)` - Registra cuando se crea una solicitud de Cash Express
- `logDepositReceiptUpload(requestId)` - Registra cuando se sube un comprobante
- `logCashExpressCompleted(requestId, status)` - Registra cuando se completa una solicitud

### Eventos Generales
- `logPageView(pageName, pagePath)` - Registra vistas de página
- `logAnalyticsEvent(eventName, eventParams)` - Registra cualquier evento personalizado

## Rastreo Automático de Vistas de Página

El componente `AnalyticsPageView` rastrea automáticamente todas las vistas de página cuando el usuario navega. Está integrado en `App.jsx` y no requiere configuración adicional.

## Eventos Actualmente Rastreados

1. **Login** - Cuando un usuario inicia sesión (`Login.jsx`)
2. **Registro** - Cuando un usuario se registra (`Register.jsx`)
3. **Vistas de Página** - Automáticamente en todas las rutas (`AnalyticsPageView.jsx`)
4. **Creación de Solicitud Cash Express** - Cuando se crea una solicitud (`CashExpress.jsx`)

## Agregar Nuevos Eventos

Para agregar tracking a un nuevo componente:

1. Importa el hook:
```javascript
import { useAnalytics } from '../hooks/useAnalytics';
```

2. Usa el hook en tu componente:
```javascript
const { logAnalyticsEvent } = useAnalytics();
```

3. Registra el evento cuando sea necesario:
```javascript
logAnalyticsEvent('mi_evento', {
  parametro1: 'valor1',
  parametro2: 'valor2'
});
```

## Ver Datos en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto "minisupercurieldigital"
3. Navega a Analytics > Events para ver todos los eventos registrados
4. Navega a Analytics > Dashboard para ver métricas generales

## Notas Importantes

- Analytics solo funciona en entornos de navegador (no en SSR)
- Los eventos se registran de forma asíncrona y pueden tardar unos minutos en aparecer en la consola
- Firebase Analytics respeta la privacidad y no rastrea información personal identificable (PII) sin consentimiento

