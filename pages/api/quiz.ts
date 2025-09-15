// API route for quiz operations
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { Vocabulary, QuizQuestion } from '../../types';

const vocabularyFilePath = path.join(process.cwd(), 'data', 'vocabulary.json');

// Helper function to read vocabulary from JSON file
const readVocabulary = (): Vocabulary[] => {
  try {
    const fileContents = fs.readFileSync(vocabularyFilePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error reading vocabulary file:', error);
    return [];
  }
};

// Helper function to shuffle array
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper function to normalize Vietnamese text for comparison
const normalizeVietnamese = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    // Remove common punctuation
    .replace(/[.,!?;:()]/g, '')
    // Normalize Vietnamese diacritics (optional - can be more sophisticated)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC');
};

// Helper function to check if answer is correct (flexible for Vietnamese)
const isAnswerCorrect = (userAnswer: string, correctAnswer: string, isVietnamese: boolean = false): boolean => {
  if (!userAnswer || !correctAnswer) return false;
  
  if (isVietnamese) {
    // For Vietnamese, use flexible comparison
    const normalizedUser = normalizeVietnamese(userAnswer);
    const normalizedCorrect = normalizeVietnamese(correctAnswer);
    
    // Exact match after normalization
    if (normalizedUser === normalizedCorrect) return true;
    
    // Check if user answer contains the correct answer (for cases like "quả táo" vs "táo")
    if (normalizedUser.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedUser)) {
      return true;
    }
    
    // Check for common Vietnamese variations
    const userWords = normalizedUser.split(' ');
    const correctWords = normalizedCorrect.split(' ');
    
    // If all words in correct answer are present in user answer
    if (correctWords.every(word => userWords.some(userWord => userWord.includes(word) || word.includes(userWord)))) {
      return true;
    }
    
    return false;
  } else {
    // For non-Vietnamese (phonetic), use exact match
    return normalizeVietnamese(userAnswer) === normalizeVietnamese(correctAnswer);
  }
};

