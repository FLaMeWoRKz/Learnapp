# VocabMaster - Multiplayer Vokabeltrainer

Ein moderner Vokabeltrainer für FOS/BOS Schüler (B2/C1 Niveau) mit Singleplayer- und Multiplayer-Modi.

## Features

### Singleplayer
- **Level-Modus**: Progression durch 15 Packs (Levels). Ein Pack gilt als geschafft bei >80% richtigen Antworten.
- **Karteikasten (Leitner-System)**: 5 virtuelle Boxen. Richtig → Box +1, Falsch → Box -1. Box-Aufstieg = 1 Joker-Punkt.
- **Freies Üben**: Manuelle Auswahl von Packs ohne Einfluss auf Statistiken.

### Multiplayer
- **Lobby-System**: Host erstellt Raum mit Code (4-6 Zeichen). Spieler treten mit Code bei.
- **Echtzeit-Gameplay**: Alle Spieler sehen gleichzeitig dieselbe Frage.
- **Punkte-System**: Basis-Punkte + Zeitbonus für schnelle Antworten.
- **Joker-System**: 50/50 Joker (kostet 5 Joker-Punkte, entfernt 2 falsche Antworten).
- **Spectator Mode**: Zuschauer können dem Spiel folgen ohne zu spielen.

## Technologie-Stack

- **Backend**: Node.js + Express
- **Frontend**: React + TypeScript + Vite
- **Datenbank**: InstantDB (serverless, Echtzeit-Updates) oder lokale JSON-Dateien (für Tests)
- **Realtime**: Socket.io
- **Styling**: Tailwind CSS
- **Containerisierung**: Docker
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel (optional)

## Installation

### Voraussetzungen
- Node.js 20+
- Docker & Docker Compose (optional)
- InstantDB Account (für Datenbank)

### Lokale Entwicklung

1. **Backend einrichten**:
```bash
cd backend
npm install
cp .env.example .env
# Für lokales Testen: STORAGE_MODE=local in .env setzen
# Für Production: INSTANTDB_APP_ID und INSTANTDB_ADMIN_TOKEN eintragen
npm run dev
```

2. **Frontend einrichten**:
```bash
cd frontend
npm install
npm run dev
```

3. **Vokabeln importieren**:
```bash
cd backend
npm run import-vocab
```

4. **API testen** (optional):
```bash
cd backend
npm test  # Testet die API-Endpunkte mit lokaler Speicherung
```

### Lokale Testfunktion (ohne InstantDB)

Für lokales Testen ohne InstantDB-Setup:

1. Setze `STORAGE_MODE=local` in `backend/.env`
2. Daten werden in `backend/data/` als JSON-Dateien gespeichert
3. Keine InstantDB-Credentials erforderlich
4. Perfekt für Entwicklung und Tests

### Docker (Production)

1. **Environment Variables setzen**:
```bash
cp backend/.env.example backend/.env
# .env bearbeiten
```

2. **Docker Compose starten**:
```bash
docker-compose up -d
```

3. **Vokabeln importieren** (nach erstem Start):
```bash
docker exec -it vocabmaster-backend npm run import-vocab
```

## Konfiguration

### Environment Variables (Backend)

- `PORT`: Server Port (Standard: 3000)
- `FRONTEND_URL`: Frontend URL für CORS
- `JWT_SECRET`: Secret für JWT Tokens
- `JWT_EXPIRES_IN`: Token Ablaufzeit (Standard: 24h)
- `STORAGE_MODE`: `local` für Tests (JSON-Dateien) oder `instantdb` für Production
- `INSTANTDB_APP_ID`: InstantDB App ID (nur bei STORAGE_MODE=instantdb)
- `INSTANTDB_ADMIN_TOKEN`: InstantDB Admin Token (nur bei STORAGE_MODE=instantdb)

### InstantDB Setup

1. Erstelle einen Account auf [instantdb.com](https://instantdb.com)
2. Erstelle eine neue App
3. Kopiere App ID und Admin Token in `.env`
4. Schema wird automatisch erstellt (siehe `backend/src/config/instantdb.js`)

## Projektstruktur

```
vocabmaster/
├── backend/          # Express Backend
│   ├── src/
│   │   ├── server.js
│   │   ├── socket.js
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── utils/
│   └── package.json
├── frontend/         # React Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── contexts/
│   └── package.json
└── docker-compose.yml
```

## API Endpunkte

### Authentication
- `POST /api/auth/register` - Registrierung
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Aktueller User

### Vokabeln
- `GET /api/vocab` - Alle Vokabeln (Filter: level, cefr)
- `GET /api/vocab/:id` - Einzelne Vokabel
- `POST /api/vocab/import` - CSV Import

### Progress
- `GET /api/progress` - User-Fortschritt
- `POST /api/progress` - Fortschritt aktualisieren
- `GET /api/progress/packs` - Abgeschlossene Packs
- `GET /api/progress/flashcards` - Karteikasten-Status

### Game
- `POST /api/game/start` - Spiel starten
- `POST /api/game/:id/answer` - Antwort abgeben
- `GET /api/game/:id` - Spiel-Status

### Multiplayer
- `POST /api/multiplayer/create` - Raum erstellen
- `POST /api/multiplayer/join` - Raum beitreten
- `GET /api/multiplayer/room/:code` - Raum-Info

## Socket.io Events

### Client → Server
- `join-room` - Raum beitreten
- `leave-room` - Raum verlassen
- `start-game` - Spiel starten (Host)
- `submit-answer` - Antwort einreichen
- `use-joker` - Joker verwenden
- `next-round` - Nächste Runde (Host)

### Server → Client
- `room-updated` - Raum-Update
- `game-started` - Spiel gestartet
- `question` - Neue Frage
- `round-result` - Runden-Ergebnis
- `game-finished` - Spiel beendet

## Entwicklung

### Backend
```bash
cd backend
npm run dev  # Mit Watch-Mode
```

### Frontend
```bash
cd frontend
npm run dev  # Vite Dev Server
```

## Deployment

### Docker (Production)

1. Environment Variables in `.env` setzen
2. `docker-compose up -d` ausführen
3. SSL/HTTPS über Reverse Proxy (Nginx, Traefik) einrichten

### Vercel + InstantDB

1. **GitHub Repository erstellen**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/vocabmaster.git
   git push -u origin main
   ```

2. **Vercel Setup**:
   - Verbinde dein GitHub Repository mit Vercel
   - Setze Environment Variables in Vercel Dashboard:
     - `INSTANTDB_APP_ID`
     - `INSTANTDB_ADMIN_TOKEN`
     - `JWT_SECRET`
     - `STORAGE_MODE=instantdb`
   - Vercel erkennt automatisch die `vercel.json` Konfiguration

3. **InstantDB Schema**:
   - Erstelle das Schema in deinem InstantDB Dashboard
   - Siehe `backend/src/config/instantdb.js` für Schema-Definition

### GitHub Actions CI/CD

Das Projekt enthält automatische CI/CD-Pipelines:
- Automatische Tests bei jedem Push
- Frontend Build-Check
- Optional: Automatisches Deployment zu Vercel

GitHub Secrets für Vercel (optional):
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Lizenz

ISC

## Autor

VocabMaster Team
