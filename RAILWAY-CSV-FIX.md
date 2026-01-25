# Railway CSV-Datei Problem - Fix

## Problem
Die CSV-Datei wird auf Railway nicht gefunden, obwohl sie im Git-Repository ist.

## Lösung

### 1. Prüfe Railway Root Directory

In Railway → Dein Service → Settings → Root Directory:
- **MUSS** auf `backend` gesetzt sein
- Nicht auf `/` oder leer!

### 2. Prüfe ob CSV-Datei im Repository ist

```bash
git ls-files | grep vokabeln.csv
```

Sollte ausgeben: `backend/vokabeln.csv`

### 3. Falls CSV-Datei nicht gefunden wird

**Option A: Manueller Import über API**
```bash
curl -X POST https://deine-railway-url.railway.app/api/vocab/import
```

**Option B: Über Railway Console**
1. Gehe zu Railway → Dein Service → "Deploy Logs"
2. Klicke auf "Run Command" oder öffne die Console
3. Führe aus: `npm run import-vocab`

**Option C: CSV-Datei direkt hochladen**
1. Gehe zu Railway → Dein Service → "Settings"
2. Prüfe ob es eine Möglichkeit gibt, Dateien hochzuladen
3. Oder verwende Railway Volumes

### 4. Debug-Informationen

Die Logs zeigen jetzt:
- Welche Pfade geprüft wurden
- Ob die Datei existiert oder nicht
- Das aktuelle Working Directory (`process.cwd()`)
- Den `__dirname` Pfad

### 5. Alternative: CSV-Datei in Dockerfile kopieren

Das Dockerfile wurde angepasst, um die CSV-Datei zu kopieren. Falls Railway Docker verwendet, sollte das funktionieren.

Falls Railway **kein Docker** verwendet (direktes Node.js Deployment):
- Die CSV-Datei sollte automatisch kopiert werden, wenn Root Directory = `backend` ist
- Prüfe Railway Logs auf: `🔍 Debug: process.cwd() = ...`

## Nächste Schritte

1. Prüfe Railway Settings → Root Directory = `backend`
2. Pushe die Änderungen zu GitHub
3. Railway deployt automatisch neu
4. Prüfe die Logs auf die Debug-Ausgaben
5. Falls immer noch nicht gefunden, verwende manuellen Import