// Helper function to generate random quiz question
const generateQuestion = (vocabulary: Vocabulary[], mode: 'phonetic-to-meaning' | 'meaning-to-phonetic' | 'mixed' | 'phonetic-to-meaning-text' | 'meaning-to-phonetic-text' | 'mixed-text', topic?: string): QuizQuestion | null => {
  // Filter vocabulary by topic if specified
  let filteredVocabulary = vocabulary;
  if (topic && topic !== 'all') {
    filteredVocabulary = vocabulary.filter(v => v.topic === topic);
  }
  
  // Check if we have at least 1 word in the selected topic
  if (filteredVocabulary.length === 0) {
    return null;
  }

  // Check if we have enough total vocabulary for wrong options (need at least 4 total)
  if (vocabulary.length < 4) {
    return null;
  }

  // Select random vocabulary item from filtered list
  const correctItem = filteredVocabulary[Math.floor(Math.random() * filteredVocabulary.length)];
  
  // Determine question type and input type
  let questionType: 'phonetic-to-meaning' | 'meaning-to-phonetic' | 'phonetic-to-meaning-text' | 'meaning-to-phonetic-text';
  let inputType: 'multiple-choice' | 'text-input';
  
  if (mode === 'mixed') {
    questionType = Math.random() < 0.5 ? 'phonetic-to-meaning' : 'meaning-to-phonetic';
    inputType = 'multiple-choice';
  } else if (mode === 'mixed-text') {
    questionType = Math.random() < 0.5 ? 'phonetic-to-meaning-text' : 'meaning-to-phonetic-text';
    inputType = 'text-input';
  } else if (mode.includes('-text')) {
    questionType = mode as 'phonetic-to-meaning-text' | 'meaning-to-phonetic-text';
    inputType = 'text-input';
  } else {
    questionType = mode as 'phonetic-to-meaning' | 'meaning-to-phonetic';
    inputType = 'multiple-choice';
  }

  // Generate question and correct answer based on type
  let question: string;
  let correctAnswer: string;
  let options: string[] | undefined;

  if (questionType === 'phonetic-to-meaning' || questionType === 'phonetic-to-meaning-text') {
    question = correctItem.phonetic;
    correctAnswer = correctItem.meaning;
  } else {
    question = correctItem.meaning;
    correctAnswer = correctItem.phonetic;
  }

  // Generate options only for multiple choice mode
  if (inputType === 'multiple-choice') {
    let optionPool: string[];
    if (questionType === 'phonetic-to-meaning') {
      // Use all vocabulary for wrong options, not just filtered topic
      optionPool = vocabulary.map(v => v.meaning).filter(m => m !== correctAnswer);
    } else {
      // Use all vocabulary for wrong options, not just filtered topic
      optionPool = vocabulary.map(v => v.phonetic).filter(p => p !== correctAnswer);
    }

    // Generate 3 random incorrect options
    const shuffledPool = shuffleArray(optionPool);
    const incorrectOptions = shuffledPool.slice(0, 3);

    // Combine correct answer with incorrect options and shuffle
    options = shuffleArray([correctAnswer, ...incorrectOptions]);
  }

  return {
    id: correctItem.id,
    question,
    correctAnswer,
    options,
    type: questionType,
    word: correctItem.word,
    inputType
  };
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      // Generate a random quiz question
      try {
        const vocabulary = readVocabulary();
        const { mode = 'mixed', topic } = req.query;
        
        if (vocabulary.length === 0) {
          return res.status(400).json({ error: 'No vocabulary available for quiz' });
        }

        // Filter vocabulary by topic if specified
        let filteredVocabulary = vocabulary;
        if (topic && typeof topic === 'string' && topic !== 'all') {
          filteredVocabulary = vocabulary.filter(v => v.topic === topic);
        }

        // Check if we have at least 1 word in the selected topic
        if (filteredVocabulary.length === 0) {
          return res.status(400).json({ 
            error: `No vocabulary items found${topic ? ` in topic "${topic}"` : ''}` 
          });
        }

        // Check if we have enough total vocabulary for wrong options (need at least 4 total)
        if (vocabulary.length < 4) {
          return res.status(400).json({ 
            error: 'At least 4 vocabulary items are required for quiz mode' 
          });
        }

        const validModes = ['phonetic-to-meaning', 'meaning-to-phonetic', 'mixed', 'phonetic-to-meaning-text', 'meaning-to-phonetic-text', 'mixed-text'];
        const quizMode = typeof mode === 'string' && validModes.includes(mode) 
          ? mode as 'phonetic-to-meaning' | 'meaning-to-phonetic' | 'mixed' | 'phonetic-to-meaning-text' | 'meaning-to-phonetic-text' | 'mixed-text'
          : 'mixed';

        const question = generateQuestion(vocabulary, quizMode, typeof topic === 'string' ? topic : undefined);
        
        if (!question) {
          return res.status(500).json({ error: 'Failed to generate quiz question' });
        }

        return res.status(200).json(question);
      } catch (error) {
        console.error('Error generating quiz question:', error);
        return res.status(500).json({ error: 'Failed to generate quiz question' });
      }

    case 'POST':
      // Check text input answer
      try {
        const { userAnswer, correctAnswer, questionType } = req.body;
        
        if (!userAnswer || !correctAnswer || !questionType) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Determine if this is a Vietnamese answer (meaning)
        const isVietnamese = questionType === 'phonetic-to-meaning-text' || questionType === 'meaning-to-phonetic-text';
        
        // Check if answer is correct
        const isCorrect = isAnswerCorrect(userAnswer, correctAnswer, isVietnamese);
        
        return res.status(200).json({ 
          isCorrect,
          userAnswer,
          correctAnswer,
          isVietnamese
        });
      } catch (error) {
        return res.status(500).json({ error: 'Failed to check answer' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}
