# Lokal testen - Anleitung

Du kannst alles lokal testen, ohne zu GitHub zu pushen oder Vercel neu zu deployen!

## Schnellstart

### Option 1: Alles auf einmal starten (Empfohlen)

1. Öffne PowerShell im Projektroot (`c:\Users\Robin\Desktop\Projekt2`)
2. Führe aus:
   ```powershell
   .\start-local.ps1
   ```
3. Das Script startet automatisch:
   - Backend auf `http://localhost:3000`
   - Frontend auf `http://localhost:5173`
4. Öffne im Browser: `http://localhost:5173`

### Option 2: Manuell starten

**Terminal 1 - Backend:**
```powershell
cd backend
$env:STORAGE_MODE='local'
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

## Wichtige Unterschiede

### Lokal vs. Production

| Feature | Lokal | Production (Vercel/Railway) |
|---------|-------|----------------------------|
| Backend URL | `http://localhost:3000` | `https://learnapp-production-a492.up.railway.app` |
| Frontend URL | `http://localhost:5173` | `https://learnapp-pearl.vercel.app` |
| Datenbank | Lokale JSON-Dateien (`backend/data/`) | InstantDB (Railway) |
| Environment Variables | `.env.local` Datei | Vercel Settings |

## Environment Variables lokal

Das Frontend verwendet automatisch `.env.local` wenn es existiert:
- `VITE_API_URL=http://localhost:3000/api`
- `VITE_SOCKET_URL=http://localhost:3000`

**Wichtig:** `.env.local` ist bereits erstellt und wird automatisch verwendet!

## Vokabeln lokal importieren

1. Stelle sicher, dass `backend/vokabeln.csv` existiert
2. Öffne PowerShell im `backend/` Ordner
3. Führe aus:
   ```powershell
   npm run import-vocab
   ```
4. Die Vokabeln werden in `backend/data/vocabularies.json` gespeichert

## Hot Reload

- **Frontend:** Änderungen werden automatisch neu geladen (Vite Hot Reload)
- **Backend:** Mit `npm run dev` wird automatisch neu gestartet bei Änderungen

## Debugging

### Backend Logs
Siehst du direkt im Terminal, wo das Backend läuft.

### Frontend Logs
Öffne Browser-Konsole (F12) → Console Tab

### API-Tests
Du kannst die API direkt testen:
```powershell
# Health Check
Invoke-WebRequest http://localhost:3000/api/health

# Vokabeln abrufen
Invoke-WebRequest http://localhost:3000/api/vocab?level=1
```

## Häufige Probleme

### Port bereits belegt
- Backend (3000): Ändere `PORT` in `backend/.env` oder beende andere Anwendungen
- Frontend (5173): Vite sucht automatisch einen freien Port

### CORS-Fehler
- Stelle sicher, dass `FRONTEND_URL=http://localhost:5173` in `backend/.env` steht

### Vokabeln fehlen
- Importiere sie lokal: `cd backend; npm run import-vocab`

## Workflow

1. **Lokal entwickeln und testen** → `.\start-local.ps1`
2. **Änderungen testen** → Browser öffnen, testen
3. **Wenn alles funktioniert** → Zu GitHub pushen
4. **Vercel/Railway deployen** → Automatisch oder manuell

So sparst du Zeit und kannst schnell iterieren! 🚀
