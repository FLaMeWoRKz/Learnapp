import { dbHelpers } from '../config/instantdb.js';
import { getRandomVocabularies, generateQuestion } from '../utils/gameHelpers.js';

export async function startGame(req, res, next) {
  try {
    const { mode, level, packId } = req.body;
    const userId = req.user.userId;

    if (!mode || !['level', 'flashcard', 'free'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid game mode' });
    }

    // Get vocabularies based on mode
    let vocabularies = [];
    
    if (mode === 'level' && level) {
      vocabularies = await dbHelpers.getVocabularies({ level });
    } else if (mode === 'flashcard') {
      // Get vocabularies from flashcard boxes
      const flashcardProgress = await dbHelpers.getFlashcardProgress(userId);
      if (flashcardProgress) {
        const allVocabIds = Object.values(flashcardProgress.boxes || {}).flat();
        // Fetch vocabularies by IDs (simplified - in production, use proper query)
        vocabularies = await dbHelpers.getVocabularies({});
        vocabularies = vocabularies.filter(v => allVocabIds.includes(v.vocabId));
      }
    } else if (mode === 'free') {
      vocabularies = await dbHelpers.getVocabularies({});
    }

    if (vocabularies.length === 0) {
      return res.status(404).json({ error: 'No vocabularies found for this mode' });
    }

    // Select random vocabularies (10-20 questions)
    const questionCount = Math.min(15, vocabularies.length);
    const selectedVocabs = getRandomVocabularies(vocabularies, questionCount);

    // Create game session
    const sessionData = {
      userId,
      mode,
      level: level || null,
      packId: packId || null,
      questions: selectedVocabs.map(v => ({
        vocabId: v.vocabId,
        answered: false,
        correct: false,
        timeSpent: 0
      })),
      score: 0,
      completed: false,
      createdAt: Date.now()
    };

    const sessionId = await dbHelpers.createGameSession(sessionData);

    res.json({
      sessionId,
      mode,
      questionCount: selectedVocabs.length,
      questions: selectedVocabs.map(v => ({
        id: v.vocabId,
        german: v.german,
        level: v.level
      }))
    });
  } catch (error) {
    next(error);
  }
}

export async function submitAnswer(req, res, next) {
  try {
    const { id: sessionId } = req.params;
    const { vocabId, answer, timeSpent } = req.body;
    const userId = req.user.userId;

    if (!vocabId || !answer) {
      return res.status(400).json({ error: 'vocabId and answer are required' });
    }

    // Get session
    const session = await dbHelpers.getGameSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Game session not found' });
    }

    if (session.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get vocabulary
    const vocabulary = await dbHelpers.getVocabularyById(vocabId);
    if (!vocabulary) {
      return res.status(404).json({ error: 'Vocabulary not found' });
    }

    // Check answer
    const isCorrect = vocabulary.english.toLowerCase().trim() === answer.toLowerCase().trim();
    
    // Update question in session
    const questionIndex = session.questions.findIndex(q => q.vocabId === vocabId);
    if (questionIndex !== -1) {
      session.questions[questionIndex].answered = true;
      session.questions[questionIndex].correct = isCorrect;
      session.questions[questionIndex].timeSpent = timeSpent || 0;
      
      if (isCorrect) {
        session.score += 100; // Base points
        if (timeSpent < 5) {
          session.score += 50; // Time bonus
        }
      }
    }

    // Update user progress
    await updateUserProgress(userId, vocabId, isCorrect, vocabulary.level);

    // Update session
    await dbHelpers.updateGameSession(sessionId, session);

    res.json({
      correct: isCorrect,
      correctAnswer: vocabulary.english,
      score: session.score
    });
  } catch (error) {
    next(error);
  }
}

export async function getGameStatus(req, res, next) {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user.userId;

    const session = await dbHelpers.getGameSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Game session not found' });
    }

    if (session.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
}

// Helper function
async function updateUserProgress(userId, vocabId, isCorrect, level) {
  let progress = await dbHelpers.getUserProgress(userId, vocabId);
  
  if (!progress) {
    progress = {
      userId,
      vocabId,
      level,
      learned: false,
      correctCount: 0,
      wrongCount: 0,
      currentBox: 1,
      packCompleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  if (isCorrect) {
    progress.correctCount++;
    progress.currentBox = Math.min(5, progress.currentBox + 1);
  } else {
    progress.wrongCount++;
    progress.currentBox = Math.max(1, progress.currentBox - 1);
  }

  progress.learned = progress.currentBox === 5;
  progress.lastReviewed = Date.now();
  progress.updatedAt = Date.now();

  await dbHelpers.updateUserProgress(progress);
}
