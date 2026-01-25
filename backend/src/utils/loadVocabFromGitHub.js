/**
 * Fallback: Lade CSV-Daten direkt von GitHub Raw URL
 * Wird verwendet, wenn die lokale CSV-Datei nicht gefunden wird
 */
export async function loadVocabFromGitHub() {
  try {
    const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/FLaMeWoRKz/Learnapp/main/backend/vokabeln.csv';
    console.log('🌐 Versuche CSV-Daten von GitHub zu laden...');
    console.log(`🔗 URL: ${GITHUB_RAW_URL}`);
    
    // Node.js 18+ hat fetch, für ältere Versionen würde man node-fetch brauchen
    const https = await import('https');
    const http = await import('http');
    const url = await import('url');
    
    return new Promise((resolve, reject) => {
      const parsedUrl = url.parse(GITHUB_RAW_URL);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const req = client.get(parsedUrl, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`GitHub request failed: ${res.statusCode}`));
          return;
        }
        
        let csvContent = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          csvContent += chunk;
        });
        res.on('end', () => {
          console.log(`✅ CSV-Daten von GitHub geladen (${csvContent.length} Zeichen)`);
          resolve(csvContent);
        });
      });
      
      req.on('error', (error) => {
        console.error('❌ Fehler beim Laden von GitHub:', error);
        reject(error);
      });
      
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('GitHub request timeout'));
      });
    });
  } catch (error) {
    console.error('❌ Fehler beim Laden von GitHub:', error);
    throw error;
  }
}
