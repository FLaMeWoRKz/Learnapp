# Socket.io Event Handler Error Handling Fix

## Problem
```
✅ Room created successfully with ID: 3b83bf02-e38a-4e1e-8498-e85a61691bc1
UnhandledPromiseRejection: This error originated either by throwing inside 
of an async function without a catch block
```

**Status:**
- ✅ Raum erstellen funktioniert
- ❌ Server stürzt ab beim "Start Game" Button
- ❌ Socket.io-Verbindung bricht ab → CORS/502 Fehler

## Ursache

Die `createRoom` REST-API Funktion hatte `try/catch` ✅, aber die **Socket.io Event-Handler** hatten **kein Error Handling** ❌.

**Betroffene Socket-Events:**
1. `join-room` - Spieler beitritt
2. `start-game` - Spiel wird gestartet (HIER STÜRZTE ES AB)
3. `submit-answer` - Spieler sendet Antwort
4. Helper-Funktionen: `startNextRound()`, `finishGame()`

Wenn in einem dieser Handler ein Fehler auftrat (z.B. `updateGameRoom` schlägt fehl), gab es keinen `try/catch` → `UnhandledPromiseRejection` → **Server-Crash** → Socket.io Verbindung bricht ab.

## Lösung

### 1. `join-room` Event - Vollständiges Error Handling

**Hinzugefügt:**
```javascript
socket.on('join-room', async (data) => {
  try {
    console.log('👋 join-room event received:', data);
    
    // Validierung
    if (!roomCode || !userId) {
      socket.emit('error', { message: 'Room code and user ID required' });
      return;
    }
    
    // ... Logik ...
    
  } catch (error) {
    console.error('🚨 CRITICAL ERROR in join-room handler:', error);
    socket.emit('error', { 
      message: 'Fehler beim Beitreten',
      details: error.message 
    });
  }
});
```

**Vorteile:**
- ✅ Server stürzt nicht ab wenn Spieler beitritt
- ✅ Detaillierte Logs für Debugging
- ✅ Saubere Fehlermeldung an Client

### 2. `start-game` Event - Der kritische Fix

**Das war der Hauptübeltäter!**

**Vorher:**
```javascript
socket.on('start-game', async (data) => {
  const { roomCode, userId } = data;
  // ... kein try/catch ...
  await dbHelpers.updateGameRoom(room.id, room); // 💥 BOOM wenn dies fehlschlägt
});
```

**Nachher:**
```javascript
socket.on('start-game', async (data) => {
  try {
    console.log('🚀 start-game event received:', data);
    
    // Validierung
    if (!roomCode || !userId) {
      socket.emit('error', { message: 'Room code and user ID required' });
      return;
    }
    
    // Vokabeln laden
    const vocabularies = [];
    for (const level of settings.selectedPacks) {
      console.log('📚 Loading vocabularies for level:', level);
      const vocabs = await dbHelpers.getVocabularies({ level });
      console.log(`   Found ${vocabs.length} vocabularies for level ${level}`);
      vocabularies.push(...vocabs);
    }
    
    // WICHTIG: Nur nötige Felder für DB-Update
    const updateData = {
      status: 'playing',
      currentRound: 0,
      updatedAt: Date.now()
    };
    
    await dbHelpers.updateGameRoom(room.id, updateData);
    
    // Erste Runde starten
    startNextRound(io, roomCode, room);
    
  } catch (error) {
    console.error('🚨 CRITICAL ERROR in start-game handler:', error);
    socket.emit('error', { 
      message: 'Fehler beim Starten des Spiels',
      details: error.message 
    });
  }
});
```

**Wichtige Änderungen:**
1. ✅ Vollständiges `try/catch` Error Handling
2. ✅ Input-Validierung (roomCode, userId)
3. ✅ Detaillierte Debug-Logs
4. ✅ Nur benötigte Felder für DB-Update (nicht ganzes `room` Objekt)
5. ✅ Fehler wird an Client gesendet statt Server-Crash

### 3. `submit-answer` Event - Error Handling

**Hinzugefügt:**
```javascript
socket.on('submit-answer', async (data) => {
  try {
    // Input-Validierung
    if (!roomCode || !userId || !vocabId || answer === undefined) {
      socket.emit('error', { message: 'Missing required fields' });
      return;
    }
    
    // Logik mit detaillierten Logs
    console.log(`${isCorrect ? '✅' : '❌'} Answer from ${userId}: "${answer}"`);
    
    // DB Update - nur nötige Felder
    await dbHelpers.updateGameRoom(room.id, { 
      players: room.players, 
      updatedAt: Date.now() 
    });
    
  } catch (error) {
    console.error('🚨 CRITICAL ERROR in submit-answer handler:', error);
    socket.emit('error', { 
      message: 'Fehler beim Absenden der Antwort',
      details: error.message 
    });
  }
});
```

### 4. Helper-Funktionen: `startNextRound()` und `finishGame()`

