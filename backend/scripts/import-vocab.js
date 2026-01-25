import { importVocabulariesFromFile } from '../src/utils/csvParser.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, '../vokabeln.csv');

console.log('📚 Importiere Vokabeln aus:', csvPath);
console.log('');

importVocabulariesFromFile(csvPath)
  .then((result) => {
    console.log('');
    console.log('✅ Import abgeschlossen!');
    console.log(`   Neu importiert: ${result.imported}`);
    console.log(`   Aktualisiert: ${result.updated || 0}`);
    console.log(`   Fehler: ${result.errors}`);
    console.log(`   Gesamt: ${result.total}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fehler beim Import:', error);
    process.exit(1);
  });
