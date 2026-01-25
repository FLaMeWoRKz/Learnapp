import { useState, useEffect } from 'react';
import { vocabAPI } from '../../services/api';
import Button from '../shared/Button';
import Card from '../shared/Card';
import type { Vocabulary } from '../../types';

type LevelCount = { level: number; count: number };

export default function FreePractice() {
  const [levelCounts, setLevelCounts] = useState<LevelCount[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<number[]>([1]);
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [currentVocab, setCurrentVocab] = useState<Vocabulary | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [levelSelectionExpanded, setLevelSelectionExpanded] = useState(true);

  useEffect(() => {
    vocabAPI.getLevelCounts().then((d) => setLevelCounts(d.levels || []));
  }, []);

  useEffect(() => {
    if (selectedLevels.length === 0) return;
    loadVocabularies();
  }, [selectedLevels]);

  const loadVocabularies = async () => {
    try {
      const filters =
        selectedLevels.length === 1
          ? { level: selectedLevels[0] }
          : { levels: selectedLevels };
      const data = await vocabAPI.getVocabularies(filters);
      const list = data.vocabularies || [];
      setVocabularies(list);
      if (list.length > 0) {
        loadRandomQuestion(list);
      } else {
        setCurrentVocab(null);
      }
    } catch (error) {
      console.error('Error loading vocabularies:', error);
    }
  };

  const loadRandomQuestion = (vocabList: Vocabulary[]) => {
    const randomVocab = vocabList[Math.floor(Math.random() * vocabList.length)];
    const wrongVocabs = vocabList
      .filter((v) => v.vocabId !== randomVocab.vocabId)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const allOptions = [randomVocab.english, ...wrongVocabs.map((v) => v.english)].sort(
      () => 0.5 - Math.random()
    );
    setCurrentVocab(randomVocab);
    setOptions(allOptions);
    setSelectedAnswer(null);
    setCorrect(null);
  };

  const toggleLevel = (level: number) => {
    setSelectedLevels((prev) => {
      const next = prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level].sort((a, b) => a - b);
      return next.length > 0 ? next : [level];
    });
  };

  const handleAnswer = (answer: string) => {
    if (!currentVocab) return;
    const isCorrect = answer === currentVocab.english;
    setSelectedAnswer(answer);
    setCorrect(isCorrect);
    setTimeout(() => loadRandomQuestion(vocabularies), 1000);
  };

  const countByLevel = Object.fromEntries(levelCounts.map((l) => [l.level, l.count]));
  const totalSelected = selectedLevels.reduce((s, l) => s + (countByLevel[l] ?? 0), 0);

  return (
    <Card>
      <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Freies Üben</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Wähle ein oder mehrere Level. Du übst aus der kombinierten Vokabelliste ohne Einfluss auf
        Statistiken.
      </p>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Level (mehrfach wählbar)
          </label>
          <button
            onClick={() => setLevelSelectionExpanded(!levelSelectionExpanded)}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            {levelSelectionExpanded ? '▼ Minimieren' : '▶ Erweitern'}
          </button>
        </div>
        {levelSelectionExpanded && (
          <>
            <div className="flex flex-wrap gap-3">
              {levelCounts.map(({ level, count }) => {
                const checked = selectedLevels.includes(level);
                return (
                  <label
                    key={level}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-500 text-primary-800 dark:text-primary-200'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleLevel(level)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="font-medium">
                      Level {level} ({count})
                    </span>
                  </label>
                );
              })}
            </div>
            {levelCounts.length > 0 && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {selectedLevels.length} Level ausgewählt · {totalSelected} Vokabeln gesamt
              </p>
            )}
            {levelCounts.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400">Keine Level vorhanden. Importiere zuerst Vokabeln.</p>
            )}
          </>
        )}
        {!levelSelectionExpanded && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedLevels.length} Level ausgewählt · {totalSelected} Vokabeln gesamt
          </p>
        )}
      </div>

      {currentVocab && vocabularies.length > 0 && (
        <>
          <div className="text-center mb-8">
            <h4 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              {currentVocab.german}
            </h4>
            {correct !== null && (
              <p
                className={`text-xl font-semibold ${
                  correct ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {correct ? '✓ Richtig!' : `✗ Falsch. Richtig: ${currentVocab.english}`}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((opt, i) => {
              let variant: 'primary' | 'secondary' | 'success' | 'danger' = 'secondary';
              if (selectedAnswer === opt) variant = opt === currentVocab.english ? 'success' : 'danger';
              return (
                <Button
                  key={i}
                  variant={variant}
                  size="lg"
                  onClick={() => !selectedAnswer && handleAnswer(opt)}
                  disabled={!!selectedAnswer}
                >
                  {opt}
                </Button>
              );
            })}
          </div>
        </>
      )}

      {selectedLevels.length > 0 && vocabularies.length === 0 && !currentVocab && (
        <p className="text-gray-500 dark:text-gray-400">
          Keine Vokabeln in den gewählten Leveln.
        </p>
      )}
    </Card>
  );
}
