import Papa from 'papaparse';
import fs from 'fs';
import { dbHelpers } from '../config/instantdb.js';

export async function parseCSV(csvContent) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const vocabularies = results.data
          .map((row, index) => {
            // Normalize column names (case-insensitive)
            const id = row.ID || row.id || `vocab_${index}`;
            // Berechne Level basierend auf der ID (in 100er Schritten)
            // Level 1 = IDs 0001-0100, Level 2 = 0101-0200, etc.
            let level = 1;
            if (id && /^\d+$/.test(id.toString())) {
              // Wenn ID eine Zahl ist, berechne Level: Level = Math.floor((ID - 1) / 100) + 1
              const idNum = parseInt(id.toString(), 10);
              level = Math.floor((idNum - 1) / 100) + 1;
            } else {
              // Fallback: Verwende Index für Level-Berechnung
              level = Math.floor(index / 100) + 1;
            }
            const german = row.German || row.german || '';
            const english = row.English || row.english || '';
            const cefr = row.CEFR || row.cefr || 'B2';

            if (!german || !english) {
              return null; // Skip invalid rows
            }

            return {
              vocabId: id,
              level: level,
              german: german.trim(),
              english: english.trim(),
              cefr: cefr.trim(),
              createdAt: Date.now()
            };
          })
          .filter(v => v !== null); // Remove null entries

        resolve(vocabularies);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

// Standalone import function
export async function importVocabulariesFromFile(filePath) {
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const vocabularies = await parseCSV(csvContent);

  let imported = 0;
  let updated = 0;
  let errors = 0;

  for (const vocab of vocabularies) {
    try {
      // Check if vocabulary already exists
      const existing = await dbHelpers.getVocabularyById(vocab.vocabId);
      if (existing) {
        // Update existing vocabulary (especially level)
        await dbHelpers.updateVocabulary(vocab.vocabId, vocab);
        updated++;
      } else {
        await dbHelpers.createVocabulary(vocab);
        imported++;
      }
    } catch (error) {
      console.error(`Error importing vocab ${vocab.vocabId}:`, error);
      errors++;
    }
  }

  return { imported, updated, errors, total: vocabularies.length };
}
