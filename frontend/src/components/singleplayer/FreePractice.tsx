import { useState, useEffect } from 'react';
import { vocabAPI } from '../../services/api';
import Button from '../shared/Button';
import Card from '../shared/Card';
import type { Vocabulary } from '../../types';

export default function FreePractice() {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [currentVocab, setCurrentVocab] = useState<Vocabulary | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    loadVocabularies();
  }, [selectedLevel]);

  const loadVocabularies = async () => {
    try {
      const data = await vocabAPI.getVocabularies({ level: selectedLevel });
      setVocabularies(data.vocabularies);
      if (data.vocabularies.length > 0) {
        loadRandomQuestion(data.vocabularies);
      }
    } catch (error) {
      console.error('Error loading vocabularies:', error);
    }
  };

  const loadRandomQuestion = (vocabList: Vocabulary[]) => {
    const randomVocab = vocabList[Math.floor(Math.random() * vocabList.length)];
    const wrongVocabs = vocabList
      .filter(v => v.vocabId !== randomVocab.vocabId)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const allOptions = [randomVocab.english, ...wrongVocabs.map(v => v.english)].sort(
      () => 0.5 - Math.random()
    );

    setCurrentVocab(randomVocab);
    setOptions(allOptions);
    setSelectedAnswer(null);
    setCorrect(null);
  };

  const handleAnswer = (answer: string) => {
    if (!currentVocab) return;

    const isCorrect = answer === currentVocab.english;
    setSelectedAnswer(answer);
    setCorrect(isCorrect);

    // Next question after 2 seconds
    setTimeout(() => {
      loadRandomQuestion(vocabularies);
    }, 2000);
  };

  return (
    <Card>
      <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Freies Üben</h3>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Level wählen
        </label>
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          {Array.from({ length: 15 }, (_, i) => i + 1).map((level) => (
            <option key={level} value={level}>
              Level {level}
            </option>
          ))}
        </select>
      </div>

      {currentVocab && (
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
            {options.map((option, index) => {
              let variant: 'primary' | 'secondary' | 'success' | 'danger' = 'secondary';

              if (selectedAnswer === option) {
                variant = option === currentVocab.english ? 'success' : 'danger';
              }

              return (
                <Button
                  key={index}
                  variant={variant}
                  size="lg"
                  onClick={() => !selectedAnswer && handleAnswer(option)}
                  disabled={!!selectedAnswer}
                >
                  {option}
                </Button>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}
