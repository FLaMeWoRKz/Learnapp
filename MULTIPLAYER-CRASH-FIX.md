# Multiplayer Server Crash Fix - UnhandledPromiseRejection

## Problem
```
UnhandledPromiseRejection: This error originated either by throwing inside of an async function without a catch block
Node.js v20.20.0
POST /api/multiplayer/create
```

**Symptome:**
- ❌ `Disconnected from server`
- ❌ `Access to XMLHttpRequest ... blocked by CORS policy`
- ❌ `GET ... net::ERR_FAILED 502 (Bad Gateway)`

## Ursache

Der CORS-Fehler und 502 waren **nur Symptome**, nicht die Ursache!

**Die wahre Ursache:**
1. Der Backend-Server **stürzte ab** beim `POST /api/multiplayer/create`
2. Grund: `UnhandledPromiseRejection` - ein Fehler wurde nicht mit `try/catch` abgefangen
3. Konkrete Probleme:
   - `currentQuestion: null` im Schema, aber InstantDB erwartet einen **String** für optionale Felder
   - `createGameRoom()` gab das falsche Format zurück (Transaktionsergebnis statt ID)
   - Unzureichendes Error Handling in `createRoom()`

## Lösung

### 1. `backend/src/config/instantdb.js` - createGameRoom Fix

**Vorher (Zeile 274-279):**
```javascript
async createGameRoom(roomData) {
  if (STORAGE_MODE === 'local' || !db) {
    return await localDbHelpers.createGameRoom(roomData);
  }
  return await db.transact([db.tx.gameRooms[id()].update(roomData)]);
},
```

**Nachher:**
```javascript
async createGameRoom(roomData) {
  if (STORAGE_MODE === 'local' || !db) {
    return await localDbHelpers.createGameRoom(roomData);
  }
  if (!db || !db.tx || !db.tx.gameRooms) {
    console.error('❌ InstantDB not properly initialized. db.tx.gameRooms is undefined');
    throw new Error('Database not initialized. Please check INSTANTDB_APP_ID and INSTANTDB_ADMIN_TOKEN.');
  }
  const newId = id();
  await db.transact([db.tx.gameRooms[newId].update(roomData)]);
  return newId; // Gib die ID zurück, nicht das Transact-Ergebnis
},
```

**Änderungen:**
- ✅ ID wird **vor** der Transaktion generiert
- ✅ **Nur die ID** wird zurückgegeben (wie bei `createGameSession`)
- ✅ Prüfung, ob `db.tx.gameRooms` existiert

### 2. `backend/src/controllers/multiplayerController.js` - createRoom Fix

**Hauptänderungen:**

#### a) currentQuestion als JSON String
**Vorher:**
```javascript
currentQuestion: null,
```

**Nachher:**
```javascript
currentQuestion: JSON.stringify(null), // null als JSON String für optionales Feld
```

**Grund:** InstantDB Schema definiert `currentQuestion` als `i.string().optional()` - auch optionale Felder brauchen String-Werte, nicht `null`.

#### b) Verbessertes Error Handling
**Vorher:**
```javascript
} catch (error) {
  next(error);
}
```

**Nachher:**
```javascript
} catch (error) {
  // WICHTIG: Fange alle Fehler ab, damit der Server nicht abstürzt
  console.error('🚨 CRITICAL ERROR in createRoom:', error);
  console.error('Error stack:', error.stack);
  
  // Sende einen sauberen Fehler zurück
  res.status(500).json({ 
    error: 'Serverfehler beim Erstellen des Raums',
    message: error.message || 'Unbekannter Fehler',
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
}
```

**Vorteile:**
- ✅ Server stürzt **nicht mehr ab** bei Fehlern
- ✅ Detaillierte Logs im Railway Backend
- ✅ Saubere Fehlermeldung an Frontend
- ✅ Stack Trace nur in Development (Sicherheit)

#### c) Zusätzliche Debug-Logs
```javascript
console.log('📝 Create Room Request received');
console.log('Request body:', JSON.stringify(req.body, null, 2));
console.log('User:', req.user);
console.log('🔨 Room data prepared:', JSON.stringify(roomData, null, 2));
console.log('✅ Room created successfully with ID:', roomId);
```

**Nutzen:** Einfachere Fehlersuche in Railway Logs

