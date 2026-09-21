# Deploy a Firebase Hosting

Proyecto Firebase: `mscurieldigital` → https://mscurieldigital.web.app

## Deploy

```
cd mariam-store-client
npm run build
firebase deploy --only hosting
```

> El proyecto default está fijado en `.firebaserc` (`mscurieldigital`), así que no hace falta `--project`.
> Para verificar en qué proyecto estás: `firebase use`.
