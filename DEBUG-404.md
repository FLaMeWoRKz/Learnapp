# 404-Fehler beim Spiel starten - Debugging

## Problem
`POST http://localhost:3000/api/game/start 404 (Not Found)`

## Checkliste

### 1. Backend läuft?
Prüfe im Terminal, wo das Backend läuft:
- Siehst du: `🚀 Server running on port 3000`?
- Siehst du: `📡 Socket.io ready for connections`?

**Falls nicht:**
```powershell
cd backend
$env:STORAGE_MODE='local'
npm run dev
```

### 2. Health Check testen
Öffne im Browser: `http://localhost:3000/api/health`

**Erwartet:** `{"status":"ok","timestamp":"..."}`

**Falls 404:** Backend läuft nicht oder auf falschem Port

### 3. User eingeloggt?
Öffne Browser-Konsole (F12) und prüfe:
```javascript
localStorage.getItem('token')
```

**Falls `null`:** Du musst dich zuerst einloggen!

### 4. Token wird gesendet?
In der Browser-Konsole (F12 → Network Tab):
- Klicke auf Level 1
- Siehst du die Anfrage zu `/api/game/start`?
- Klicke darauf → **Headers** Tab
- Prüfe ob `Authorization: Bearer ...` vorhanden ist

### 5. Backend-Logs prüfen
Im Backend-Terminal solltest du sehen:
```
POST /api/game/start
```

**Falls nicht:** Die Anfrage kommt nicht beim Backend an

### 6. Route existiert?
Teste manuell (im Browser oder PowerShell):
```powershell
# Sollte 401 geben (nicht 404), wenn kein Token
Invoke-WebRequest -Uri "http://localhost:3000/api/game/start" -Method POST -ContentType "application/json" -Body '{"mode":"level","level":1}'
```

**401 = Route existiert, aber Auth fehlt** ✅
**404 = Route existiert nicht** ❌

## Lösung

### Falls Backend nicht läuft:
```powershell
cd backend
$env:STORAGE_MODE='local'
npm run dev
```

### Falls User nicht eingeloggt:
1. Gehe zu `http://localhost:5173`
2. Registriere dich oder logge dich ein
3. Versuche dann Level 1 zu starten

### Falls Route nicht gefunden wird:
1. Prüfe ob `backend/src/routes/game.js` existiert
2. Prüfe ob `backend/src/server.js` die Route registriert
3. Starte Backend neu

## Schnelltest

Führe aus:
```powershell
.\test-backend.ps1
```

Das Script testet automatisch, ob das Backend läuft und ob die Route existiert.
