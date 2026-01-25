# Automatischer Vokabeln-Import - Fix

## Was wurde geändert

1. **Erweiterte Pfadsuche**: Der Server sucht jetzt in mehreren Pfaden nach der CSV-Datei:
   - `backend/vokabeln.csv` (lokal)
   - `vokabeln.csv` (current working directory)
   - `backend/vokabeln.csv` (Railway/Root)
   - `/app/vokabeln.csv` (Docker/Railway absolute)
   - `/app/backend/vokabeln.csv` (Docker/Railway backend)

2. **Besseres Logging**: Detaillierte Logs zeigen, welche Pfade geprüft wurden

3. **Wiederholter Import**: Falls der erste Import fehlschlägt, wird nach 2 Sekunden erneut versucht

4. **Import-Endpoint öffentlich**: Der `/api/vocab/import` Endpoint ist jetzt öffentlich (für automatischen Import)

## Wichtig: CSV-Datei muss im Git sein!

**Prüfe ob die Datei im Repository ist:**
```bash
git ls-files | grep vokabeln.csv
```

**Falls nicht, füge sie hinzu:**
```bash
git add backend/vokabeln.csv
git commit -m "Vokabeln CSV-Datei hinzugefügt"
git push
```

## Nach dem Deployment

1. **Prüfe Railway Logs**:
   - Suche nach: "📚 Keine Vokabeln gefunden. Starte automatischen Import..."
   - Oder: "✅ Import abgeschlossen: X Vokabeln importiert"
   - Oder: "❌ CSV-Datei nicht gefunden" (dann ist die Datei nicht im Repository!)

2. **Falls Import fehlschlägt**:
   - Prüfe ob `backend/vokabeln.csv` im Git-Repository ist
   - Prüfe Railway Logs auf die gesuchten Pfade
   - Versuche manuellen Import: `POST /api/vocab/import`

## Manueller Import (falls nötig)

Falls der automatische Import nicht funktioniert, kannst du manuell importieren:

**Option 1: Über die API**
```bash
curl -X POST https://deine-railway-url.railway.app/api/vocab/import
```

**Option 2: Über Railway Console**
1. Gehe zu Railway → Dein Service → "Deploy Logs"
2. Öffne die Railway Console
3. Führe aus: `npm run import-vocab`

## Nächste Schritte

1. Stelle sicher, dass `backend/vokabeln.csv` im Git-Repository ist
2. Pushe die Änderungen zu GitHub
3. Railway deployt automatisch neu
4. Prüfe die Logs nach dem automatischen Import
