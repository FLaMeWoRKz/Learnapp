// InstantDB Schema für Backend (JavaScript-Version)
// Basierend auf instant.schema.ts im Root

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Lade das Paket sicher über require
const instantCore = require("@instantdb/core");

// Hole 'i' - mit Fallback für verschiedene Export-Strukturen
const i = instantCore.i || instantCore.default?.i || instantCore.default;

// Debugging: Zeige uns in den Logs, ob 'i' geladen wurde
if (!i || !i.schema) {
  console.error("🚨 CRITICAL ERROR: Could not load 'i' from @instantdb/core");
  console.log("Loaded module keys:", Object.keys(instantCore));
  if (instantCore.default) {
    console.log("Default export keys:", Object.keys(instantCore.default));
  }
} else {
  console.log("✅ Successfully loaded InstantDB 'i' builder");
}

const schema = i.schema({
  entities: {
    "$files": i.entity({
      "path": i.string().unique().indexed(),
      "url": i.string().optional(),
    }),
    "$users": i.entity({
      "email": i.string().unique().indexed().optional(),
      "imageURL": i.string().optional(),
      "type": i.string().optional(),
    }),
    "flashcardProgress": i.entity({
      "boxes": i.string(),
      "jokerPoints": i.number(),
      "updatedAt": i.number(),
      "userId": i.string().indexed(),
    }),
    "gameRooms": i.entity({
      "code": i.string().unique().indexed(),
      "createdAt": i.number(),
      "currentQuestion": i.string().optional(),
      "currentRound": i.number(),
      "hostId": i.string().indexed(),
      "players": i.string(),
      "settings": i.string(),
      "status": i.string(),
      "updatedAt": i.number(),
    }),
    "gameSessions": i.entity({
      "completed": i.boolean(),
      "createdAt": i.number(),
      "level": i.number(),
      "mode": i.string(),
      "packId": i.number(),
      "questions": i.string(),
      "score": i.number(),
      "userId": i.string().indexed(),
    }),
    "userProgress": i.entity({
      "correctCount": i.number(),
      "createdAt": i.number(),
      "currentBox": i.number(),
      "lastReviewed": i.number().optional(),
      "learned": i.boolean(),
      "level": i.number(),
      "packCompleted": i.boolean(),
      "updatedAt": i.number(),
      "userId": i.string().indexed(),
      "vocabId": i.string().indexed(),
      "wrongCount": i.number(),
    }),
    "users": i.entity({
      "createdAt": i.number(),
      "email": i.string().unique().indexed(),
      "passwordHash": i.string(),
      "stats": i.string(),
      "updatedAt": i.number(),
      "username": i.string().unique().indexed(),
    }),
    "vocabularies": i.entity({
      "cefr": i.string().indexed(),
      "createdAt": i.number(),
      "english": i.string(),
      "german": i.string(),
      "level": i.number().indexed(),
      "vocabId": i.string().indexed(),
    }),
  },
  links: {
    "$usersLinkedPrimaryUser": {
      "forward": {
        "on": "$users",
        "has": "one",
        "label": "linkedPrimaryUser",
        "onDelete": "cascade"
      },
      "reverse": {
        "on": "$users",
        "has": "many",
        "label": "linkedGuestUsers"
      }
    }
  },
  rooms: {}
});

export default schema;
