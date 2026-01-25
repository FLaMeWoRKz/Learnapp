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

  const possiblePaths = [
    path.join(__dirname, '../../vokabeln.csv'),
    path.join(process.cwd(), 'vokabeln.csv'),
  ];
  let csvPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      csvPath = p;
      break;
    }
  }
  if (!csvPath) {
    console.warn('⚠️ vokabeln.csv nicht gefunden. Kein Auto-Import.');
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
