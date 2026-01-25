# Deployment-Anleitung für VocabMaster

## Übersicht

Da Socket.io auf Vercel nicht funktioniert (Serverless Functions unterstützen keine persistenten WebSocket-Verbindungen), deployen wir:
- **Frontend**: Vercel
- **Backend**: Railway (unterstützt Socket.io)

## Schritt 1: Backend auf Railway deployen

### 1.1 Railway Account erstellen
1. Gehe zu [railway.app](https://railway.app)
2. Klicke auf "Start a New Project"
3. Melde dich mit GitHub an

### 1.2 Projekt deployen
1. Klicke auf "New Project"
2. Wähle "Deploy from GitHub repo"
3. Wähle dein Repository: `FLaMeWoRKz/Learnapp`
4. Wähle "Add Service" → "GitHub Repo"
5. Wähle den `backend/` Ordner als Root Directory:
   - In den Service Settings → "Root Directory" → `backend`

### 1.3 Environment Variables setzen
In Railway → Dein Service → Variables, füge hinzu:

```
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://deine-vercel-url.vercel.app
JWT_SECRET=dein-sicheres-secret-hier
JWT_EXPIRES_IN=24h
INSTANTDB_APP_ID=deine-instantdb-app-id
INSTANTDB_ADMIN_TOKEN=dein-instantdb-admin-token
STORAGE_MODE=instantdb
```

**Wichtig:**
- `JWT_SECRET`: Generiere ein starkes, zufälliges Secret (z.B. mit `openssl rand -base64 32`)
- `FRONTEND_URL`: Wird nach dem Vercel-Deployment aktualisiert
- `INSTANTDB_APP_ID` und `INSTANTDB_ADMIN_TOKEN`: Deine InstantDB-Credentials

### 1.4 Railway URL notieren
Nach dem Deployment erhältst du eine URL wie:
`https://vocabmaster-backend.railway.app`

**Notiere diese URL!** Du brauchst sie für das Frontend.

### 1.5 Vokabeln importieren
Nach dem ersten Deployment:
1. Gehe zu Railway → Dein Service → "Deploy Logs"
2. Klicke auf "Run Command"
3. Führe aus: `npm run import-vocab`

## Schritt 2: Frontend auf Vercel deployen

### 2.1 Vercel Account erstellen
1. Gehe zu [vercel.com](https://vercel.com)
2. Melde dich mit GitHub an

### 2.2 Projekt importieren
1. Klicke auf "Add New..." → "Project"
2. Wähle dein Repository: `FLaMeWoRKz/Learnapp`
3. Klicke auf "Import"

### 2.3 Build Settings konfigurieren
In den Project Settings:
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 2.4 Environment Variables setzen
In Vercel → Project Settings → Environment Variables, füge hinzu:

```
VITE_API_URL=https://deine-railway-backend-url.railway.app/api
VITE_SOCKET_URL=https://deine-railway-backend-url.railway.app
```

**Wichtig:** Ersetze `deine-railway-backend-url.railway.app` mit deiner tatsächlichen Railway-URL!

### 2.5 Deploy
1. Klicke auf "Deploy"
2. Warte bis der Build fertig ist
3. Notiere deine Vercel-URL (z.B. `https://learnapp.vercel.app`)

### 2.6 Backend FRONTEND_URL aktualisieren
1. Gehe zurück zu Railway
2. Aktualisiere die Variable `FRONTEND_URL` mit deiner Vercel-URL
3. Railway deployt automatisch neu

## Schritt 3: Prüfen

1. Öffne deine Vercel-URL im Browser
2. Teste die Anmeldung
3. Teste Singleplayer-Modus
4. Teste Multiplayer-Modus (Socket.io sollte funktionieren)

## Troubleshooting

### Frontend kann Backend nicht erreichen
- Prüfe ob `VITE_API_URL` und `VITE_SOCKET_URL` in Vercel korrekt gesetzt sind
- Prüfe ob die Railway-URL erreichbar ist
- Prüfe CORS-Einstellungen im Backend (`FRONTEND_URL`)

### Socket.io funktioniert nicht
- Stelle sicher, dass das Backend auf Railway läuft (nicht auf Vercel)
- Prüfe ob `VITE_SOCKET_URL` korrekt gesetzt ist
- Prüfe Browser-Konsole auf Fehler

### Backend-Fehler
- Prüfe Railway Logs: Service → "Deploy Logs"
- Prüfe ob alle Environment Variables gesetzt sind
- Prüfe ob InstantDB-Credentials korrekt sind

## Nützliche Links

- Railway Dashboard: https://railway.app/dashboard
- Vercel Dashboard: https://vercel.com/dashboard
- GitHub Repository: https://github.com/FLaMeWoRKz/Learnapp
