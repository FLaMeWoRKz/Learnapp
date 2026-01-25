// Generate random room code (4-6 alphanumeric characters)
export function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const length = 4 + Math.floor(Math.random() * 3); // 4-6 characters
  
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

// Get random vocabularies
export function getRandomVocabularies(vocabularies, count) {
  const shuffled = [...vocabularies].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Generate question options (1 correct + 3 wrong)
export function generateQuestionOptions(correctAnswer, wrongOptions) {
  const options = [correctAnswer, ...wrongOptions];
  // Shuffle options
  return options.sort(() => 0.5 - Math.random());
}

// Generate question for multiplayer
export function generateQuestion(vocabulary, allVocabularies) {
  const wrongOptions = getRandomVocabularies(
    allVocabularies.filter(v => v.vocabId !== vocabulary.vocabId),
    3
  ).map(v => v.english);

  const options = generateQuestionOptions(vocabulary.english, wrongOptions);

  return {
    vocabId: vocabulary.vocabId,
    question: vocabulary.german,
    options,
    correctAnswer: vocabulary.english
  };
}
