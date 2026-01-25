import { useState, useEffect } from 'react';
import { progressAPI, vocabAPI } from '../../services/api';
import Button from '../shared/Button';
import Card from '../shared/Card';
import type { FlashcardProgress, Vocabulary } from '../../types';

export default function FlashcardBox() {
  const [flashcardProgress, setFlashcardProgress] = useState<FlashcardProgress | null>(null);
  const [currentBox, setCurrentBox] = useState<number>(1);
  const [currentVocab, setCurrentVocab] = useState<Vocabulary | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    loadFlashcardProgress();
  }, []);

  const loadFlashcardProgress = async () => {
    try {
      const data = await progressAPI.getFlashcardStatus();
      setFlashcardProgress(data);
      loadNextVocab(data, currentBox);
    } catch (error) {
      console.error('Error loading flashcard progress:', error);
    }
  };

  const loadNextVocab = async (progress: FlashcardProgress, boxNumber: number) => {
    const vocabIds = progress.boxes[boxNumber] || [];
    if (vocabIds.length === 0) {
      setCurrentVocab(null);
      return;
    }

    const randomId = vocabIds[Math.floor(Math.random() * vocabIds.length)];
    try {
      const vocab = await vocabAPI.getVocabularyById(randomId);
      setCurrentVocab(vocab);
      setShowAnswer(false);
    } catch (error) {
      console.error('Error loading vocabulary:', error);
    }
  };

  const handleAnswer = async (isCorrect: boolean) => {
    if (!currentVocab || !flashcardProgress) return;

    const newBox = isCorrect
      ? Math.min(5, currentBox + 1)
      : Math.max(1, currentBox - 1);

    // Update boxes
    const newBoxes = { ...flashcardProgress.boxes };
    newBoxes[currentBox] = newBoxes[currentBox].filter(id => id !== currentVocab.vocabId);
    if (!newBoxes[newBox]) {
      newBoxes[newBox] = [];
    }
    newBoxes[newBox].push(currentVocab.vocabId);

    // Award joker point if moved up
    let newJokerPoints = flashcardProgress.jokerPoints;
    if (isCorrect && newBox > currentBox) {
      newJokerPoints += 1;
    }

    const updatedProgress: FlashcardProgress = {
      ...flashcardProgress,
      boxes: newBoxes,
      jokerPoints: newJokerPoints,
      updatedAt: Date.now(),
    };

    // Update progress in backend
    await progressAPI.updateProgress(currentVocab.vocabId, isCorrect, currentVocab.level);

    setFlashcardProgress(updatedProgress);
    setCurrentBox(newBox);
    loadNextVocab(updatedProgress, newBox);
  };

  if (!flashcardProgress) {
    return <Card>Lädt...</Card>;
  }

  if (!currentVocab) {
    return (
      <Card>
        <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Karteikasten</h3>
        <p className="text-gray-600 dark:text-gray-300">
          Box {currentBox} ist leer. Wähle eine andere Box.
        </p>
        <div className="mt-6 flex gap-2">
          {[1, 2, 3, 4, 5].map((box) => (
            <Button
              key={box}
              variant={box === currentBox ? 'primary' : 'secondary'}
              onClick={() => {
                setCurrentBox(box);
                loadNextVocab(flashcardProgress, box);
              }}
            >
              Box {box} ({flashcardProgress.boxes[box]?.length || 0})
            </Button>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Karteikasten</h3>
          <p className="text-lg font-semibold text-primary-600">
            Joker-Punkte: {flashcardProgress.jokerPoints}
          </p>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((box) => (
            <button
              key={box}
              onClick={() => {
                setCurrentBox(box);
                loadNextVocab(flashcardProgress, box);
              }}
              className={`px-3 py-1 rounded ${
                box === currentBox
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Box {box} ({flashcardProgress.boxes[box]?.length || 0})
            </button>
          ))}
        </div>
      </div>

      <div className="text-center mb-8">
        <h4 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          {currentVocab.german}
        </h4>
        {showAnswer && (
          <p className="text-2xl text-primary-600 font-semibold">{currentVocab.english}</p>
        )}
      </div>

      {!showAnswer ? (
        <Button fullWidth size="lg" onClick={() => setShowAnswer(true)}>
          Antwort anzeigen
        </Button>
      ) : (
        <div className="flex gap-4">
          <Button
            fullWidth
            variant="danger"
            size="lg"
            onClick={() => handleAnswer(false)}
          >
            Falsch
          </Button>
          <Button
            fullWidth
            variant="success"
            size="lg"
            onClick={() => handleAnswer(true)}
          >
            Richtig
          </Button>
        </div>
      )}
    </Card>
  );
}
