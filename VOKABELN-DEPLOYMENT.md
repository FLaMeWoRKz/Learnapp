# Vokabeln automatisch importieren - Deployment-Fix

## Problem
Die Vokabeln werden beim Deployment auf Railway nicht automatisch importiert.

## Lösung

### 1. CSV-Datei im Repository sicherstellen

Die `backend/vokabeln.csv` Datei **MUSS** im Git-Repository sein:

```bash
# Prüfe ob die Datei im Repository ist
git ls-files | grep vokabeln.csv

# Falls nicht, füge sie hinzu:
git add backend/vokabeln.csv
git commit -m "Vokabeln CSV-Datei hinzugefügt"
git push
```

### 2. Automatischer Import beim Serverstart

Der Server importiert automatisch beim Start, wenn keine Vokabeln vorhanden sind. Die Funktion sucht in folgenden Pfaden:

- `backend/vokabeln.csv` (lokal)
- `vokabeln.csv` (current working directory)
- `backend/vokabeln.csv` (Railway/Root)
- `/app/vokabeln.csv` (Docker/Railway absolute)
- `/app/backend/vokabeln.csv` (Docker/Railway backend)

### 3. Manueller Import (falls nötig)

Falls der automatische Import nicht funktioniert, kannst du manuell importieren:

**Option A: Über die API (wenn Backend läuft)**
```bash
# POST Request an /api/vocab/import
# Benötigt Authentifizierung
```

**Option B: Über Railway Console**
1. Gehe zu Railway → Dein Service → "Deploy Logs"
2. Öffne die Railway Console
3. Führe aus: `npm run import-vocab`

### 4. Prüfen ob Import funktioniert

Nach dem Deployment, prüfe die Railway Logs:
- Suche nach: "📚 Keine Vokabeln gefunden. Starte automatischen Import..."
- Oder: "✅ Import abgeschlossen: X Vokabeln importiert"

### 5. Troubleshooting

**Problem: CSV-Datei nicht gefunden**
- Prüfe ob `backend/vokabeln.csv` im Git-Repository ist
- Prüfe Railway Logs auf die gesuchten Pfade
- Stelle sicher, dass die Datei nicht in `.gitignore` ist

**Problem: Import schlägt fehl**
- Prüfe Railway Logs auf Fehlermeldungen
- Prüfe ob die Datenbank erreichbar ist
- Prüfe ob genug Speicherplatz vorhanden ist

**Problem: Vokabeln fehlen trotz Import**
- Prüfe ob der Import erfolgreich war (Logs)
- Prüfe ob die Datenbank die Vokabeln enthält
- Versuche manuellen Import über API

## Wichtig

- Die CSV-Datei **MUSS** im Git-Repository sein
- Der automatische Import läuft nur, wenn **keine** Vokabeln vorhanden sind
- Bei jedem neuen Deployment wird geprüft, ob Vokabeln fehlen
