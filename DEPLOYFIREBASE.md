# Deploy a Firebase Hosting

## Ambientes

| Ambiente | Proyecto Firebase | Alias CLI | Rama | URL |
|---|---|---|---|---|
| Dev | `minisupercuriel-dev` | `dev` | `develop` | https://minisupercuriel-dev.web.app |
| Prod | `minisupercuriel-prod` | `prod` | `main` | https://minisupercuriel-prod.web.app |

> `mscurieldigital` y `minisupercurieldigital` son proyectos legacy y ya no se usan en este flujo.

Los alias están en `.firebaserc`. El `default` apunta a **dev** para que un
`firebase deploy` sin parámetros nunca toque producción.

## Configuración por ambiente

Vite carga el archivo según el modo (`--mode dev` o `--mode prod`):

- `.env.dev` / `.env.prod`: config pública de Firebase y `VITE_API_URL` (versionados).
- `.env.dev.local` / `.env.prod.local`: secretos y overrides locales (ignorados por git).

## Deploy (manual)

```
npm run deploy:dev     # build --mode dev  + deploy a minisupercuriel-dev
npm run deploy:prod    # build --mode prod + deploy a minisupercuriel-prod
```

Reglas del flujo:

1. `feat/*` → PR a `develop` → `npm run deploy:dev` desde `develop`.
2. Validado en dev → merge `develop` → `main` → `npm run deploy:prod` desde `main`.

## Desarrollo local

```
npm run dev        # servidor local contra Firebase dev
npm run dev:prod   # servidor local contra Firebase prod (usar con cuidado)
```

## Requisitos

- `firebase login` con una cuenta con acceso a ambos proyectos.
- Hosting habilitado en cada proyecto (Firebase Console → Build → Hosting → Get started).
- Verificar el proyecto activo: `firebase use`.

## Seguridad

La config web de Firebase no es secreta, pero cada API key debe restringirse por
referrer HTTP en Google Cloud Console → APIs & Services → Credentials
(dominios `*.web.app` / `*.firebaseapp.com` del ambiente y `localhost` en dev).
