import { dbHelpers } from '../config/instantdb.js';
import { generateRoomCode, getRandomVocabularies, generateQuestionOptions } from '../utils/gameHelpers.js';

// Store active rooms in memory (in production, use Redis or database)
const activeRooms = new Map();

export function setupGameRoomHandlers(socket, io) {
  socket.on('join-room', async (data) => {
    try {
      console.log('👋 join-room event received:', data);
      const { roomCode, userId, username, isSpectator } = data;
      
      if (!roomCode || !userId) {
        console.log('❌ Missing roomCode or userId');
        socket.emit('error', { message: 'Room code and user ID required' });
        return;
      }

      const room = await dbHelpers.getGameRoomByCode(roomCode);
      if (!room) {
        console.log('❌ Room not found:', roomCode);
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Add player to room
      socket.join(roomCode);
      console.log(`✅ Socket ${socket.id} joined room ${roomCode}`);
      
      const player = {
        userId,
        username,
        score: 0,
        isSpectator: isSpectator || false,
        socketId: socket.id
      };

      // Parse players if stored as string
      let players = typeof room.players === 'string' 
        ? JSON.parse(room.players) 
        : (room.players || []);
      
      // Check if player already exists
      const existingPlayerIndex = players.findIndex(p => p.userId === userId);
      if (existingPlayerIndex >= 0) {
        // Update existing player
        console.log(`🔄 Updating existing player: ${userId}`);
        players[existingPlayerIndex] = { ...players[existingPlayerIndex], socketId: socket.id };
      } else {
        // Add new player
        console.log(`➕ Adding new player: ${userId} (${username})`);
        players.push(player);
      }
      
      room.players = JSON.stringify(players);
      await dbHelpers.updateGameRoom(room.id, { players: room.players, updatedAt: Date.now() });
      activeRooms.set(roomCode, room);

      console.log(`✅ Room ${roomCode} now has ${players.length} player(s)`);

      // Notify all players
      io.to(roomCode).emit('room-updated', {
        room: {
          code: room.code,
          hostId: room.hostId,
          players, // Send parsed array
          settings: typeof room.settings === 'string' ? JSON.parse(room.settings) : room.settings,
          status: room.status
        }
      });
    } catch (error) {
      console.error('🚨 CRITICAL ERROR in join-room handler:', error);
      console.error('Error stack:', error.stack);
      socket.emit('error', { 
        message: 'Fehler beim Beitreten',
        details: error.message 
      });
    }
  });

  socket.on('leave-room', async (data) => {
    const { roomCode, userId } = data;
    socket.leave(roomCode);
    
    const room = activeRooms.get(roomCode) || await dbHelpers.getGameRoomByCode(roomCode);
    if (room) {
      let players = typeof room.players === 'string' 
        ? JSON.parse(room.players) 
        : (room.players || []);
      players = players.filter(p => p.userId !== userId);
      room.players = JSON.stringify(players);
      await dbHelpers.updateGameRoom(room.id, room);
      activeRooms.set(roomCode, room);

      io.to(roomCode).emit('room-updated', {
        room: {
          code: room.code,
          hostId: room.hostId,
          players, // Send parsed array
          settings: typeof room.settings === 'string' ? JSON.parse(room.settings) : room.settings,
          status: room.status
        }
      });
    }
  });

  socket.on('start-game', async (data) => {
    try {
      console.log('🚀 start-game event received:', data);
      const { roomCode, userId } = data;
      
      if (!roomCode || !userId) {
        console.log('❌ Missing roomCode or userId');
        socket.emit('error', { message: 'Room code and user ID required' });
        return;
      }

      const room = activeRooms.get(roomCode) || await dbHelpers.getGameRoomByCode(roomCode);
      if (!room) {
        console.log('❌ Room not found:', roomCode);
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.hostId !== userId) {
        console.log('❌ User is not host. Host:', room.hostId, 'User:', userId);
        socket.emit('error', { message: 'Not authorized' });
        return;
      }

      // Parse settings if stored as string
      const settings = typeof room.settings === 'string' 
        ? JSON.parse(room.settings) 
        : room.settings;

      console.log('🎮 Game settings:', settings);

      // Get vocabularies based on selected packs
      const vocabularies = [];
      for (const level of settings.selectedPacks) {
        console.log('📚 Loading vocabularies for level:', level);
        const vocabs = await dbHelpers.getVocabularies({ level });
        console.log(`   Found ${vocabs.length} vocabularies for level ${level}`);
        vocabularies.push(...vocabs);
      }

      if (vocabularies.length === 0) {
        console.log('❌ No vocabularies found for selected packs');
        socket.emit('error', { message: 'No vocabularies found' });
        return;
      }

      console.log(`✅ Total vocabularies loaded: ${vocabularies.length}`);

      // Select random vocabularies for rounds
      const selectedVocabs = getRandomVocabularies(vocabularies, settings.rounds);
      console.log(`🎲 Selected ${selectedVocabs.length} random vocabularies for game`);

      // WICHTIG: Speichere selectedVocabularies als JSON String!
      room.selectedVocabularies = selectedVocabs; // In Memory OK
      room.currentRound = 0;
      room.status = 'playing';
      
      // Für InstantDB Update: Konvertiere zu String wenn nötig
      const updateData = {
        status: 'playing',
        currentRound: 0,
        updatedAt: Date.now()
      };
      
      console.log('💾 Updating room in database...');
      await dbHelpers.updateGameRoom(room.id, updateData);
      activeRooms.set(roomCode, room);

      console.log('✅ Room updated, starting first round...');
      // Start first round
      startNextRound(io, roomCode, room);
    } catch (error) {
      // KRITISCH: Fange alle Fehler ab!
      console.error('🚨 CRITICAL ERROR in start-game handler:', error);
      console.error('Error stack:', error.stack);
      socket.emit('error', { 
        message: 'Fehler beim Starten des Spiels',
        details: error.message 
      });
    }
  });

  socket.on('submit-answer', async (data) => {
    try {
      console.log('📝 submit-answer event received:', data);
      const { roomCode, userId, vocabId, answer, timeSpent } = data;
      
      if (!roomCode || !userId || !vocabId || answer === undefined) {
        console.log('❌ Missing required fields');
        socket.emit('error', { message: 'Missing required fields' });
        return;
      }

      const room = activeRooms.get(roomCode);
      if (!room || room.status !== 'playing') {
        console.log('❌ Game not active for room:', roomCode);
        socket.emit('error', { message: 'Game not active' });
        return;
      }

      // Parse players if stored as string
      const players = typeof room.players === 'string' 
        ? JSON.parse(room.players) 
        : (room.players || []);

      const player = players.find(p => p.userId === userId);
      if (!player || player.isSpectator) {
        console.log('❌ Not a player or is spectator:', userId);
        socket.emit('error', { message: 'Not a player' });
        return;
      }

      // Get vocabulary
      const vocabulary = await dbHelpers.getVocabularyById(vocabId);
      if (!vocabulary) {
        console.log('❌ Vocabulary not found:', vocabId);
        socket.emit('error', { message: 'Vocabulary not found' });
        return;
      }

      const isCorrect = vocabulary.english.toLowerCase().trim() === answer.toLowerCase().trim();
      console.log(`${isCorrect ? '✅' : '❌'} Answer from ${userId}: "${answer}" (correct: "${vocabulary.english}")`);
      
      if (isCorrect) {
        let points = 500; // Base points
        // Speed bonus: up to 500 additional points for instant answers
        // Bonus decreases linearly: 500 points at 0s, 0 points at 20s
        const maxTime = 20; // Maximum time for full bonus
        const speedBonus = Math.max(0, 500 * (1 - timeSpent / maxTime));
        points += Math.round(speedBonus);
        player.score += points;
        console.log(`   Points awarded: ${points} (base: 500, speed bonus: ${Math.round(speedBonus)})`);
      }

      player.answered = true;
      player.answer = answer;
      player.isCorrect = isCorrect;

      room.players = JSON.stringify(players);
      await dbHelpers.updateGameRoom(room.id, { players: room.players, updatedAt: Date.now() });
      activeRooms.set(roomCode, room);

      // Check if all players answered (but wait at least 2 seconds after question start)
      const activePlayers = players.filter(p => !p.isSpectator);
      const allAnswered = activePlayers.every(p => p.answered);
      const timeSinceQuestionStart = Math.floor((Date.now() - (room.currentQuestion?.startTime || Date.now())) / 1000);
      const minWaitTime = 2; // Minimum 2 seconds before proceeding

      console.log(`   All answered: ${allAnswered}, Time since start: ${timeSinceQuestionStart}s`);

      if (allAnswered && timeSinceQuestionStart >= minWaitTime) {
        console.log('🏁 All players answered, showing results...');
        // Emit round result
        io.to(roomCode).emit('round-result', {
          correctAnswer: vocabulary.english,
          players: players.map(p => ({
            userId: p.userId,
            username: p.username,
            score: p.score,
            isCorrect: p.isCorrect
          }))
        });

        // Wait 3 seconds, then next round or finish
        setTimeout(async () => {
          try {
            const settings = typeof room.settings === 'string' ? JSON.parse(room.settings) : room.settings;
            if (room.currentRound < settings.rounds - 1) {
              room.currentRound++;
              await startNextRound(io, roomCode, room);
            } else {
              await finishGame(io, roomCode, room);
            }
          } catch (error) {
            console.error('🚨 Error in delayed round transition:', error);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('🚨 CRITICAL ERROR in submit-answer handler:', error);
      console.error('Error stack:', error.stack);
      socket.emit('error', { 
        message: 'Fehler beim Absenden der Antwort',
        details: error.message 
      });
    }
  });

  socket.on('use-joker', async (data) => {
    const { roomCode, userId } = data;
    
    const room = activeRooms.get(roomCode);
    const players = typeof room?.players === 'string' 
      ? JSON.parse(room.players) 
      : (room?.players || []);
    const player = players.find(p => p.userId === userId);
    
    if (!player || player.isSpectator) {
      socket.emit('error', { message: 'Not a player' });
      return;
    }

    // Check joker points (get from flashcard progress)
    const flashcardProgress = await dbHelpers.getFlashcardProgress(userId);
    const boxes = typeof flashcardProgress?.boxes === 'string' 
      ? JSON.parse(flashcardProgress.boxes) 
      : flashcardProgress?.boxes;
      
    if (!flashcardProgress || flashcardProgress.jokerPoints < 5) {
      socket.emit('error', { message: 'Not enough joker points' });
      return;
    }

    // Deduct joker points
    flashcardProgress.jokerPoints -= 5;
    flashcardProgress.boxes = JSON.stringify(boxes);
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

    const settings = typeof room.settings === 'string' ? JSON.parse(room.settings) : room.settings;
    if (room.currentRound < settings.rounds - 1) {
      room.currentRound++;
      await startNextRound(io, roomCode, room);
    } else {
      await finishGame(io, roomCode, room);
    }
  });
}

async function startNextRound(io, roomCode, room) {
  try {
    console.log(`🎮 Starting round ${room.currentRound + 1} for room ${roomCode}`);
    
    const vocab = room.selectedVocabularies[room.currentRound];
    if (!vocab) {
      console.error('❌ No vocabulary found for current round');
      io.to(roomCode).emit('error', { message: 'No vocabulary for this round' });
      return;
    }

    const vocabulary = await dbHelpers.getVocabularyById(vocab.vocabId);
    
    if (!vocabulary) {
      console.error('❌ Vocabulary not found in database:', vocab.vocabId);
      io.to(roomCode).emit('error', { message: 'Vocabulary not found' });
      return;
    }

    console.log(`📖 Question word: ${vocabulary.german} → ${vocabulary.english}`);

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
    const players = typeof room.players === 'string' 
      ? JSON.parse(room.players) 
      : (room.players || []);
    players.forEach(p => {
      p.answered = false;
      p.answer = null;
      p.isCorrect = false;
    });
    room.players = JSON.stringify(players);

    await dbHelpers.updateGameRoom(room.id, { 
      players: room.players, 
      currentRound: room.currentRound,
      updatedAt: Date.now() 
    });
    activeRooms.set(roomCode, room);

    const settings = typeof room.settings === 'string' ? JSON.parse(room.settings) : room.settings;
    
    console.log(`✅ Emitting question to room ${roomCode}`);
    io.to(roomCode).emit('question', {
      round: room.currentRound + 1,
      totalRounds: settings.rounds,
      question: room.currentQuestion,
      timer: settings.timerEnabled ? settings.timerDuration : null
    });

    // Auto-answer for bots
    const bots = players.filter(p => p.isBot);
    if (bots.length > 0) {
      console.log(`🤖 ${bots.length} bot(s) will answer automatically`);
    }
    bots.forEach(bot => {
      // Random delay between 3-8 seconds (give human players more time)
      const delay = Math.random() * 5000 + 3000;
      setTimeout(async () => {
        try {
          // 75% chance to answer correctly
          const isCorrect = Math.random() < 0.75;
          let answer;
          if (isCorrect) {
            answer = vocabulary.english;
          } else {
            // Pick a random wrong option
            const wrongOptions = options.filter(opt => opt !== vocabulary.english);
            answer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
          }
          
          const timeSpent = Math.floor(delay / 1000);
          
          // Process bot answer
          const isAnswerCorrect = answer.toLowerCase().trim() === vocabulary.english.toLowerCase().trim();
          
          if (isAnswerCorrect) {
            let points = 500; // Base points
            // Speed bonus: up to 500 additional points for instant answers
            const maxTime = 20;
            const speedBonus = Math.max(0, 500 * (1 - timeSpent / maxTime));
            points += Math.round(speedBonus);
            bot.score += points;
          }
          
          bot.answered = true;
          bot.answer = answer;
          bot.isCorrect = isAnswerCorrect;
          
          room.players = JSON.stringify(players);
          await dbHelpers.updateGameRoom(room.id, { players: room.players, updatedAt: Date.now() });
          activeRooms.set(roomCode, room);
          
          // Check if all players answered (but wait at least 2 seconds after question start)
          const activePlayers = players.filter(p => !p.isSpectator);
          const allAnswered = activePlayers.every(p => p.answered);
          const timeSinceQuestionStart = Math.floor((Date.now() - (room.currentQuestion?.startTime || Date.now())) / 1000);
          const minWaitTime = 2; // Minimum 2 seconds before proceeding
          
          if (allAnswered && timeSinceQuestionStart >= minWaitTime) {
            // Emit round result
            io.to(roomCode).emit('round-result', {
              correctAnswer: vocabulary.english,
              players: players.map(p => ({
                userId: p.userId,
                username: p.username,
                score: p.score,
                isCorrect: p.isCorrect
              }))
            });
            
            // Wait 3 seconds, then next round or finish
            setTimeout(async () => {
              try {
                const updatedRoom = activeRooms.get(roomCode) || await dbHelpers.getGameRoomByCode(roomCode);
                if (updatedRoom) {
                  const updatedSettings = typeof updatedRoom.settings === 'string' ? JSON.parse(updatedRoom.settings) : updatedRoom.settings;
                  if (updatedRoom.currentRound < updatedSettings.rounds - 1) {
                    updatedRoom.currentRound++;
                    await startNextRound(io, roomCode, updatedRoom);
                  } else {
                    await finishGame(io, roomCode, updatedRoom);
                  }
                }
              } catch (error) {
                console.error('🚨 Error in bot answer delayed transition:', error);
              }
            }, 3000);
          }
        } catch (error) {
          console.error('🚨 Error processing bot answer:', error);
        }
      }, delay);
    });
  } catch (error) {
    console.error('🚨 CRITICAL ERROR in startNextRound:', error);
    console.error('Error stack:', error.stack);
    io.to(roomCode).emit('error', { 
      message: 'Fehler beim Starten der nächsten Runde',
      details: error.message 
    });
  }
}

async function finishGame(io, roomCode, room) {
  try {
    console.log(`🏁 Finishing game for room ${roomCode}`);
    
    room.status = 'finished';
    await dbHelpers.updateGameRoom(room.id, { 
      status: 'finished',
      updatedAt: Date.now() 
    });
    activeRooms.delete(roomCode);

    // Parse players for leaderboard
    const players = typeof room.players === 'string' 
      ? JSON.parse(room.players) 
      : (room.players || []);

    // Sort players by score
    const leaderboard = players
      .filter(p => !p.isSpectator)
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({
        rank: index + 1,
        userId: p.userId,
        username: p.username,
        score: p.score
      }));

    console.log('🏆 Final leaderboard:', leaderboard);

    io.to(roomCode).emit('game-finished', {
      leaderboard
    });

    console.log(`✅ Game finished successfully for room ${roomCode}`);
  } catch (error) {
    console.error('🚨 CRITICAL ERROR in finishGame:', error);
    console.error('Error stack:', error.stack);
    io.to(roomCode).emit('error', { 
      message: 'Fehler beim Beenden des Spiels',
      details: error.message 
    });
  }
}

export async function createRoom(req, res, next) {
  try {
    console.log('📝 Create Room Request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user);
    
    const userId = req.user.userId;
    const { settings } = req.body;

    if (!userId) {
      console.log('❌ User ID missing');
      return res.status(400).json({ error: 'User ID fehlt' });
    }

    if (!settings || !settings.rounds || !settings.selectedPacks) {
      console.log('❌ Invalid settings:', settings);
      return res.status(400).json({ error: 'Settings with rounds and selectedPacks are required' });
    }

    const code = generateRoomCode();
    const now = Date.now();

    console.log(`🔨 Creating room: ${code} for user: ${userId}`);

    const players = [{
      userId,
      username: req.user.username,
      score: 0,
      isSpectator: false,
      socketId: null
    }];

    // Add bots if requested
    const botCount = settings.botCount || 0;
    for (let i = 1; i <= botCount; i++) {
      players.push({
        userId: `bot-${code}-${i}`,
        username: `Bot ${i}`,
        score: 0,
        isSpectator: false,
        socketId: null,
        isBot: true
      });
    }

    // WICHTIG: InstantDB benötigt alle Felder als korrekte Typen
    // currentQuestion muss String sein (nicht null), weil es im Schema optional ist
    const roomData = {
      code,
      hostId: userId,
      players: JSON.stringify(players), // Array als JSON String
      settings: JSON.stringify({
        rounds: settings.rounds,
        selectedPacks: settings.selectedPacks,
        timerEnabled: settings.timerEnabled || false,
        timerDuration: settings.timerDuration || 20,
        botCount: botCount
      }), // Object als JSON String
      currentRound: 0,
      currentQuestion: JSON.stringify(null), // null als JSON String für optionales Feld
      status: 'waiting',
      createdAt: now,
      updatedAt: now
    };

    console.log('🔨 Room data prepared:', JSON.stringify(roomData, null, 2));

    const roomId = await dbHelpers.createGameRoom(roomData);
    console.log('✅ Room created successfully with ID:', roomId);
    
    activeRooms.set(code, { ...roomData, id: roomId });

    res.json({
      roomId,
      code,
      room: {
        ...roomData,
        players, // Send unparsed for response
        settings: {
          rounds: settings.rounds,
          selectedPacks: settings.selectedPacks,
          timerEnabled: settings.timerEnabled || false,
          timerDuration: settings.timerDuration || 20,
          botCount: botCount
        }
      }
    });
  } catch (error) {
    // WICHTIG: Fange alle Fehler ab, damit der Server nicht abstürzt
    console.error('🚨 CRITICAL ERROR in createRoom:', error);
    console.error('Error stack:', error.stack);
    
    // Sende einen sauberen Fehler zurück
    res.status(500).json({ 
      error: 'Serverfehler beim Erstellen des Raums',
      message: error.message || 'Unbekannter Fehler',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
    const players = typeof room.players === 'string' 
      ? JSON.parse(room.players) 
      : (room.players || []);
    const alreadyInRoom = players.some(p => p.userId === userId);
    if (alreadyInRoom) {
      return res.json({ 
        room: {
          ...room,
          players,
          settings: typeof room.settings === 'string' ? JSON.parse(room.settings) : room.settings
        }
      });
    }

    res.json({ 
      room: {
        ...room,
        players,
        settings: typeof room.settings === 'string' ? JSON.parse(room.settings) : room.settings
      }
    });
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

    res.json({ 
      room: {
        ...room,
        players: typeof room.players === 'string' ? JSON.parse(room.players) : room.players,
        settings: typeof room.settings === 'string' ? JSON.parse(room.settings) : room.settings
      }
    });
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