#### d) User ID Validierung
```javascript
if (!userId) {
  console.log('❌ User ID missing');
  return res.status(400).json({ error: 'User ID fehlt' });
}
```

## InstantDB Schema Anforderungen (gameRooms)

Aus `instant.schema.ts` (Zeile 22-32):
```typescript
"gameRooms": i.entity({
  "code": i.string().unique().indexed(),           // ✅ Pflichtfeld: String
  "createdAt": i.number(),                         // ✅ Pflichtfeld: Number (timestamp)
  "currentQuestion": i.string().optional(),        // ⚠️  Optional ABER String (nicht null!)
  "currentRound": i.number(),                      // ✅ Pflichtfeld: Number
  "hostId": i.string().indexed(),                  // ✅ Pflichtfeld: String
  "players": i.string(),                           // ✅ Pflichtfeld: String (JSON)
  "settings": i.string(),                          // ✅ Pflichtfeld: String (JSON)
  "status": i.string(),                            // ✅ Pflichtfeld: String
  "updatedAt": i.number(),                         // ✅ Pflichtfeld: Number (timestamp)
}),
```

**Wichtig:**
- Arrays/Objekte müssen als **JSON Strings** gespeichert werden
- Optionale Felder brauchen trotzdem den **richtigen Typ** (String, nicht `null`)
- Alle Timestamps sind **Numbers** (nicht Date-Objekte)

## Deployment

### Option 1: PowerShell Skript
```powershell
.\commit-and-push-all.ps1
```

### Option 2: Manuell mit Git
```powershell
cd c:\Users\Robin\Desktop\Projekt2
git add backend/src/config/instantdb.js backend/src/controllers/multiplayerController.js
git commit -m "Fix: Multiplayer Server-Crash durch korrektes Error Handling und Schema-konforme Daten"
git push origin main
```

## Nach dem Deployment

### Railway Logs prüfen (sollte sein):
```
📝 Create Room Request received
Request body: { ... }
User: { userId: '...', username: '...' }
🔨 Creating room: XXXXX for user: ...
🔨 Room data prepared: { ... }
✅ Room created successfully with ID: ...
```

### Browser Console (sollte sein):
```
Starting game... {roomCode: 'XXXXX', userId: '...'}
✅ Connected to server
```

### Was verschwindet:
- ❌ Keine `UnhandledPromiseRejection` mehr
- ❌ Keine CORS-Fehler mehr
- ❌ Keine 502 Bad Gateway Fehler mehr
- ❌ Kein Server-Crash mehr

## Warum war das ein kritischer Fix?

### Vorher:
```
1. Frontend → POST /api/multiplayer/create
2. Backend → Fehler in createGameRoom (z.B. Schema Validierung)
3. Backend → CRASH (UnhandledPromiseRejection)
4. Frontend → Sieht: "Connection lost, CORS error, 502"
5. User → Kann keinen Raum erstellen ❌
```

### Nachher:
```
1. Frontend → POST /api/multiplayer/create
2. Backend → Fehler wird von try/catch abgefangen
3. Backend → Sendet sauberen 500 Error zurück
4. Frontend → Zeigt: "Fehler beim Erstellen des Raums"
5. User → Sieht klare Fehlermeldung ✅
6. Server → Läuft weiter, keine Crashes ✅
```

## Lessons Learned

1. **CORS/502 sind oft nur Symptome** - Immer die Backend-Logs prüfen
2. **InstantDB Schema ist strikt** - Alle Typen müssen exakt passen
3. **Optionale Felder ≠ null** - Bei InstantDB String-Typen verwenden
4. **Error Handling ist kritisch** - Ohne `try/catch` stürzt Node.js ab
5. **Logs sind Gold wert** - Console.logs helfen bei der Fehlersuche in Production

## Testing Checklist

Nach dem Deployment:

- [ ] Backend deployed erfolgreich auf Railway
- [ ] Railway Logs zeigen "✅ Room created successfully"
- [ ] Frontend kann Multiplayer-Raum erstellen
- [ ] Keine CORS-Fehler in Browser Console
- [ ] Keine 502 Fehler
- [ ] Server stürzt nicht mehr ab
- [ ] Socket.io verbindet erfolgreich

---

**Erstellt am:** 25. Januar 2026  
**Status:** ✅ Fix implementiert, bereit für Deployment  
**Priorität:** 🚨 KRITISCH - Blockiert gesamten Multiplayer-Modus
