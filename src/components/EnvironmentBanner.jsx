import { useEffect } from 'react';
import './EnvironmentBanner.css';

const APP_ENV = import.meta.env.VITE_APP_ENV;
const TITLE_PREFIX = '[DEV] ';

// Indicador discreto de ambiente de pruebas.
// Solo se muestra cuando VITE_APP_ENV=dev (ver .env.dev); en prod no renderiza nada.
export default function EnvironmentBanner() {
  const isDev = APP_ENV === 'dev';

  useEffect(() => {
    if (!isDev || document.title.startsWith(TITLE_PREFIX)) return;
    document.title = `${TITLE_PREFIX}${document.title}`;
  }, [isDev]);

  if (!isDev) return null;

  return (
    <div className="env-banner" role="status">
      <span className="env-banner__badge">DEV</span>
      <span className="env-banner__text">Ambiente de pruebas</span>
    </div>
  );
}
