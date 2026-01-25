import { useState, useEffect } from 'react';
import { vocabAPI, progressAPI, gameAPI } from '../../services/api';
import Button from '../shared/Button';
import Card from '../shared/Card';
import ProgressBar from '../shared/ProgressBar';
import type { Vocabulary } from '../../types';

type LevelCount = { level: number; count: number };

export default function LevelMode() {
  const [levelCounts, setLevelCounts] = useState<LevelCount[]>([]);
  const [completedPacks, setCompletedPacks] = useState<number[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Vocabulary | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<{ id: string; german: string; level: number }[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ level: number; passed: boolean; correct: number; total: number } | null>(null);

  useEffect(() => {
    loadLevelCounts();
    loadCompletedPacks();
  }, []);

  const loadLevelCounts = async () => {
    try {
      const data = await vocabAPI.getLevelCounts();
      setLevelCounts(data.levels || []);
    } catch (error) {
      console.error('Error loading level counts:', error);
    }
  };

  const loadCompletedPacks = async () => {
    try {
      const data = await progressAPI.getCompletedPacks();
      setCompletedPacks(data.completedPacks || []);
    } catch (error) {
      console.error('Error loading completed packs:', error);
    }
  };

  const startGame = async (level: number) => {
    setLastResult(null);
    try {
      const data = await gameAPI.startGame('level', level);
      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setSelectedLevel(level);
      
      // Prüfe, ob es eine laufende Session gibt und stelle den Progress wieder her
      try {
        const session = await gameAPI.getGameStatus(data.sessionId);
        const answeredCount = session.questions?.filter(q => q.answered).length || 0;
        const currentScore = session.score || 0;
        
        setQuestionIndex(answeredCount);
        setScore(currentScore);
        
        // Wenn noch nicht alle Fragen beantwortet wurden, lade die nächste Frage
        if (answeredCount < data.questions.length) {
          setGameStarted(true);
          loadQuestion(answeredCount, data.questions);
        } else {
          // Alle Fragen beantwortet, zeige Ergebnis
          await handleGameEnd();
        }
      } catch (error) {
        // Wenn Session nicht gefunden wird, starte neu
        setGameStarted(true);
        setQuestionIndex(0);
        setScore(0);
        loadQuestion(0, data.questions);
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const loadQuestion = async (index: number, questionList: { id: string; german: string; level: number }[]) => {
    if (index >= questionList.length) {
      await handleGameEnd();
      return;
    }

    const question = questionList[index];
    const vocab = await vocabAPI.getVocabularyById(question.id);
    const allVocabs = await vocabAPI.getVocabularies({ level: vocab.level });
    const wrongVocabs = allVocabs.vocabularies
      .filter((v) => v.vocabId !== vocab.vocabId)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const allOptions = [vocab.english, ...wrongVocabs.map((v) => v.english)].sort(() => 0.5 - Math.random());

    setCurrentQuestion(vocab);
    setOptions(allOptions);
    setSelectedAnswer(null);
  };

  const handleGameEnd = async () => {
    if (!sessionId || selectedLevel == null) {
      setGameStarted(false);
      return;
    }
    try {
      const session = await gameAPI.getGameStatus(sessionId);
      const total = session.questions?.length ?? 0;
      const correct = session.questions?.filter((q) => q.correct).length ?? 0;
      const passed = total > 0 && correct / total >= 0.8;

      if (passed) {
        await progressAPI.completeLevel(selectedLevel);
        await loadCompletedPacks();
      }

      setLastResult({ level: selectedLevel, passed, correct, total });
    } catch (e) {
      console.error('Error fetching game status:', e);
    }
    setGameStarted(false);
    setCurrentQuestion(null);
    setSessionId(null);
  };

  const handleAnswer = async (answer: string) => {
    if (!currentQuestion || !sessionId) return;

    setSelectedAnswer(answer);
    const startTime = Date.now();

    try {
      const result = await gameAPI.submitAnswer(
        sessionId,
        currentQuestion.vocabId,
        answer,
        Math.max(0, Math.floor((Date.now() - startTime) / 1000))
      );
      if (result.correct) setScore(result.score);

      setTimeout(() => {
        const nextIndex = questionIndex + 1;
        setQuestionIndex(nextIndex);
        loadQuestion(nextIndex, questions);
      }, 1000);
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
          {options.map((opt, i) => {
            const isSelected = selectedAnswer === opt;
            const isCorrect = opt === currentQuestion.english;
            let variant: 'primary' | 'secondary' | 'success' | 'danger' = 'secondary';
            if (isSelected) variant = isCorrect ? 'success' : 'danger';
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
        Wähle ein Level. Ein Level gilt als geschafft, wenn du alle Fragen zu Ende spielst und
        mindestens 80 % richtig beantwortest. „Zurück“ abbricht zählt nicht.
      </p>

      {lastResult && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            lastResult.passed
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
          }`}
        >
          {lastResult.passed ? (
            <p className="font-semibold">
              Level {lastResult.level} geschafft! ({lastResult.correct}/{lastResult.total} richtig)
            </p>
          ) : (
            <p className="font-semibold">
              Level {lastResult.level} nicht geschafft. Du brauchst 80 % ({lastResult.correct}/
              {lastResult.total} richtig). Spiele alle Fragen zu Ende.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {levelCounts.map(({ level, count }) => {
          const isCompleted = completedPacks.includes(level);
          const isUnlocked = level === 1 || completedPacks.includes(level - 1);
          return (
            <button
              key={level}
              onClick={() => isUnlocked && startGame(level)}
              disabled={!isUnlocked}
              className={`p-4 rounded-lg font-bold text-lg transition-colors text-left ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : isUnlocked
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="block">Level {level}</span>
              <span className="block text-sm opacity-90">({count} Vokabeln)</span>
              {isCompleted && ' ✓'}
            </button>
          );
        })}
      </div>
      {levelCounts.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 mt-4">
          Keine Level vorhanden. Importiere zuerst Vokabeln.
        </p>
      )}
    </Card>
  );
}
