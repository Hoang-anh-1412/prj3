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

// Helper function to generate random quiz question
const generateQuestion = (vocabulary: Vocabulary[], mode: 'word-to-meaning' | 'meaning-to-word' | 'mixed'): QuizQuestion | null => {
  if (vocabulary.length < 4) {
    return null; // Need at least 4 vocabulary items for multiple choice
  }

  // Select random vocabulary item
  const correctItem = vocabulary[Math.floor(Math.random() * vocabulary.length)];
  
  // Determine question type
  let questionType: 'word-to-meaning' | 'meaning-to-word';
  if (mode === 'mixed') {
    questionType = Math.random() < 0.5 ? 'word-to-meaning' : 'meaning-to-word';
  } else {
    questionType = mode;
  }

  // Generate question and correct answer based on type
  let question: string;
  let correctAnswer: string;
  let optionPool: string[];

  if (questionType === 'word-to-meaning') {
    question = correctItem.word;
    correctAnswer = correctItem.meaning;
    optionPool = vocabulary.map(v => v.meaning).filter(m => m !== correctAnswer);
  } else {
    question = correctItem.meaning;
    correctAnswer = correctItem.word;
    optionPool = vocabulary.map(v => v.word).filter(w => w !== correctAnswer);
  }

  // Generate 3 random incorrect options
  const shuffledPool = shuffleArray(optionPool);
  const incorrectOptions = shuffledPool.slice(0, 3);

  // Combine correct answer with incorrect options and shuffle
  const allOptions = shuffleArray([correctAnswer, ...incorrectOptions]);

  return {
    id: correctItem.id,
    question,
    correctAnswer,
    options: allOptions,
    type: questionType
  };
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      // Generate a random quiz question
      try {
        const vocabulary = readVocabulary();
        const { mode = 'mixed' } = req.query;
        
        if (vocabulary.length === 0) {
          return res.status(400).json({ error: 'No vocabulary available for quiz' });
        }

        if (vocabulary.length < 4) {
          return res.status(400).json({ 
            error: 'At least 4 vocabulary items are required for quiz mode' 
          });
        }

        const validModes = ['word-to-meaning', 'meaning-to-word', 'mixed'];
        const quizMode = typeof mode === 'string' && validModes.includes(mode) 
          ? mode as 'word-to-meaning' | 'meaning-to-word' | 'mixed'
          : 'mixed';

        const question = generateQuestion(vocabulary, quizMode);
        
        if (!question) {
          return res.status(500).json({ error: 'Failed to generate quiz question' });
        }

        return res.status(200).json(question);
      } catch (error) {
        console.error('Error generating quiz question:', error);
        return res.status(500).json({ error: 'Failed to generate quiz question' });
      }

    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}
