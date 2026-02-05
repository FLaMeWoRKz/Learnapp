import { useState, useEffect } from 'react';
import { vocabAPI } from '../../services/api';
import { useSettings } from '../../contexts/SettingsContext';
import Button from '../shared/Button';
import Card from '../shared/Card';
import type { Vocabulary } from '../../types';

type LevelItem = { level: number | string; count: number; custom?: boolean; name?: string };

export default function FreePractice() {
  const { vocabDirection } = useSettings();
  const [levelCounts, setLevelCounts] = useState<LevelItem[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<number[]>([1]);
  const [selectedCustomPacks, setSelectedCustomPacks] = useState<string[]>([]);
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
    if (selectedLevels.length === 0 && selectedCustomPacks.length === 0) return;
    loadVocabularies();
  }, [selectedLevels, selectedCustomPacks]);

  const loadVocabularies = async () => {
    try {
      const allVocabs: Vocabulary[] = [];
      if (selectedLevels.length > 0) {
        const filters =
          selectedLevels.length === 1
            ? { level: selectedLevels[0] }
            : { levels: selectedLevels };
        const data = await vocabAPI.getVocabularies(filters);
        allVocabs.push(...(data.vocabularies || []));
      }
      for (const packId of selectedCustomPacks) {
        const data = await vocabAPI.getVocabularies({ customPackId: packId });
        allVocabs.push(...(data.vocabularies || []));
      }
      setVocabularies(allVocabs);
      if (allVocabs.length > 0) {
        loadRandomQuestion(allVocabs);
      } else {
        setCurrentVocab(null);
      }
    } catch (error) {
      console.error('Error loading vocabularies:', error);
    }
  };

  const loadRandomQuestion = (vocabList: Vocabulary[]) => {
    const randomVocab = vocabList[Math.floor(Math.random() * vocabList.length)];
    const isDeEn = vocabDirection === 'de-en';
    const wrongVocabs = vocabList
      .filter((v) => v.vocabId !== randomVocab.vocabId)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const correctOpt = isDeEn ? randomVocab.english : randomVocab.german;
    const wrongOpts = isDeEn ? wrongVocabs.map((v) => v.english) : wrongVocabs.map((v) => v.german);
    const allOptions = [correctOpt, ...wrongOpts].sort(() => 0.5 - Math.random());
    setCurrentVocab(randomVocab);
    setOptions(allOptions);
    setSelectedAnswer(null);
    setCorrect(null);
  };

  const toggleLevel = (level: number) => {
    setSelectedLevels((prev) => {
      const next = prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level].sort((a, b) => a - b);
      return next.length > 0 || selectedCustomPacks.length > 0 ? next : [level];
    });
  };

  const toggleCustomPack = (packId: string) => {
    setSelectedCustomPacks((prev) => {
      const next = prev.includes(packId) ? prev.filter((p) => p !== packId) : [...prev, packId];
      if (next.length === 0 && selectedLevels.length === 0) setSelectedLevels([1]);
      return next;
    });
  };

  const handleAnswer = (answer: string) => {
    if (!currentVocab) return;
    const correctAnswer = vocabDirection === 'de-en' ? currentVocab.english : currentVocab.german;
    const isCorrect = answer === correctAnswer;
    setSelectedAnswer(answer);
    setCorrect(isCorrect);
    setTimeout(() => loadRandomQuestion(vocabularies), 1000);
  };

  const countByLevel = Object.fromEntries(levelCounts.map((l) => [String(l.level), l.count]));
  const totalSelected =
    selectedLevels.reduce((s, l) => s + (countByLevel[String(l)] ?? 0), 0) +
    selectedCustomPacks.reduce((s, p) => s + (countByLevel[p] ?? 0), 0);

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
              {levelCounts.map((item) => {
                const level = item.level;
                const count = item.count;
                const isCustom = item.custom === true;
                const checked = isCustom
                  ? selectedCustomPacks.includes(String(level))
                  : selectedLevels.includes(Number(level));
                const toggle = isCustom ? () => toggleCustomPack(String(level)) : () => toggleLevel(Number(level));
                const label = isCustom ? (item.name || `Pack`) : `Level ${level}`;
                return (
                  <label
                    key={String(level)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-500 text-primary-800 dark:text-primary-200'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={toggle}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="font-medium">
                      {label} ({count})
                    </span>
                  </label>
                );
              })}
            </div>
            {levelCounts.length > 0 && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {selectedLevels.length + selectedCustomPacks.length} ausgewählt · {totalSelected} Vokabeln gesamt
              </p>
            )}
            {levelCounts.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400">Keine Level vorhanden. Importiere zuerst Vokabeln.</p>
            )}
          </>
        )}
        {!levelSelectionExpanded && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedLevels.length + selectedCustomPacks.length} ausgewählt · {totalSelected} Vokabeln gesamt
          </p>
        )}
      </div>

      {currentVocab && vocabularies.length > 0 && (
        <>
          <div className="text-center mb-8">
            <h4 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              {vocabDirection === 'de-en' ? currentVocab.german : currentVocab.english}
            </h4>
            {correct !== null && (
              <p
                className={`text-xl font-semibold ${
                  correct ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {correct ? '✓ Richtig!' : `✗ Falsch. Richtig: ${vocabDirection === 'de-en' ? currentVocab.english : currentVocab.german}`}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {options.map((opt, i) => {
              const isSelected = selectedAnswer === opt;
              const correctOpt = vocabDirection === 'de-en' ? currentVocab.english : currentVocab.german;
              const isCorrect = opt === correctOpt;
              
              // Color mapping for Kahoot-like appearance
              const colors = [
                { bg: 'bg-blue-500 hover:bg-blue-600', selected: 'bg-blue-700' },
                { bg: 'bg-red-500 hover:bg-red-600', selected: 'bg-red-700' },
                { bg: 'bg-yellow-500 hover:bg-yellow-600', selected: 'bg-yellow-700' },
                { bg: 'bg-green-500 hover:bg-green-600', selected: 'bg-green-700' }
              ];
              const colorScheme = colors[i % 4];

              return (
                <button
                  key={i}
                  onClick={() => !selectedAnswer && handleAnswer(opt)}
                  disabled={!!selectedAnswer}
                  className={`
                    ${colorScheme.bg} dark:${colorScheme.selected}
                    text-white font-bold text-xl py-8 px-6 rounded-2xl
                    transition-all duration-200 transform relative
                    ${!selectedAnswer ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'cursor-not-allowed opacity-80'}
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-lg hover:shadow-xl
                    ${isSelected 
                      ? isCorrect 
                        ? 'ring-4 ring-green-400 ring-offset-2' 
                        : 'ring-4 ring-red-400 ring-offset-2'
                      : ''
                    }
                  `}
                >
                  {opt}
                  {isSelected && (
                    <span className="absolute top-2 right-2 text-2xl">
                      {isCorrect ? '✓' : '✗'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {(selectedLevels.length > 0 || selectedCustomPacks.length > 0) && vocabularies.length === 0 && !currentVocab && (
        <p className="text-gray-500 dark:text-gray-400">
          Keine Vokabeln in den gewählten Leveln.
        </p>
      )}
    </Card>
  );
}
