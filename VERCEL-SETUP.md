# Vercel Setup - Wichtige Konfiguration

## Problem: 404 NOT_FOUND

Wenn du einen 404-Fehler bekommst, liegt das meist an falschen Build-Einstellungen in Vercel.

## Lösung: Vercel Project Settings korrekt konfigurieren

### Schritt 1: Gehe zu Vercel Project Settings

1. Öffne dein Projekt auf [vercel.com](https://vercel.com)
2. Gehe zu **Settings** → **General**

### Schritt 2: Root Directory setzen

1. Scrolle zu **Root Directory**
2. Klicke auf **Edit**
3. Setze: `frontend`
4. Klicke auf **Save**

### Schritt 3: Build & Development Settings

Gehe zu **Settings** → **Build & Development Settings**:

- **Framework Preset**: `Vite` (oder `Other`)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Schritt 4: Environment Variables

Gehe zu **Settings** → **Environment Variables**:

Füge hinzu (ersetze mit deiner Railway-URL):
```
VITE_API_URL=https://deine-railway-url.railway.app/api
VITE_SOCKET_URL=https://deine-railway-url.railway.app
```

### Schritt 5: Neu deployen

1. Gehe zu **Deployments**
2. Klicke auf die drei Punkte (⋯) beim letzten Deployment
3. Wähle **Redeploy**

## Alternative: vercel.json im frontend-Ordner

Falls das nicht funktioniert, kannst du auch eine `vercel.json` direkt im `frontend/` Ordner erstellen:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Dann setze in Vercel:
- **Root Directory**: `frontend`
- Die vercel.json im frontend-Ordner wird automatisch verwendet

## Prüfen

Nach dem Redeploy sollte:
- Die Startseite laden (kein 404)
- Die React-App funktionieren
- Keine Build-Fehler in den Logs sein
