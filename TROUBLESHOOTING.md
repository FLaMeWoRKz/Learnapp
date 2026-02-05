# VocabMaster – Troubleshooting

## Lokal starten und testen

### Projekt lokal starten

**Option 1 – Alles auf einmal (empfohlen):**
```powershell
.\start-local.ps1
```
- Backend: Port 3000 (Storage: local)
- Frontend: Port 5173

**Option 2 – Backend und Frontend getrennt:**
```powershell
# Terminal 1 – Backend
cd backend
$env:STORAGE_MODE='local'
npm run dev

# Terminal 2 – Frontend
cd frontend
npm run dev
```

### Zugriff

| URL | Beschreibung |
|-----|--------------|
| http://localhost:5173 | Frontend (Startseite) |
| http://localhost:3000/api/health | Backend-Health-Check |

### API testen

```powershell
cd backend
npm test
```
(Vorraussetzung: Backend läuft, `STORAGE_MODE=local`)

---

## 404 bei Reload oder Browser-Back

### Ursache

Bei SPAs werden Routen wie `/singleplayer` oder `/multiplayer` nur im Browser gehalten. Bei Reload oder Zurück schickt der Browser einen echten HTTP-Request – der Server muss dann `index.html` liefern, damit React die Route übernehmen kann.

### Lösung

- **Vite Dev** (`npm run dev`): SPA-Fallback ist eingebaut, Reload sollte funktionieren.
- **Vite Preview** (`npm run preview`): Auch mit SPA-Fallback.
- **Docker/Nginx**: `try_files $uri $uri/ /index.html` ist in `frontend/nginx.conf` gesetzt.
- **Vercel**: `rewrites` in `vercel.json` leiten alle Routen auf `/index.html` um.

Falls 404 bleibt:

1. Stelle sicher, dass du `npm run dev` (Vite) verwendest, nicht einen einfachen Static-Server.
2. Bei Vercel: Root Directory auf `frontend` setzen, falls du aus dem Root deployest.
3. Bei eigenem Hosting: Konfiguration analog zu `nginx.conf` anpassen (z.B. Apache `.htaccess` mit `FallbackResource /index.html`).

---

## Kurzes Aufblitzen der vorherigen Ansicht beim Klicken

### Ursache

- **React StrictMode** (nur in Entwicklung): Führt bewusst doppeltes Mounten/Unmounten aus und kann kurze Übergangseffekte verursachen.
- In der **Production-Build** tritt dieses Verhalten typischerweise nicht auf.

### Prüfen

```powershell
cd frontend
npm run build
npm run preview
```
Dann die App unter der Preview-URL testen – das Flackern sollte verschwinden oder deutlich schwächer sein.

---

## Karteikasten: Vokabeln nicht in Box 1 (Gast)

### Ursache (behoben)

Beim ersten Laden als Gast wurden `boxes` zwar in der DB gespeichert, aber in der API-Response wurden weiterhin die alten leeren `boxes` zurückgegeben. Dadurch wirkte es, als wären die Vokabeln keiner Box zugeordnet.

### Lösung

Der Fehler wurde im Backend (`progressController.js`) behoben: `boxes` wird nun auch im Response aktualisiert, wenn beim ersten Laden alle Vokabeln in Box 1 gesetzt werden.
