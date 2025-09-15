// Home page - Welcome page with overview and navigation
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Vocabulary } from '../types';

const Home: React.FC = () => {
  const [vocabularyCount, setVocabularyCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch vocabulary count on component mount
  useEffect(() => {
    const fetchVocabularyCount = async () => {
      try {
        const response = await fetch('/api/vocabulary');
        if (response.ok) {
          const vocabulary: Vocabulary[] = await response.json();
          setVocabularyCount(vocabulary.length);
        }
      } catch (error) {
        console.error('Error fetching vocabulary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVocabularyCount();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          📚 Vocabulary Learning App
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Learn and practice vocabulary with interactive quizzes and comprehensive management tools.
        </p>
        
        {/* Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Progress</h2>
          <div className="text-center">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-20 mx-auto"></div>
              </div>
            ) : (
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {vocabularyCount}
                </div>
                <div className="text-gray-600">
                  {vocabularyCount === 1 ? 'Word' : 'Words'} in your vocabulary
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Vocabulary Management Card */}
        <div className="card hover:shadow-lg transition duration-200">
          <div className="text-center mb-4">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-2xl font-semibold text-gray-800">Manage Vocabulary</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Add, edit, delete, and search your vocabulary collection. Build your personal dictionary with ease.
          </p>
          <div className="space-y-2 text-sm text-gray-500 mb-6">
            <div>✓ Add new words and meanings</div>
            <div>✓ Edit existing entries</div>
            <div>✓ Search and filter words</div>
            <div>✓ Delete unwanted entries</div>
          </div>
          <Link href="/vocabulary" className="btn-primary w-full text-center block">
            Manage Vocabulary
          </Link>
        </div>

        {/* Quiz Mode Card */}
        <div className="card hover:shadow-lg transition duration-200">
          <div className="text-center mb-4">
            <div className="text-4xl mb-3">🧠</div>
            <h3 className="text-2xl font-semibold text-gray-800">Quiz Mode</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Test your knowledge with interactive multiple-choice quizzes. Track your progress and improve your vocabulary.
          </p>
          <div className="space-y-2 text-sm text-gray-500 mb-6">
            <div>✓ Random questions from your vocabulary</div>
            <div>✓ Multiple choice answers</div>
            <div>✓ Instant feedback</div>
            <div>✓ Quiz results and statistics</div>
          </div>
          {vocabularyCount >= 4 ? (
            <Link href="/quiz" className="btn-primary w-full text-center block">
              Start Quiz
            </Link>
          ) : (
            <div className="text-center">
              <div className="btn-secondary w-full opacity-50 cursor-not-allowed mb-2">
                Start Quiz
              </div>
              <div className="text-sm text-gray-500">
                Add at least 4 words to start quizzing
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="card mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">How to Get Started</h2>
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Add Vocabulary</h3>
            <p className="text-gray-600 text-sm">Start by adding words and their meanings to build your personal dictionary.</p>
          </div>
          <div>
            <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 font-bold">2</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Take Quizzes</h3>
            <p className="text-gray-600 text-sm">Test your knowledge with interactive quizzes and track your progress.</p>
          </div>
          <div>
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-purple-600 font-bold">3</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Keep Learning</h3>
            <p className="text-gray-600 text-sm">Continue adding new words and practicing to expand your vocabulary.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
