/**
 * Text-to-Speech via Web Speech API
 * Ermöglicht das Abspielen von Vokabeln (Deutsch & Englisch)
 */
export function speak(text: string, lang: 'de-DE' | 'en-US' = 'de-DE'): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export function speakGerman(text: string): void {
  speak(text, 'de-DE');
}

export function speakEnglish(text: string): void {
  speak(text, 'en-US');
}
