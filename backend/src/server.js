import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupSocket } from './socket.js';
import authRoutes from './routes/auth.js';
import vocabRoutes from './routes/vocab.js';
import { getLevelCounts } from './controllers/vocabController.js';
import gameRoutes from './routes/game.js';
import progressRoutes from './routes/progress.js';
import multiplayerRoutes from './routes/multiplayer.js';
import { dbHelpers } from './config/instantdb.js';
import { importVocabulariesFromFile } from './utils/csvParser.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Automatischer Import beim Serverstart, wenn keine Vokabeln vorhanden sind
async function checkAndImportVocabularies() {
  try {
    const existingVocabs = await dbHelpers.getVocabularies({});
    
    if (existingVocabs.length === 0) {
      console.log('📚 Keine Vokabeln gefunden. Starte automatischen Import...');
      
      const possiblePaths = [
        path.join(__dirname, '../vokabeln.csv'),
        path.join(process.cwd(), 'vokabeln.csv'),
      ];
      
      let csvPath = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          csvPath = p;
          break;
        }
      }
      
      if (csvPath) {
        console.log(`📂 CSV-Datei gefunden: ${csvPath}`);
        const result = await importVocabulariesFromFile(csvPath);
        console.log(`✅ Import abgeschlossen: ${result.imported} Vokabeln importiert (${result.errors} Fehler)`);
      } else {
        console.log('⚠️ CSV-Datei nicht gefunden. Bitte manuell importieren mit: npm run import-vocab');
      }
    } else {
      console.log(`✅ ${existingVocabs.length} Vokabeln bereits in der Datenbank`);
    }
  } catch (error) {
    console.error('❌ Fehler beim automatischen Import:', error);
  }
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug: Log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes – level-counts explizit vor dem Vocab-Router (sonst fängt /:id "level-counts" ab)
app.get('/api/vocab/level-counts', getLevelCounts);
app.use('/api/auth', authRoutes);
app.use('/api/vocab', vocabRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/multiplayer', multiplayerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io Setup
setupSocket(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 3000;

// Start server after checking vocabularies
checkAndImportVocabularies().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io ready for connections`);
  });
});
