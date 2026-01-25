import { dbHelpers } from '../config/instantdb.js';
import { generateRoomCode, getRandomVocabularies, generateQuestionOptions } from '../utils/gameHelpers.js';

// Store active rooms in memory (in production, use Redis or database)
const activeRooms = new Map();

export function setupGameRoomHandlers(socket, io) {
  socket.on('join-room', async (data) => {
    const { roomCode, userId, username, isSpectator } = data;
    
    const room = await dbHelpers.getGameRoomByCode(roomCode);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Add player to room
    socket.join(roomCode);
    
    const player = {
      userId,
      username,
      score: 0,
      isSpectator: isSpectator || false,
      socketId: socket.id
    };

    if (!room.players) {
      room.players = [];
    }
    
    room.players.push(player);
    await dbHelpers.updateGameRoom(room.id, room);
    activeRooms.set(roomCode, room);

    // Notify all players
    io.to(roomCode).emit('room-updated', {
      room: {
        code: room.code,
        hostId: room.hostId,
        players: room.players,
        settings: room.settings,
        status: room.status
      }
    });
  });

  socket.on('leave-room', async (data) => {
    const { roomCode, userId } = data;
    socket.leave(roomCode);
    
    const room = activeRooms.get(roomCode) || await dbHelpers.getGameRoomByCode(roomCode);
    if (room) {
      room.players = room.players.filter(p => p.userId !== userId);
      await dbHelpers.updateGameRoom(room.id, room);
      activeRooms.set(roomCode, room);

      io.to(roomCode).emit('room-updated', {
        room: {
          code: room.code,
          hostId: room.hostId,
          players: room.players,
          settings: room.settings,
          status: room.status
        }
      });
    }
  });

  socket.on('start-game', async (data) => {
    const { roomCode, userId } = data;
    
    const room = activeRooms.get(roomCode) || await dbHelpers.getGameRoomByCode(roomCode);
    if (!room || room.hostId !== userId) {
      socket.emit('error', { message: 'Not authorized' });
      return;
    }

    // Get vocabularies based on selected packs
    const vocabularies = [];
    for (const level of room.settings.selectedPacks) {
      const vocabs = await dbHelpers.getVocabularies({ level });
      vocabularies.push(...vocabs);
    }

    if (vocabularies.length === 0) {
      socket.emit('error', { message: 'No vocabularies found' });
      return;
    }

    // Select random vocabularies for rounds
    const selectedVocabs = getRandomVocabularies(vocabularies, room.settings.rounds);
    room.selectedVocabularies = selectedVocabs;
    room.currentRound = 0;
    room.status = 'playing';
    await dbHelpers.updateGameRoom(room.id, room);
    activeRooms.set(roomCode, room);

    // Start first round
    startNextRound(io, roomCode, room);
  });

  socket.on('submit-answer', async (data) => {
    const { roomCode, userId, vocabId, answer, timeSpent } = data;
    
    const room = activeRooms.get(roomCode);
    if (!room || room.status !== 'playing') {
      socket.emit('error', { message: 'Game not active' });
      return;
    }

    const player = room.players.find(p => p.userId === userId);
    if (!player || player.isSpectator) {
      socket.emit('error', { message: 'Not a player' });
      return;
    }

    // Get vocabulary
    const vocabulary = await dbHelpers.getVocabularyById(vocabId);
    if (!vocabulary) {
      socket.emit('error', { message: 'Vocabulary not found' });
      return;
    }

    const isCorrect = vocabulary.english.toLowerCase().trim() === answer.toLowerCase().trim();
    
    if (isCorrect) {
      let points = 100; // Base points
      if (timeSpent < 5) {
        points += 50; // Time bonus
      }
      player.score += points;
    }

    player.answered = true;
    player.answer = answer;
    player.isCorrect = isCorrect;

    await dbHelpers.updateGameRoom(room.id, room);
    activeRooms.set(roomCode, room);

    // Check if all players answered
    const activePlayers = room.players.filter(p => !p.isSpectator);
    const allAnswered = activePlayers.every(p => p.answered);

    if (allAnswered) {
      // Emit round result
      io.to(roomCode).emit('round-result', {
        correctAnswer: vocabulary.english,
        players: room.players.map(p => ({
          userId: p.userId,
          username: p.username,
          score: p.score,
          isCorrect: p.isCorrect
        }))
      });

      // Wait 3 seconds, then next round or finish
      setTimeout(async () => {
        if (room.currentRound < room.settings.rounds - 1) {
          room.currentRound++;
          await startNextRound(io, roomCode, room);
        } else {
          await finishGame(io, roomCode, room);
        }
      }, 3000);
    }
  });

  socket.on('use-joker', async (data) => {
    const { roomCode, userId } = data;
    
    const room = activeRooms.get(roomCode);
    const player = room?.players.find(p => p.userId === userId);
    
    if (!player || player.isSpectator) {
      socket.emit('error', { message: 'Not a player' });
      return;
    }

    // Check joker points (get from flashcard progress)
    const flashcardProgress = await dbHelpers.getFlashcardProgress(userId);
    if (!flashcardProgress || flashcardProgress.jokerPoints < 5) {
      socket.emit('error', { message: 'Not enough joker points' });
      return;
    }

    // Deduct joker points
    flashcardProgress.jokerPoints -= 5;
    await dbHelpers.updateFlashcardProgress(flashcardProgress);

    // Get current question and remove 2 wrong answers
    const currentQuestion = room.currentQuestion;
    if (currentQuestion) {
      const wrongOptions = currentQuestion.options.filter(
        opt => opt !== currentQuestion.correctAnswer
      );
      const removedOptions = wrongOptions.slice(0, 2);
      const remainingOptions = currentQuestion.options.filter(
        opt => !removedOptions.includes(opt)
      );

      socket.emit('joker-used', {
        removedOptions,
        remainingOptions
      });
    }
  });

  socket.on('next-round', async (data) => {
    const { roomCode, userId } = data;
    
    const room = activeRooms.get(roomCode);
    if (!room || room.hostId !== userId) {
      socket.emit('error', { message: 'Not authorized' });
      return;
    }

    if (room.currentRound < room.settings.rounds - 1) {
      room.currentRound++;
      await startNextRound(io, roomCode, room);
    } else {
      await finishGame(io, roomCode, room);
    }
  });
}

