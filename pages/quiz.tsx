// Quiz mode page with multiple choice questions
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QuizQuestion, QuizResult } from '../types';
import { useSpeech } from '../utils/speech';

type QuizMode = 'phonetic-to-meaning' | 'meaning-to-phonetic' | 'mixed' | 'phonetic-to-meaning-text' | 'meaning-to-phonetic-text' | 'mixed-text';

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
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState<string>('');
  const [checkingAnswer, setCheckingAnswer] = useState<boolean>(false);
  
  // Speech functionality
  const { 
    speak, 
    speakRandom, 
    speakWithCurrentVoice,
    stop, 
    nextVoice,
    previousVoice,
    isSupported, 
    availableVoices,
    currentVoice,
    currentVoiceIndex 
  } = useSpeech();
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);

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
        
        // Extract unique topics
        const topics = Array.from(new Set(vocabulary.map((v: any) => v.topic))).sort() as string[];
        setAvailableTopics(topics);
      }
    } catch (error) {
      console.error('Error checking vocabulary count:', error);
    }
  };

  // Start quiz with selected mode
  const startQuiz = async (mode: QuizMode) => {
    setLoading(true);
    try {
      const topicParam = selectedTopic === 'all' ? '' : `&topic=${encodeURIComponent(selectedTopic)}`;
      const response = await fetch(`/api/quiz?mode=${mode}${topicParam}`);
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

  // Handle text input answer submission
  const handleTextAnswerSubmit = async () => {
    if (!textAnswer.trim() || checkingAnswer) return;
    
    setCheckingAnswer(true);
    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAnswer: textAnswer.trim(),
          correctAnswer: quizState.currentQuestion?.correctAnswer,
          questionType: quizState.currentQuestion?.type
        })
      });

      if (response.ok) {
        const result = await response.json();
        const isCorrect = result.isCorrect;
        
        // Add result to quiz state
        const newResult: QuizResult = {
          questionId: quizState.currentQuestion!.id,
          question: quizState.currentQuestion!.question,
          selectedAnswer: textAnswer.trim(),
          correctAnswer: quizState.currentQuestion!.correctAnswer,
          isCorrect,
          word: quizState.currentQuestion!.word
        };

        setQuizState(prev => ({
          ...prev,
          results: [...prev.results, newResult],
          showFeedback: true,
          selectedAnswer: textAnswer.trim()
        }));

        // Clear text input
        setTextAnswer('');
        
        // Auto proceed to next question after delay
        setTimeout(() => {
          loadNextQuestion();
        }, 2000);
      } else {
        alert('Failed to check answer');
      }
    } catch (error) {
      console.error('Error checking answer:', error);
      alert('Failed to check answer');
    } finally {
      setCheckingAnswer(false);
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
      isCorrect,
      word: quizState.currentQuestion?.word || ''
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
      const topicParam = selectedTopic === 'all' ? '' : `&topic=${encodeURIComponent(selectedTopic)}`;
      const response = await fetch(`/api/quiz?mode=${quizState.mode}${topicParam}`);
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

  // Handle speech for quiz word
  const handleSpeakWord = async (word: string, phonetic: string) => {
    if (!isSupported) {
      alert('Speech synthesis is not supported in your browser');
      return;
    }

    try {
      setSpeakingWord(word);
      // Use word (Japanese characters) for speech with current voice
      await speakWithCurrentVoice(word);
    } catch (error) {
      console.error('Speech error:', error);
      alert('Error playing speech');
    } finally {
      setSpeakingWord(null);
    }
  };

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
                      <div className="text-sm text-blue-600 mt-1">
                        Word: {result.word}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Your answer: <span className={result.isCorrect ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {result.selectedAnswer}
                        </span>
                      </div>
                      <div className="text-sm text-green-600 mt-1 font-semibold">
                        Correct answer: {result.correctAnswer}
                      </div>
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
            
            {/* Topic Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Select Topic
              </label>
              <div className="flex justify-center">
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="input-field max-w-xs"
                >
                  <option value="all">All Topics</option>
                  {availableTopics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Multiple Choice Modes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 text-center">Multiple Choice</h3>
                
                {/* Phonetic to Meaning Mode */}
                <button
                  onClick={() => startQuiz('phonetic-to-meaning')}
                  disabled={loading}
                  className="card hover:shadow-lg transition duration-200 text-left border-2 hover:border-blue-300 w-full"
                >
                  <div className="text-3xl mb-3 text-center">🔤</div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-center">Phonetic → Meaning</h4>
                  <p className="text-gray-600 text-sm">
                    See a phonetic and choose its correct meaning from multiple options.
                  </p>
                </button>

                {/* Meaning to Phonetic Mode */}
                <button
                  onClick={() => startQuiz('meaning-to-phonetic')}
                  disabled={loading}
                  className="card hover:shadow-lg transition duration-200 text-left border-2 hover:border-blue-300 w-full"
                >
                  <div className="text-3xl mb-3 text-center">💭</div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-center">Meaning → Phonetic</h4>
                  <p className="text-gray-600 text-sm">
                    See a meaning and choose the correct phonetic from multiple options.
                  </p>
                </button>

                {/* Mixed Mode */}
                <button
                  onClick={() => startQuiz('mixed')}
                  disabled={loading}
                  className="card hover:shadow-lg transition duration-200 text-left border-2 hover:border-blue-300 w-full"
                >
                  <div className="text-3xl mb-3 text-center">🎲</div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-center">Mixed Mode</h4>
                  <p className="text-gray-600 text-sm">
                    Random combination of phonetic-to-meaning and meaning-to-phonetic questions.
                  </p>
                </button>
              </div>

              {/* Text Input Modes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 text-center">Text Input</h3>
                
                {/* Phonetic to Meaning Text Mode */}
                <button
                  onClick={() => startQuiz('phonetic-to-meaning-text')}
                  disabled={loading}
                  className="card hover:shadow-lg transition duration-200 text-left border-2 hover:border-green-300 w-full"
                >
                  <div className="text-3xl mb-3 text-center">✍️</div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-center">Phonetic → Meaning</h4>
                  <p className="text-gray-600 text-sm">
                    See a phonetic and type the meaning in Vietnamese.
                  </p>
                </button>

                {/* Meaning to Phonetic Text Mode */}
                <button
                  onClick={() => startQuiz('meaning-to-phonetic-text')}
                  disabled={loading}
                  className="card hover:shadow-lg transition duration-200 text-left border-2 hover:border-green-300 w-full"
                >
                  <div className="text-3xl mb-3 text-center">⌨️</div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-center">Meaning → Phonetic</h4>
                  <p className="text-gray-600 text-sm">
                    See a meaning and type the phonetic in Romaji.
                  </p>
                </button>

                {/* Mixed Text Mode */}
                <button
                  onClick={() => startQuiz('mixed-text')}
                  disabled={loading}
                  className="card hover:shadow-lg transition duration-200 text-left border-2 hover:border-green-300 w-full"
                >
                  <div className="text-3xl mb-3 text-center">🎯</div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-center">Mixed Text</h4>
                  <p className="text-gray-600 text-sm">
                    Random combination with text input for both directions.
                  </p>
                </button>
              </div>
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
          <div className="flex items-center space-x-4">
            {/* Voice Controls */}
            {isSupported && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={previousVoice}
                  disabled={availableVoices.length <= 1}
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`Previous voice (${availableVoices.length} voices available)`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="text-sm text-gray-600 min-w-0 max-w-24 truncate" title={`${currentVoice?.name || 'No voice'} (${availableVoices.length} voices)`}>
                  {currentVoice?.name || 'No voice'}
                  {availableVoices.length > 0 && (
                    <span className="text-xs text-gray-400 ml-1">({availableVoices.length})</span>
                  )}
                </div>
                <button
                  onClick={nextVoice}
                  disabled={availableVoices.length <= 1}
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`Next voice (${availableVoices.length} voices available)`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
            <button
              onClick={finishQuiz}
              className="btn-danger"
            >
              Finish Quiz
            </button>
          </div>
        </div>

        {/* Question Section */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="text-sm text-gray-500 mb-2">
              {quizState.currentQuestion?.type === 'phonetic-to-meaning' || quizState.currentQuestion?.type === 'phonetic-to-meaning-text' 
                ? 'Phonetic → Meaning' 
                : 'Meaning → Phonetic'}
            </div>
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="text-2xl font-bold text-blue-600">
                Word: {quizState.currentQuestion?.word}
              </div>
              {isSupported && (
                <button
                  onClick={() => handleSpeakWord(quizState.currentQuestion?.word || '', quizState.currentQuestion?.question || '')}
                  disabled={speakingWord === quizState.currentQuestion?.word}
                  className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
                  title="Listen to pronunciation"
                >
                  {speakingWord === quizState.currentQuestion?.word ? (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.816a1 1 0 011-.108zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )}
            </div>
            <div className={`text-3xl font-bold text-gray-900 mb-4 ${quizState.currentQuestion?.type === 'meaning-to-phonetic' || quizState.currentQuestion?.type === 'meaning-to-phonetic-text' ? 'font-mono' : ''}`}>
              {quizState.currentQuestion?.question}
            </div>
            <p className="text-gray-600">
              {quizState.currentQuestion?.inputType === 'text-input' 
                ? `Type the ${quizState.currentQuestion?.type === 'phonetic-to-meaning-text' ? 'meaning' : 'phonetic'}:`
                : `Choose the correct ${quizState.currentQuestion?.type === 'phonetic-to-meaning' ? 'meaning' : 'phonetic'}:`
              }
            </p>
          </div>

          {/* Answer Input */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading next question...</p>
            </div>
          ) : quizState.currentQuestion?.inputType === 'text-input' ? (
            /* Text Input Mode */
            <div className="max-w-md mx-auto">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !checkingAnswer) {
                      handleTextAnswerSubmit();
                    }
                  }}
                  disabled={quizState.showFeedback || checkingAnswer}
                  className={`flex-1 input-field text-center text-lg ${
                    quizState.showFeedback 
                      ? (quizState.selectedAnswer === quizState.currentQuestion?.correctAnswer 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-red-500 bg-red-50')
                      : ''
                  }`}
                  placeholder={`Type ${quizState.currentQuestion?.type === 'phonetic-to-meaning-text' ? 'meaning' : 'phonetic'} here...`}
                />
                <button
                  onClick={handleTextAnswerSubmit}
                  disabled={!textAnswer.trim() || checkingAnswer || quizState.showFeedback}
                  className="btn-primary px-6"
                >
                  {checkingAnswer ? 'Checking...' : 'Submit'}
                </button>
              </div>
              
              {/* Feedback for text input */}
              {quizState.showFeedback && (
                <div className="mt-4 text-center">
                  <div className={`text-lg font-semibold ${
                    quizState.selectedAnswer === quizState.currentQuestion?.correctAnswer 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {quizState.selectedAnswer === quizState.currentQuestion?.correctAnswer 
                      ? '✓ Correct!' 
                      : '✗ Incorrect'}
                  </div>
                  {quizState.selectedAnswer !== quizState.currentQuestion?.correctAnswer && (
                    <div className="mt-2 text-gray-600">
                      <div>Your answer: <span className="font-mono">{quizState.selectedAnswer}</span></div>
                      <div>Correct answer: <span className="font-mono text-green-600">{quizState.currentQuestion?.correctAnswer}</span></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Multiple Choice Mode */
            <div className="space-y-3">
              {quizState.currentQuestion?.options?.map((option, index) => (
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
                    <span className={quizState.currentQuestion?.type === 'meaning-to-phonetic' ? 'font-mono' : ''}>{option}</span>
                    {quizState.showFeedback && option === quizState.currentQuestion?.correctAnswer && (
                      <span className="ml-auto text-green-600">✓</span>
                    )}
                    {quizState.showFeedback && 
                     option === quizState.selectedAnswer && 
                     option !== quizState.currentQuestion?.correctAnswer && (
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
                  ✗ Incorrect. The correct answer is: 
                  <span className="text-green-600 font-bold ml-2">
                    {quizState.currentQuestion.correctAnswer}
                  </span>
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
