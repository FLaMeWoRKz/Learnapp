import { useState, useEffect } from 'react';
import { vocabAPI, progressAPI, gameAPI } from '../../services/api';
import Button from '../shared/Button';
import Card from '../shared/Card';
import ProgressBar from '../shared/ProgressBar';
import type { Vocabulary } from '../../types';

export default function LevelMode() {
  const [levels, setLevels] = useState<number[]>([]);
  const [completedPacks, setCompletedPacks] = useState<number[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Vocabulary | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadCompletedPacks();
    // Generate levels 1-15
    setLevels(Array.from({ length: 15 }, (_, i) => i + 1));
  }, []);

  const loadCompletedPacks = async () => {
    try {
      const data = await progressAPI.getCompletedPacks();
      setCompletedPacks(data.completedPacks);
    } catch (error) {
      console.error('Error loading completed packs:', error);
    }
  };

  const startGame = async (level: number) => {
    try {
      const data = await gameAPI.startGame('level', level);
      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setSelectedLevel(level);
      setGameStarted(true);
      setQuestionIndex(0);
      setScore(0);
      loadQuestion(0, data.questions);
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const loadQuestion = async (index: number, questionList: any[]) => {
    if (index >= questionList.length) {
      // Game finished
      setGameStarted(false);
      return;
    }

    const question = questionList[index];
    const vocab = await vocabAPI.getVocabularyById(question.id);
    
    // Get wrong options
    const allVocabs = await vocabAPI.getVocabularies({ level: vocab.level });
    const wrongVocabs = allVocabs.vocabularies
      .filter(v => v.vocabId !== vocab.vocabId)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const allOptions = [vocab.english, ...wrongVocabs.map(v => v.english)].sort(
      () => 0.5 - Math.random()
    );

    setCurrentQuestion(vocab);
    setOptions(allOptions);
    setSelectedAnswer(null);
  };

  const handleAnswer = async (answer: string) => {
    if (!currentQuestion || !sessionId) return;

    setSelectedAnswer(answer);
    const startTime = Date.now();
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      const result = await gameAPI.submitAnswer(
        sessionId,
        currentQuestion.vocabId,
        answer,
        timeSpent
      );

      if (result.correct) {
        setScore(result.score);
      }

      // Wait 2 seconds, then next question
      setTimeout(() => {
        const nextIndex = questionIndex + 1;
        setQuestionIndex(nextIndex);
        loadQuestion(nextIndex, questions);
      }, 2000);
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  if (gameStarted && currentQuestion) {
    return (
      <Card>
        <div className="mb-6">
          <ProgressBar
            current={questionIndex + 1}
            total={questions.length}
            label="Frage"
          />
        </div>

        <h3 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          {currentQuestion.german}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQuestion.english;
            let variant: 'primary' | 'secondary' | 'success' | 'danger' = 'secondary';

            if (isSelected) {
              variant = isCorrect ? 'success' : 'danger';
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

        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Punkte: {score}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Level-Modus</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Wähle ein Level aus. Ein Pack gilt als geschafft, wenn &gt;80% richtig beantwortet wurden.
      </p>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {levels.map((level) => {
          const isCompleted = completedPacks.includes(level);
          const isUnlocked = level === 1 || completedPacks.includes(level - 1);

          return (
            <button
              key={level}
              onClick={() => isUnlocked && startGame(level)}
              disabled={!isUnlocked}
              className={`p-4 rounded-lg font-bold text-lg transition-colors ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : isUnlocked
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {level}
              {isCompleted && ' ✓'}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
