import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbHelpers } from '../config/instantdb.js';
import { parseCSV } from './csvParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Stellt sicher, dass Vokabeln vorhanden sind. Wenn keine existieren,
 * wird versucht, aus vokabeln.csv zu importieren.
 */
export async function ensureVocabulariesImported() {
  const all = await dbHelpers.getVocabularies({});
  if (all.length > 0) return;

  // Erweiterte Pfadsuche für verschiedene Deployment-Umgebungen
  const possiblePaths = [
    path.join(__dirname, '../../vokabeln.csv'), // Backend root (lokal)
    path.join(process.cwd(), 'vokabeln.csv'), // Current working directory
    path.join(process.cwd(), 'backend/vokabeln.csv'), // Railway/Root
    path.join(__dirname, '../../../vokabeln.csv'), // Alternative Backend root
    '/app/vokabeln.csv', // Docker/Railway absolute path
    '/app/backend/vokabeln.csv', // Docker/Railway backend path
  ];
  let csvPath = null;
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        csvPath = p;
        break;
      }
    } catch (e) {
      // Ignoriere Fehler beim Prüfen
    }
  }
  if (!csvPath) {
    console.warn('⚠️ vokabeln.csv nicht gefunden in folgenden Pfaden:');
    possiblePaths.forEach(p => console.warn(`   - ${p}`));
    console.warn('⚠️ Kein Auto-Import. Bitte manuell importieren.');
    return;
  }

  try {
    console.log('⚠️ Keine Vokabeln. Automatischer Import aus vokabeln.csv...');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const parsed = await parseCSV(csvContent);
    let imported = 0;
    for (const v of parsed) {
      try {
        const ex = await dbHelpers.getVocabularyById(v.vocabId);
        if (!ex) {
          await dbHelpers.createVocabulary(v);
          imported++;
        }
      } catch (e) {
        console.error('Import vocab:', e);
      }
    }
    console.log(`✅ Auto-Import abgeschlossen: ${imported} Vokabeln.`);
  } catch (err) {
    console.error('❌ Auto-Import fehlgeschlagen:', err);
  }
}