async function startNextRound(io, roomCode, room) {
  const vocab = room.selectedVocabularies[room.currentRound];
  const vocabulary = await dbHelpers.getVocabularyById(vocab.vocabId);
  
  if (!vocabulary) {
    io.to(roomCode).emit('error', { message: 'Vocabulary not found' });
    return;
  }

  // Get wrong options
  const allVocabs = await dbHelpers.getVocabularies({ level: vocabulary.level });
  const wrongOptions = getRandomVocabularies(
    allVocabs.filter(v => v.vocabId !== vocabulary.vocabId),
    3
  ).map(v => v.english);

  const options = generateQuestionOptions(vocabulary.english, wrongOptions);
  
  room.currentQuestion = {
    vocabId: vocabulary.vocabId,
    question: vocabulary.german,
    options,
    correctAnswer: vocabulary.english,
    startTime: Date.now()
  };

  // Reset player answers
  room.players.forEach(p => {
    p.answered = false;
    p.answer = null;
    p.isCorrect = false;
  });

  await dbHelpers.updateGameRoom(room.id, room);
  activeRooms.set(roomCode, room);

  io.to(roomCode).emit('question', {
    round: room.currentRound + 1,
    totalRounds: room.settings.rounds,
    question: room.currentQuestion,
    timer: room.settings.timerEnabled ? room.settings.timerDuration : null
  });
}

async function finishGame(io, roomCode, room) {
  room.status = 'finished';
  await dbHelpers.updateGameRoom(room.id, room);
  activeRooms.delete(roomCode);

  // Sort players by score
  const leaderboard = room.players
    .filter(p => !p.isSpectator)
    .sort((a, b) => b.score - a.score)
    .map((p, index) => ({
      rank: index + 1,
      userId: p.userId,
      username: p.username,
      score: p.score
    }));

  io.to(roomCode).emit('game-finished', {
    leaderboard
  });
}

export async function createRoom(req, res, next) {
  try {
    const userId = req.user.userId;
    const { settings } = req.body;

    if (!settings || !settings.rounds || !settings.selectedPacks) {
      return res.status(400).json({ error: 'Settings with rounds and selectedPacks are required' });
    }

    const code = generateRoomCode();
    const now = Date.now();

    const roomData = {
      code,
      hostId: userId,
      players: [{
        userId,
        username: req.user.username,
        score: 0,
        isSpectator: false,
        socketId: null
      }],
      settings: {
        rounds: settings.rounds,
        selectedPacks: settings.selectedPacks,
        timerEnabled: settings.timerEnabled || false,
        timerDuration: settings.timerDuration || 20
      },
      currentRound: 0,
      currentQuestion: null,
      status: 'waiting',
      createdAt: now,
      updatedAt: now
    };

    const roomId = await dbHelpers.createGameRoom(roomData);
    activeRooms.set(code, { ...roomData, id: roomId });

    res.json({
      roomId,
      code,
      room: roomData
    });
  } catch (error) {
    next(error);
  }
}

export async function joinRoom(req, res, next) {
  try {
    const { code } = req.body;
    const userId = req.user.userId;

    const room = await dbHelpers.getGameRoomByCode(code);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({ error: 'Game already started' });
    }

    // Check if already in room
    const alreadyInRoom = room.players.some(p => p.userId === userId);
    if (alreadyInRoom) {
      return res.json({ room });
    }

    res.json({ room });
  } catch (error) {
    next(error);
  }
}

export async function getRoomInfo(req, res, next) {
  try {
    const { code } = req.params;
    const userId = req.user.userId;

    const room = activeRooms.get(code) || await dbHelpers.getGameRoomByCode(code);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ room });
  } catch (error) {
    next(error);
  }
}

export async function startGame(req, res, next) {
  try {
    const { code } = req.params;
    const userId = req.user.userId;

    const room = activeRooms.get(code) || await dbHelpers.getGameRoomByCode(code);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.hostId !== userId) {
      return res.status(403).json({ error: 'Only host can start the game' });
    }

    // Game start is handled via Socket.io
    res.json({ message: 'Game start initiated via socket' });
  } catch (error) {
    next(error);
  }
}

export async function submitAnswer(req, res, next) {
  try {
    // Answers are handled via Socket.io
    res.json({ message: 'Answers should be submitted via socket.io' });
  } catch (error) {
    next(error);
  }
}
