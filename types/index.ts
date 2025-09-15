// Type definitions for the vocabulary learning app

export interface Vocabulary {
  id: number;
  word: string;
  meaning: string;
  phonetic: string;
  topic: string;
}

export interface QuizQuestion {
  id: number;
  question: string; // The phonetic or meaning shown to user
  correctAnswer: string; // The correct answer
  options?: string[]; // Array of 4 options including correct answer (optional for text input mode)
  type: 'phonetic-to-meaning' | 'meaning-to-phonetic' | 'phonetic-to-meaning-text' | 'meaning-to-phonetic-text'; // Type of question
  word: string; // The word that this question is about
  inputType: 'multiple-choice' | 'text-input';
}

export interface QuizResult {
  questionId: number;
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  word: string;
}

export interface Quiz {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  results: QuizResult[];
  isFinished: boolean;
  mode: 'phonetic-to-meaning' | 'meaning-to-phonetic' | 'mixed' | 'phonetic-to-meaning-text' | 'meaning-to-phonetic-text' | 'mixed-text';
}
