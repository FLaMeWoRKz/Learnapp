# Railway Setup - Schritt für Schritt

## Was ist Railway?
Railway ist ein Hosting-Anbieter für Backend-Services. Es ist kostenlos für kleine Projekte und unterstützt WebSockets (die für deinen Multiplayer-Modus benötigt werden).

## Schritt 1: Railway Account erstellen

1. Gehe zu [railway.app](https://railway.app)
2. Klicke auf **"Start a New Project"**
3. Melde dich mit **GitHub** an (wähle deinen GitHub-Account)

## Schritt 2: Projekt deployen

1. Klicke auf **"New Project"**
2. Wähle **"Deploy from GitHub repo"**
3. Wähle dein Repository: `FLaMeWoRKz/Learnapp`
4. Railway erstellt automatisch einen Service

## Schritt 3: Root Directory setzen

1. Klicke auf deinen Service
2. Gehe zu **Settings** (Zahnrad-Symbol)
3. Scrolle zu **"Root Directory"**
4. Setze: `backend`
5. Klicke auf **"Save"**

## Schritt 4: Environment Variables setzen

Gehe zu **Variables** Tab und füge hinzu:

### Basis-Konfiguration:
```
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://deine-vercel-url.vercel.app
```

**Wichtig:** Ersetze `deine-vercel-url.vercel.app` mit deiner tatsächlichen Vercel-URL!

### JWT Secret generieren:
Du musst ein sicheres JWT Secret erstellen. Öffne PowerShell und führe aus:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Dann füge hinzu:
```
JWT_SECRET=dein-generiertes-secret-hier
JWT_EXPIRES_IN=24h
```

### InstantDB (für Datenbank):
Falls du InstantDB bereits hast, füge hinzu:
```
INSTANTDB_APP_ID=deine-app-id
INSTANTDB_ADMIN_TOKEN=dein-admin-token
STORAGE_MODE=instantdb
```

Falls nicht, verwende lokalen Speicher (für den Anfang):
```
STORAGE_MODE=local
```

## Schritt 5: Deployment abwarten

1. Railway deployt automatisch nach dem Setzen des Root Directories
2. Warte bis der Build fertig ist (grüner Haken)
3. Klicke auf **"Settings"** → **"Generate Domain"** um eine URL zu bekommen
4. Notiere diese URL! (z.B. `https://vocabmaster-backend.railway.app`)

## Schritt 6: Vercel Environment Variables setzen

Jetzt gehst du zurück zu Vercel:

1. Gehe zu deinem Vercel-Projekt → **Settings** → **Environment Variables**
2. Füge hinzu:
   - **Name:** `VITE_API_URL`
     **Wert:** `https://deine-railway-url.railway.app/api`
   - **Name:** `VITE_SOCKET_URL`
     **Wert:** `https://deine-railway-url.railway.app`
3. Wähle alle Environments (Production, Preview, Development)
4. Klicke auf **Save**

## Schritt 7: Vercel neu deployen

1. Gehe zu **Deployments**
2. Klicke auf die drei Punkte (⋯) beim letzten Deployment
3. Wähle **Redeploy**

## Schritt 8: Testen

1. Öffne deine Vercel-URL
2. Versuche dich zu registrieren
3. Es sollte jetzt funktionieren! 🎉

## Troubleshooting

### Backend startet nicht
- Prüfe die Railway Logs: Service → **"Deploy Logs"**
- Prüfe ob alle Environment Variables gesetzt sind
- Prüfe ob `PORT=3000` gesetzt ist

### Frontend kann Backend nicht erreichen
- Prüfe ob `VITE_API_URL` in Vercel korrekt gesetzt ist
- Prüfe ob die Railway-URL erreichbar ist (öffne im Browser)
- Prüfe CORS: `FRONTEND_URL` in Railway muss deine Vercel-URL sein

### Socket.io funktioniert nicht
- Prüfe ob `VITE_SOCKET_URL` in Vercel gesetzt ist
- Prüfe Browser-Konsole auf Fehler
- Stelle sicher, dass Railway-URL mit `https://` beginnt

## Kosten

Railway hat einen **kostenlosen Plan** mit:
- $5 kostenloses Guthaben pro Monat
- Genug für kleine Projekte
- Automatisches Sleep nach Inaktivität (wacht bei Anfrage auf)

Für größere Projekte gibt es bezahlte Pläne.
