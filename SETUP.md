# Setup-Anleitung für VocabMaster

## Schnellstart (Lokales Testen)

### 1. Backend Setup

```bash
cd backend
npm install
npm run setup
```

`npm run setup` legt `.env` aus `.env.example` an (u.a. `STORAGE_MODE=local`). Optional kannst du `.env` anpassen.

### 2. Backend starten

```bash
npm run dev
```

Falls `npm run dev` mit "spawn EPERM" o.ä. abbricht, stattdessen:
```bash
npm run start
```

Der Server läuft auf `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Frontend starten

```bash
npm run dev
```

Das Frontend läuft auf `http://localhost:5173`

### 5. API testen (optional)

Backend muss laufen. In einem neuen Terminal:
```bash
cd backend
npm run test:local
```
(alias: `npm test`)

## Nächste Schritte

### GitHub Repository erstellen

1. **Repository initialisieren**:
```bash
git init
git add .
git commit -m "Initial commit: VocabMaster with local storage support"
```

2. **GitHub Repository erstellen** (auf github.com):
   - Klicke auf "New repository"
   - Name: `vocabmaster` (oder dein gewünschter Name)
   - Öffentlich oder privat
   - **NICHT** "Initialize with README" auswählen

3. **Repository verbinden**:
```bash
git remote add origin https://github.com/DEIN-USERNAME/vocabmaster.git
git branch -M main
git push -u origin main
```

### Vercel Deployment (mit InstantDB)

1. **InstantDB Account erstellen**:
   - Gehe zu [instantdb.com](https://instantdb.com)
   - Erstelle einen Account
   - Erstelle eine neue App
   - Kopiere `APP_ID` und `ADMIN_TOKEN`

2. **Vercel Setup**:
   - Gehe zu [vercel.com](https://vercel.com)
   - Verbinde dein GitHub Repository
   - In den Project Settings → Environment Variables:
     ```
     INSTANTDB_APP_ID=deine-app-id
     INSTANTDB_ADMIN_TOKEN=dein-admin-token
     JWT_SECRET=dein-sicheres-secret
     STORAGE_MODE=instantdb
     NODE_ENV=production
     ```

3. **Deploy**:
   - Vercel deployt automatisch bei jedem Push zu `main`
   - Oder manuell: `vercel --prod`

### InstantDB Schema einrichten

Im InstantDB Dashboard:
1. Gehe zu "Schema"
2. Füge die folgenden Tabellen hinzu (siehe `backend/src/config/instantdb.js`):
   - `users`
   - `vocabularies`
   - `userProgress`
   - `flashcardProgress`
   - `gameRooms`
   - `gameSessions`

## Troubleshooting

### npm install Probleme

**Problem**: `npm install` hängt oder schlägt fehl

**Lösungen**:
1. Node.js Version prüfen: `node --version` (sollte 20+ sein)
2. npm Cache löschen: `npm cache clean --force`
3. `package-lock.json` löschen und neu installieren:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
4. Alternative: `npm ci` statt `npm install` (sauberer)

### Port bereits belegt

**Problem**: Port 3000 oder 5173 bereits in Verwendung

**Lösung**: Ändere den Port in `.env` (Backend) oder `vite.config.ts` (Frontend)

### Lokale Daten löschen

Um alle lokalen Testdaten zu löschen:
```bash
rm -rf backend/data/*.json
```

## Entwicklung

- **Backend**: `cd backend && npm run dev` (mit Watch-Mode)
- **Frontend**: `cd frontend && npm run dev` (Hot Reload)
- **Tests**: `cd backend && npm test`

## Daten-Speicherung

- **Lokal (Test)**: `backend/data/*.json` - wird automatisch erstellt
- **Production**: InstantDB (cloud-basiert, Echtzeit-Updates)

Um zwischen Modi zu wechseln, ändere `STORAGE_MODE` in `.env`:
- `STORAGE_MODE=local` → JSON-Dateien
- `STORAGE_MODE=instantdb` → InstantDB (benötigt Credentials)
