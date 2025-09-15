// Type definitions for the vocabulary learning app

export interface Vocabulary {
  id: number;
  word: string;
  meaning: string;
}

export interface QuizQuestion {
  id: number;
  question: string; // The word or meaning shown to user
  correctAnswer: string; // The correct answer
  options: string[]; // Array of 4 options including correct answer
  type: 'word-to-meaning' | 'meaning-to-word'; // Type of question
}

export interface QuizResult {
  questionId: number;
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface Quiz {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  results: QuizResult[];
  isFinished: boolean;
  mode: 'word-to-meaning' | 'meaning-to-word' | 'mixed';
}
