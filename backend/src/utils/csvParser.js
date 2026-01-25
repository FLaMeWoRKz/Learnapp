import Papa from 'papaparse';
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
            const level = parseInt(row.Level || row.level || '1', 10);
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
  const fs = await import('fs');
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const vocabularies = await parseCSV(csvContent);

  let imported = 0;
  let errors = 0;

  for (const vocab of vocabularies) {
    try {
      // Check if vocabulary already exists
      const existing = await dbHelpers.getVocabularyById(vocab.vocabId);
      if (!existing) {
        await dbHelpers.createVocabulary(vocab);
        imported++;
      }
    } catch (error) {
      console.error(`Error importing vocab ${vocab.vocabId}:`, error);
      errors++;
    }
  }

  return { imported, errors, total: vocabularies.length };
}
