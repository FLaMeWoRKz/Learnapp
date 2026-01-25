# Vokabeln Import - Anleitung

## Option 1: Über Railway (Empfohlen)

1. Gehe zu Railway → Dein Service → **Deployments** Tab
2. Klicke auf **"Run Command"** (oder **"Shell"**)
3. Führe aus:
   ```
   npm run import-vocab
   ```
4. Warte bis der Import fertig ist

## Option 2: Über API-Endpoint

1. Stelle sicher, dass du eingeloggt bist (Token im localStorage)
2. Öffne die Browser-Konsole (F12)
3. Führe aus:
   ```javascript
   fetch('https://learnapp-production-a492.up.railway.app/api/vocab/import', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('token'),
       'Content-Type': 'application/json'
     }
   })
   .then(r => r.json())
   .then(console.log)
   ```

## Option 3: Lokal (für Entwicklung)

1. Öffne PowerShell im `backend/` Ordner
2. Führe aus:
   ```powershell
   npm run import-vocab
   ```

## Prüfen ob Import erfolgreich war

Nach dem Import kannst du prüfen, ob die Vokabeln vorhanden sind:

```javascript
fetch('https://learnapp-production-a492.up.railway.app/api/vocab?level=1')
  .then(r => r.json())
  .then(data => console.log(`Gefunden: ${data.count} Vokabeln`))
```

## 404-Fehler beim Spiel starten

Der 404-Fehler beim Klick auf Level 1 kommt wahrscheinlich daher, dass:
1. **Keine Vokabeln vorhanden sind** - Importiere zuerst die Vokabeln!
2. **User nicht authentifiziert ist** - Stelle sicher, dass du eingeloggt bist
3. **Backend läuft nicht** - Prüfe Railway Logs

Nach dem Import der Vokabeln sollte das Spiel funktionieren.
