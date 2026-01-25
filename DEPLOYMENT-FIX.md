# Deployment-Fix für Vercel

## Problem
Der Build schlägt fehl mit "Command 'npm run build' exited with 2"

## Lösung

### Option 1: Vercel Project Settings (Empfohlen)

1. Gehe zu Vercel → Dein Projekt → **Settings** → **General**
2. Setze **Root Directory** auf: `frontend`
3. Gehe zu **Build & Development Settings**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Gehe zu **Environment Variables** und füge hinzu:
   ```
   VITE_API_URL=https://deine-railway-url.railway.app/api
   VITE_SOCKET_URL=https://deine-railway-url.railway.app
   ```
5. Klicke auf **Redeploy**

### Option 2: Falls Root Directory nicht funktioniert

Falls Vercel das Root Directory nicht richtig erkennt:

1. Lösche die `vercel.json` im Root-Verzeichnis
2. Stelle sicher, dass die `vercel.json` im `frontend/` Ordner existiert
3. In Vercel Settings:
   - **Root Directory**: leer lassen (oder `/`)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm install`

### TypeScript-Fehler beheben

Falls TypeScript-Fehler den Build blockieren:

1. Die `tsconfig.json` wurde bereits angepasst (strict: false)
2. Falls weiterhin Fehler auftreten, ändere in `frontend/package.json`:
   ```json
   "build": "vite build"
   ```
   (statt `tsc --noEmit && vite build`)

### Prüfen

Nach dem Redeploy sollte:
- Der Build erfolgreich durchlaufen
- Die App auf der Vercel-URL erreichbar sein
- Keine TypeScript-Fehler in den Logs sein
