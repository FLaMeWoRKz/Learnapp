# Nächste Schritte – VocabMaster

## 1. Lokal testen (Local Storage, ohne Docker)

**Backend:**
```powershell
cd backend
npm install
npm run setup
$env:STORAGE_MODE = "local"
npm run dev
```
Oder **ohne Watch** (falls `npm run dev` mit "spawn EPERM" abbricht):
```powershell
$env:STORAGE_MODE = "local"
npm run start
```

**Frontend** (neues Terminal):
```powershell
cd frontend
npm install
npm run dev
```

- Backend: http://localhost:3000  
- Frontend: http://localhost:5173  
- Daten: `backend/data/*.json`

**API-Test** (Backend muss laufen):
```powershell
cd backend
npm run test:local
```

**Alles in einem Schritt** (PowerShell im Projektroot):
```powershell
.\start-local.ps1
```
Startet Backend + Frontend in eigenen Fenstern (führt ggf. `npm install` aus).

---

## 2. GitHub

1. Repository auf [github.com](https://github.com/new) anlegen (z. B. `vocabmaster`), **ohne** README initialisieren.
2. Im Projektroot:
   ```powershell
   git init
   git add .
   git commit -m "Initial commit: VocabMaster"
   git remote add origin https://github.com/DEIN-USERNAME/vocabmaster.git
   git branch -M main
   git push -u origin main
   ```
3. `package-lock.json` (backend + frontend) mit committen, damit CI und Vercel zuverlässig bauen.

---

## 3. InstantDB (für Produktion)

1. [instantdb.com](https://instantdb.com) → Account → Neue App.
2. **APP_ID** und **ADMIN_TOKEN** kopieren.
3. Im InstantDB-Dashboard unter **Schema** die Tabellen anlegen (orientiert an `backend/src/config/instantdb.js`):
   - `users`, `vocabularies`, `userProgress`, `flashcardProgress`, `gameRooms`, `gameSessions`

---

## 4. Vercel (Deploy)

1. [vercel.com](https://vercel.com) → Mit GitHub anmelden → Projekt aus Repo importieren.
2. **Environment Variables** im Vercel-Projekt setzen:
   - `INSTANTDB_APP_ID` = deine InstantDB App-ID  
   - `INSTANTDB_ADMIN_TOKEN` = dein InstantDB Admin-Token  
   - `JWT_SECRET` = sicheres, zufälliges Secret  
   - `STORAGE_MODE` = `instantdb`  
   - `NODE_ENV` = `production`  
   - `FRONTEND_URL` = deine Vercel-Frontend-URL (z. B. `https://vocabmaster.vercel.app`)
3. Build- und Output-Einstellungen je nach Monorepo-Struktur (Backend/Frontend) anpassen.  
4. Deploy auslösen (z. B. Push auf `main` oder manuell).

**GitHub Actions** (`.github/workflows/ci.yml`):  
Für automatisches Vercel-Deploy werden **Secrets** im GitHub-Repo benötigt:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Diese erhältst du über die Vercel-CLI bzw. Project Settings. Ohne diese Secrets schlägt der Deploy-Step in CI fehl (`continue-on-error: true`), das Projekt lässt sich aber weiterhin manuell über Vercel deployen.

---

## 5. npm-Probleme (kurz)

- **`npm install` hängt / EPERM / Fehler:**  
  - Node 20+ prüfen: `node -v`  
  - Cache leeren: `npm cache clean --force`  
  - Sauber neu installieren:
    ```powershell
    Remove-Item -Recurse -Force node_modules, package-lock.json
    npm install
    ```
  - Optional: `npm ci` (nutzt nur `package-lock.json`).
- **`npm run dev` → "spawn EPERM":**  
  Watch-Mode wird blockiert (z. B. Sandbox/Antivirus). Stattdessen `npm run start` im Backend verwenden.

---

## Übersicht

| Schritt        | Ziel                          |
|----------------|-------------------------------|
| Lokal testen   | App mit Local Storage lauffähig |
| GitHub         | Code versionieren, CI nutzen   |
| InstantDB      | DB für Produktion             |
| Vercel         | Frontend + Backend deployen   |
