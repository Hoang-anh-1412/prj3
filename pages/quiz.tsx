// Quiz mode page with multiple choice questions
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QuizQuestion, QuizResult } from '../types';

type QuizMode = 'word-to-meaning' | 'meaning-to-word' | 'mixed';

interface QuizState {
  mode: QuizMode;
  currentQuestion: QuizQuestion | null;
  results: QuizResult[];
  isFinished: boolean;
  showFeedback: boolean;
  selectedAnswer: string;
  totalQuestions: number;
}

const QuizPage: React.FC = () => {
  // Quiz state management
  const [quizState, setQuizState] = useState<QuizState>({
    mode: 'mixed',
    currentQuestion: null,
    results: [],
    isFinished: false,
    showFeedback: false,
    selectedAnswer: '',
    totalQuestions: 0
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [vocabularyCount, setVocabularyCount] = useState<number>(0);

  // Check vocabulary count on component mount
  useEffect(() => {
    checkVocabularyCount();
  }, []);

  // Check if there's enough vocabulary for quiz
  const checkVocabularyCount = async () => {
    try {
      const response = await fetch('/api/vocabulary');
      if (response.ok) {
        const vocabulary = await response.json();
        setVocabularyCount(vocabulary.length);
      }
    } catch (error) {
      console.error('Error checking vocabulary count:', error);
    }
  };

  // Start quiz with selected mode
  const startQuiz = async (mode: QuizMode) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/quiz?mode=${mode}`);
      if (response.ok) {
        const question: QuizQuestion = await response.json();
        setQuizState({
          mode,
          currentQuestion: question,
          results: [],
          isFinished: false,
          showFeedback: false,
          selectedAnswer: '',
          totalQuestions: 1
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to start quiz');
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Failed to start quiz');
    } finally {
      setLoading(false);
    }
  };

  // Handle answer selection
  const selectAnswer = (answer: string) => {
    if (quizState.showFeedback) return; // Prevent multiple selections
    
    const isCorrect = answer === quizState.currentQuestion?.correctAnswer;
    
    // Add result to the list
    const result: QuizResult = {
      questionId: quizState.currentQuestion?.id || 0,
      question: quizState.currentQuestion?.question || '',
      selectedAnswer: answer,
      correctAnswer: quizState.currentQuestion?.correctAnswer || '',
      isCorrect
    };

    setQuizState(prev => ({
      ...prev,
      selectedAnswer: answer,
      showFeedback: true,
      results: [...prev.results, result]
    }));

    // Auto-proceed to next question after 1.5 seconds
    setTimeout(() => {
      loadNextQuestion();
    }, 1500);
  };

  // Load next question
  const loadNextQuestion = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/quiz?mode=${quizState.mode}`);
      if (response.ok) {
        const question: QuizQuestion = await response.json();
        setQuizState(prev => ({
          ...prev,
          currentQuestion: question,
          showFeedback: false,
          selectedAnswer: '',
          totalQuestions: prev.totalQuestions + 1
        }));
      } else {
        console.error('Failed to load next question');
        alert('Failed to load next question');
      }
    } catch (error) {
      console.error('Error loading next question:', error);
      alert('Failed to load next question');
    } finally {
      setLoading(false);
    }
  };

  // Finish quiz
  const finishQuiz = () => {
    setQuizState(prev => ({
      ...prev,
      isFinished: true
    }));
  };

  // Reset quiz
  const resetQuiz = () => {
    setQuizState({
      mode: 'mixed',
      currentQuestion: null,
      results: [],
      isFinished: false,
      showFeedback: false,
      selectedAnswer: '',
      totalQuestions: 0
    });
  };

  // Calculate score
  const correctAnswers = quizState.results.filter(r => r.isCorrect).length;
  const totalAnswered = quizState.results.length;
  const percentage = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;

  // Get option style based on selection and correctness
  const getOptionStyle = (option: string) => {
    if (!quizState.showFeedback) {
      return 'quiz-option';
    }
    
    if (option === quizState.currentQuestion?.correctAnswer) {
      return 'quiz-option correct';
    }
    
    if (option === quizState.selectedAnswer && option !== quizState.currentQuestion?.correctAnswer) {
      return 'quiz-option incorrect';
    }
    
    return 'quiz-option opacity-50';
  };

  // If not enough vocabulary
  if (vocabularyCount < 4) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="card">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Mode</h1>
          <p className="text-gray-600 mb-6">
            You need at least 4 vocabulary words to start the quiz mode.
          </p>
          <p className="text-gray-600 mb-8">
            Currently you have <strong>{vocabularyCount}</strong> word{vocabularyCount !== 1 ? 's' : ''} in your vocabulary.
          </p>
          <Link href="/vocabulary" className="btn-primary">
            Add More Vocabulary
          </Link>
        </div>
      </div>
    );
  }

  // Quiz Results View
  if (quizState.isFinished) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Complete!</h1>
          
          {/* Score Display */}
          <div className="mb-8">
            <div className="text-5xl font-bold text-blue-600 mb-2">{percentage}%</div>
            <p className="text-xl text-gray-600">
              {correctAnswers} out of {totalAnswered} correct
            </p>
          </div>

          {/* Performance Message */}
          <div className="mb-8">
            {percentage === 100 && (
              <p className="text-green-600 font-semibold">Perfect score! Excellent work! 🌟</p>
            )}
            {percentage >= 80 && percentage < 100 && (
              <p className="text-green-600 font-semibold">Great job! Keep it up! 👏</p>
            )}
            {percentage >= 60 && percentage < 80 && (
              <p className="text-yellow-600 font-semibold">Good work! Room for improvement. 💪</p>
            )}
            {percentage < 60 && (
              <p className="text-red-600 font-semibold">Keep practicing! You'll get better! 📚</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button onClick={resetQuiz} className="btn-primary">
              Take Another Quiz
            </button>
            <Link href="/vocabulary" className="btn-secondary">
              Manage Vocabulary
            </Link>
            <Link href="/" className="btn-secondary">
              Back to Home
            </Link>
          </div>

          {/* Detailed Results */}
          <div className="card mt-8 text-left">
            <h2 className="text-xl font-semibold mb-4 text-center">Quiz Summary</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {quizState.results.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${
                    result.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        Question: {result.question}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Your answer: <span className={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
                          {result.selectedAnswer}
                        </span>
                      </div>
                      {!result.isCorrect && (
                        <div className="text-sm text-green-600 mt-1">
                          Correct answer: {result.correctAnswer}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {result.isCorrect ? (
                        <div className="text-green-600 text-xl">✓</div>
                      ) : (
                        <div className="text-red-600 text-xl">✗</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Mode Selection View
  if (!quizState.currentQuestion) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🧠</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Mode</h1>
            <p className="text-gray-600">
              Test your vocabulary knowledge with interactive multiple-choice questions.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Choose Quiz Mode</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Word to Meaning Mode */}
              <button
                onClick={() => startQuiz('word-to-meaning')}
                disabled={loading}
                className="card hover:shadow-lg transition duration-200 text-left border-2 hover:border-blue-300"
              >
                <div className="text-3xl mb-3 text-center">🔤</div>
                <h3 className="font-semibold text-gray-800 mb-2 text-center">Word → Meaning</h3>
                <p className="text-gray-600 text-sm">
                  See a word and choose its correct meaning from multiple options.
                </p>
              </button>

              {/* Meaning to Word Mode */}
              <button
                onClick={() => startQuiz('meaning-to-word')}
                disabled={loading}
                className="card hover:shadow-lg transition duration-200 text-left border-2 hover:border-blue-300"
              >
                <div className="text-3xl mb-3 text-center">💭</div>
                <h3 className="font-semibold text-gray-800 mb-2 text-center">Meaning → Word</h3>
                <p className="text-gray-600 text-sm">
                  See a meaning and choose the correct word from multiple options.
                </p>
              </button>

              {/* Mixed Mode */}
              <button
                onClick={() => startQuiz('mixed')}
                disabled={loading}
                className="card hover:shadow-lg transition duration-200 text-left border-2 hover:border-blue-300"
              >
                <div className="text-3xl mb-3 text-center">🎲</div>
                <h3 className="font-semibold text-gray-800 mb-2 text-center">Mixed Mode</h3>
                <p className="text-gray-600 text-sm">
                  Random combination of word-to-meaning and meaning-to-word questions.
                </p>
              </button>
            </div>
          </div>

          {loading && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading quiz...</p>
            </div>
          )}

          <div className="text-center text-gray-500 text-sm">
            <p>You have <strong>{vocabularyCount}</strong> word{vocabularyCount !== 1 ? 's' : ''} available for the quiz.</p>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Question View
  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        {/* Quiz Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quiz Mode</h1>
            <p className="text-gray-600">
              Question {quizState.totalQuestions} • {correctAnswers}/{totalAnswered} correct
            </p>
          </div>
          <button
            onClick={finishQuiz}
            className="btn-danger"
          >
            Finish Quiz
          </button>
        </div>

        {/* Question Section */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="text-sm text-gray-500 mb-2">
              {quizState.currentQuestion.type === 'word-to-meaning' ? 'Word → Meaning' : 'Meaning → Word'}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-4">
              {quizState.currentQuestion.question}
            </div>
            <p className="text-gray-600">
              Choose the correct {quizState.currentQuestion.type === 'word-to-meaning' ? 'meaning' : 'word'}:
            </p>
          </div>

          {/* Options */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading next question...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quizState.currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => selectAnswer(option)}
                  disabled={quizState.showFeedback}
                  className={getOptionStyle(option)}
                >
                  <div className="flex items-center">
                    <span className="font-semibold mr-3 text-gray-500">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span>{option}</span>
                    {quizState.showFeedback && option === quizState.currentQuestion.correctAnswer && (
                      <span className="ml-auto text-green-600">✓</span>
                    )}
                    {quizState.showFeedback && 
                     option === quizState.selectedAnswer && 
                     option !== quizState.currentQuestion.correctAnswer && (
                      <span className="ml-auto text-red-600">✗</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Feedback */}
          {quizState.showFeedback && (
            <div className="mt-6 text-center">
              {quizState.selectedAnswer === quizState.currentQuestion.correctAnswer ? (
                <div className="text-green-600 font-semibold">
                  ✓ Correct! Great job!
                </div>
              ) : (
                <div className="text-red-600 font-semibold">
                  ✗ Incorrect. The correct answer is: {quizState.currentQuestion.correctAnswer}
                </div>
              )}
              <p className="text-gray-600 text-sm mt-2">
                Loading next question...
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{percentage}% correct</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: totalAnswered > 0 ? `${(correctAnswers / totalAnswered) * 100}%` : '0%' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
