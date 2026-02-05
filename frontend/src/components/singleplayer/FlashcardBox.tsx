import { useState, useEffect } from 'react';
import { progressAPI, vocabAPI } from '../../services/api';
import Button from '../shared/Button';
import Card from '../shared/Card';
import type { FlashcardProgress, Vocabulary } from '../../types';

type LevelItem = { level: number | string; count: number; custom?: boolean; name?: string };
type FlashcardData = FlashcardProgress & {
  levelCounts?: LevelItem[];
  levelBoxCounts?: Record<number | string, Record<number, number>>;
  vocabLevels?: Record<string, number | string>;
};

export default function FlashcardBox() {
  const [data, setData] = useState<FlashcardData | null>(null);
  const [selectedLevels, setSelectedLevels] = useState<(number | string)[]>([]);
  const [currentBox, setCurrentBox] = useState<number>(1);
  const [currentVocab, setCurrentVocab] = useState<Vocabulary | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [levelSelectionExpanded, setLevelSelectionExpanded] = useState(true);

  useEffect(() => {
    loadFlashcardProgress();
  }, []);

  useEffect(() => {
    // Automatisch Vokabel laden wenn Level und Box ausgewählt sind, aber noch keine Vokabel geladen wurde
    if (data && selectedLevels.length > 0 && currentBox > 0 && !currentVocab) {
      const ids = idsForBoxAndLevels(data, currentBox, selectedLevels);
      if (ids.length > 0) {
        loadNextVocab(data, currentBox, selectedLevels);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, selectedLevels, currentBox, currentVocab]);

  const loadFlashcardProgress = async () => {
    try {
      const res = await progressAPI.getFlashcardStatus();
      setData(res as FlashcardData);
      setCurrentVocab(null);
      if (res.levelCounts && res.levelCounts.length > 0 && selectedLevels.length === 0) {
        setSelectedLevels([res.levelCounts[0].level]);
        setCurrentBox(1);
      }
    } catch (error) {
      console.error('Error loading flashcard progress:', error);
    }
  };

  const idsForBoxAndLevel = (d: FlashcardData, boxNumber: number, level: number | string): string[] => {
    if (!d?.boxes || !d.vocabLevels) return [];
    const ids = d.boxes[boxNumber] || [];
    return ids.filter((id) => d.vocabLevels![id] === level);
  };

  const idsForBoxAndLevels = (d: FlashcardData, boxNumber: number, levels: (number | string)[]): string[] => {
    if (!d?.boxes || !d.vocabLevels) return [];
    const ids = d.boxes[boxNumber] || [];
    return ids.filter((id) => levels.includes(d.vocabLevels![id]));
  };

  const loadNextVocab = async (d: FlashcardData, boxNumber: number, levels: (number | string)[]) => {
    const ids = idsForBoxAndLevels(d, boxNumber, levels);
    if (ids.length === 0) {
      setCurrentVocab(null);
      return;
    }
    const randomId = ids[Math.floor(Math.random() * ids.length)];
    try {
      const vocab = await vocabAPI.getVocabularyById(randomId);
      
      const numericLevels = levels.filter((l): l is number => typeof l === 'number');
      const customPackIds = levels.filter((l): l is string => typeof l === 'string');
      const allVocabLists: { vocabularies: { vocabId: string; english: string }[] }[] = [];
      if (numericLevels.length > 0) {
        const r = await vocabAPI.getVocabularies({ levels: numericLevels });
        allVocabLists.push(r);
      }
      for (const packId of customPackIds) {
        const r = await vocabAPI.getVocabularies({ customPackId: packId });
        allVocabLists.push(r);
      }
      const allVocabs = allVocabLists.flatMap((x) => x.vocabularies || []);
      const wrongVocabs = allVocabs
        .filter((v) => v.vocabId !== vocab.vocabId)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      const allOptions = [vocab.english, ...wrongVocabs.map((v) => v.english)].sort(
        () => 0.5 - Math.random()
      );
      
      setCurrentVocab(vocab);
      setOptions(allOptions);
      setShowAnswer(false);
      setSelectedAnswer(null);
    } catch (error) {
      console.error('Error loading vocabulary:', error);
    }
  };

  const handleAnswer = async (answer: string) => {
    if (!currentVocab || !data || selectedLevels.length === 0) return;
    
    const isCorrect = answer === currentVocab.english;
    setSelectedAnswer(answer);

    // Nur wenn richtig beantwortet, Box erhöhen
    const newBox = isCorrect
      ? Math.min(5, currentBox + 1)
      : Math.max(1, currentBox - 1);

    const newBoxes = { ...data.boxes };
    newBoxes[currentBox] = (newBoxes[currentBox] || []).filter((id) => id !== currentVocab.vocabId);
    if (!newBoxes[newBox]) newBoxes[newBox] = [];
    newBoxes[newBox].push(currentVocab.vocabId);

    let newJokerPoints = data.jokerPoints;
    if (isCorrect && newBox > currentBox) newJokerPoints += 1;

    const updated: FlashcardData = {
      ...data,
      boxes: newBoxes,
      jokerPoints: newJokerPoints,
      updatedAt: Date.now(),
    };
    
    const vocabLevelKey = data.vocabLevels?.[currentVocab.vocabId] ?? ((currentVocab as Vocabulary & { packId?: string }).packId ?? currentVocab.level);
    if (updated.levelBoxCounts && updated.levelBoxCounts[vocabLevelKey]) {
      const lc = { ...updated.levelBoxCounts[vocabLevelKey] };
      lc[currentBox] = Math.max(0, (lc[currentBox] ?? 0) - 1);
      lc[newBox] = (lc[newBox] ?? 0) + 1;
      updated.levelBoxCounts = { ...updated.levelBoxCounts, [vocabLevelKey]: lc };
    }
    if (updated.vocabLevels) {
      updated.vocabLevels[currentVocab.vocabId] = vocabLevelKey;
    }

    await progressAPI.updateProgress(currentVocab.vocabId, isCorrect, typeof vocabLevelKey === 'number' ? vocabLevelKey : 0);
    await progressAPI.updateFlashcardProgress(newBoxes, newJokerPoints);

    setData(updated);
    // WICHTIG: currentBox NICHT ändern - Benutzer bleibt in der aktuellen Box
    // Die Vokabel springt in die neue Box, aber der Benutzer bleibt in der aktuellen Box
    
    // Nach 1 Sekunde zur nächsten Vokabel aus der aktuellen Box
    setTimeout(() => {
      setCurrentVocab(null);
      setSelectedAnswer(null);
    }, 1000);
  };

  const toggleLevel = (level: number | string) => {
    setSelectedLevels((prev) => {
      const next = prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level];
      return typeof level === 'number'
        ? next.sort((a, b) => (typeof a === 'number' && typeof b === 'number' ? a - b : 0))
        : next;
    });
    setCurrentVocab(null);
  };

  const selectBox = (box: number) => {
    setCurrentBox(box);
    setCurrentVocab(null);
    // loadNextVocab wird durch useEffect aufgerufen
  };

  if (!data) {
    return <Card>Lädt...</Card>;
  }

  const levelCounts = data.levelCounts || [];
  const levelBoxCounts = data.levelBoxCounts || {};

  // Berechne Box-Counts für alle ausgewählten Level
  const boxCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const level of selectedLevels) {
    const counts = levelBoxCounts[level] || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (let b = 1; b <= 5; b++) {
      boxCounts[b] += counts[b] || 0;
    }
  }
  const totalInLevel = [1, 2, 3, 4, 5].reduce((s, b) => s + (boxCounts[b] || 0), 0);
  const countByLevel: Record<number | string, number> = Object.fromEntries(levelCounts.map((l) => [l.level, l.count]));
  const totalSelected = selectedLevels.reduce<number>((s, l) => s + (countByLevel[l] ?? 0), 0);

  // Wenn keine Level ausgewählt sind, zeige nur Level-Auswahl
  if (selectedLevels.length === 0) {
    return (
      <Card>
        <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Karteikasten</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Wähle ein oder mehrere Level aus (mehrfach wählbar). Anschließend siehst du, wie viele Vokabeln der ausgewählten Level in welcher Box liegen.
        </p>
        <div className="flex flex-wrap gap-3">
          {levelCounts.map((item) => {
            const { level, count, custom, name } = item;
            const checked = selectedLevels.includes(level);
            const label = custom ? (name || 'Custom') : `Level ${level}`;
            return (
              <label
                key={String(level)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                  checked
                    ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-500 text-primary-800 dark:text-primary-200'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleLevel(level)}
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
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            💡 Tipp: Du kannst mehrere Level gleichzeitig auswählen, indem du mehrere Checkboxen aktivierst.
          </p>
        )}
        {levelCounts.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 mt-4">
            Keine Level vorhanden. Importiere zuerst Vokabeln.
          </p>
        )}
      </Card>
    );
  }

  // Level gewählt, Karte wird nicht angezeigt
  if (!currentVocab) {
    return (
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Karteikasten</h3>
          <div className="flex items-center gap-3">
            <p className="text-lg font-semibold text-primary-600">
              Joker-Punkte: {data.jokerPoints}
            </p>
          </div>
        </div>

        {/* Level-Auswahl (minimierbar) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Level auswählen (mehrfach wählbar)
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
                  const { level, count, custom, name } = item;
                  const checked = selectedLevels.includes(level);
                  const label = custom ? (name || 'Custom') : `Level ${level}`;
                  return (
                    <label
                      key={String(level)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                        checked
                          ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-500 text-primary-800 dark:text-primary-200'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleLevel(level)}
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
                  {selectedLevels.length} Level ausgewählt · {totalSelected} Vokabeln gesamt
                </p>
              )}
            </>
          )}
          {!levelSelectionExpanded && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedLevels.length} Level ausgewählt · {totalSelected} Vokabeln gesamt
            </p>
          )}
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {totalInLevel} Vokabeln in den Boxen
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((box) => (
            <Button
              key={box}
              variant={box === currentBox ? 'primary' : 'secondary'}
              onClick={() => selectBox(box)}
            >
              Box {box} ({boxCounts[box] ?? 0})
            </Button>
          ))}
        </div>
        {totalInLevel === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            Keine Vokabeln aus den ausgewählten Leveln in den Boxen. Beim ersten Start werden alle Vokabeln in Box 1 geladen.
          </p>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            Wähle eine Box zum Üben. Box {currentBox} hat {boxCounts[currentBox] ?? 0} Vokabeln aus den ausgewählten Leveln.
          </p>
        )}
      </Card>
    );
  }

  // Kartenansicht
  return (
    <Card>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Karteikasten</h3>
          <p className="text-lg font-semibold text-primary-600">
            Joker-Punkte: {data.jokerPoints}
          </p>
        </div>

        {/* Level-Auswahl (minimierbar) */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Level auswählen (mehrfach wählbar)
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
                  const { level, count, custom, name } = item;
                  const checked = selectedLevels.includes(level);
                  const label = custom ? (name || 'Custom') : `Level ${level}`;
                  return (
                    <label
                      key={String(level)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                        checked
                          ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-500 text-primary-800 dark:text-primary-200'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleLevel(level)}
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
                  {selectedLevels.length} Level ausgewählt · {totalSelected} Vokabeln gesamt
                </p>
              )}
            </>
          )}
          {!levelSelectionExpanded && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedLevels.length} Level ausgewählt · {totalSelected} Vokabeln gesamt
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-2 items-center">
          {[1, 2, 3, 4, 5].map((box) => (
            <button
              key={box}
              onClick={() => selectBox(box)}
              className={`px-3 py-1 rounded ${
                box === currentBox
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Box {box} ({boxCounts[box] ?? 0})
            </button>
          ))}
        </div>
      </div>

      <div className="text-center mb-8">
        <h4 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          {currentVocab.german}
        </h4>
        {selectedAnswer !== null && (
          <p className={`text-xl font-semibold ${
            selectedAnswer === currentVocab.english ? 'text-green-600' : 'text-red-600'
          }`}>
            {selectedAnswer === currentVocab.english ? '✓ Richtig!' : `✗ Falsch. Richtig: ${currentVocab.english}`}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {options.map((opt, i) => {
          const isSelected = selectedAnswer === opt;
          const isCorrect = opt === currentVocab.english;
          
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
    </Card>
  );
}