**Beide Funktionen haben jetzt:**
```javascript
async function startNextRound(io, roomCode, room) {
  try {
    console.log(`🎮 Starting round ${room.currentRound + 1} for room ${roomCode}`);
    
    // Validierung
    if (!vocab) {
      io.to(roomCode).emit('error', { message: 'No vocabulary for this round' });
      return;
    }
    
    // Logik...
    
    // DB Update - nur nötige Felder
    await dbHelpers.updateGameRoom(room.id, { 
      players: room.players, 
      currentRound: room.currentRound,
      updatedAt: Date.now() 
    });
    
  } catch (error) {
    console.error('🚨 CRITICAL ERROR in startNextRound:', error);
    io.to(roomCode).emit('error', { 
      message: 'Fehler beim Starten der nächsten Runde',
      details: error.message 
    });
  }
}
```

## Wichtige Änderung: DB Update Strategy

**Vorher (PROBLEMATISCH):**
```javascript
await dbHelpers.updateGameRoom(room.id, room);
```
→ Sendet das **gesamte room-Objekt** an InstantDB, inklusive:
- `selectedVocabularies` (Array, nicht im Schema)
- `currentQuestion` (Object, müsste String sein)
- Weitere In-Memory-Daten

**Nachher (SICHER):**
```javascript
await dbHelpers.updateGameRoom(room.id, { 
  players: room.players,        // JSON String ✅
  status: 'playing',            // String ✅
  currentRound: 0,              // Number ✅
  updatedAt: Date.now()         // Number ✅
});
```
→ Sendet **nur schema-konforme Felder** an InstantDB

## Debug-Logs hinzugefügt

Jetzt werden alle wichtigen Schritte geloggt:

```
👋 join-room event received: { roomCode: 'N80I', userId: '...' }
✅ Socket abc123 joined room N80I
➕ Adding new player: ... (username)
✅ Room N80I now has 2 player(s)

🚀 start-game event received: { roomCode: 'N80I', userId: '...' }
🎮 Game settings: { rounds: 10, selectedPacks: [1, 2], ... }
📚 Loading vocabularies for level: 1
   Found 50 vocabularies for level 1
✅ Total vocabularies loaded: 100
🎲 Selected 10 random vocabularies for game
💾 Updating room in database...
✅ Room updated, starting first round...

🎮 Starting round 1 for room N80I
📖 Question word: Hund → dog
✅ Emitting question to room N80I

📝 submit-answer event received: { answer: 'dog', ... }
✅ Answer from user123: "dog" (correct: "dog")
   Points awarded: 950 (base: 500, speed bonus: 450)
   All answered: true, Time since start: 5s
🏁 All players answered, showing results...

🏁 Finishing game for room N80I
🏆 Final leaderboard: [...]
✅ Game finished successfully for room N80I
```

## Railway Logs - Was du jetzt sehen wirst

**Vorher (Server stürzte ab):**
```
✅ Room created successfully
UnhandledPromiseRejection
```

**Nachher (Server läuft weiter):**
```
✅ Room created successfully with ID: ...
👋 join-room event received: ...
✅ Socket joined room
🚀 start-game event received: ...
📚 Loading vocabularies...
✅ Total vocabularies loaded: 100
🎮 Starting round 1 for room ...
✅ Emitting question to room
```

**ODER bei Fehler (Server stürzt NICHT ab):**
```
🚨 CRITICAL ERROR in start-game handler: [Fehlerdetails]
Error stack: [Stack Trace]
```

## Testing Checklist

Nach dem Deployment:

- [ ] Raum erstellen funktioniert (✅ schon getestet)
- [ ] Zweiter Spieler kann beitreten (join-room)
- [ ] "Start Game" Button funktioniert ohne Server-Crash
- [ ] Erste Frage wird angezeigt
- [ ] Antwort absenden funktioniert
- [ ] Alle Runden durchspielbar
- [ ] Spiel endet sauber mit Leaderboard
- [ ] Keine `UnhandledPromiseRejection` in Railway Logs
- [ ] Keine CORS/502 Fehler im Browser

## Deployment

```powershell
cd backend
git add src/controllers/multiplayerController.js
git commit -m "Fix: Socket.io Event Handler Error Handling - verhindert Server-Crashes"
git push origin main
```

## Erwartetes Ergebnis

### Vorher:
1. Raum erstellen ✅
2. "Start Game" klicken → Server stürzt ab ❌
3. Socket.io Verbindung bricht ab → CORS/502 ❌
4. Kein Multiplayer möglich ❌

### Nachher:
1. Raum erstellen ✅
2. "Start Game" klicken → Server läuft weiter ✅
3. Spiel startet oder zeigt klaren Fehler ✅
4. Multiplayer funktioniert oder wir sehen genaue Fehlermeldung ✅

---

**Erstellt am:** 25. Januar 2026  
**Status:** ✅ Fix implementiert, bereit für Deployment  
**Priorität:** 🚨 KRITISCH - Behebt Server-Crashes im Multiplayer
