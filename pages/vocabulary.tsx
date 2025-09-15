// Vocabulary management page with CRUD operations
import React, { useState, useEffect } from 'react';
import { Vocabulary } from '../types';
import { useSpeech } from '../utils/speech';

const VocabularyPage: React.FC = () => {
  // State management
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [filteredVocabulary, setFilteredVocabulary] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 50;
  
  // Form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ word: '', meaning: '', phonetic: '', topic: '' });
  const [formErrors, setFormErrors] = useState({ word: '', meaning: '', phonetic: '', topic: '' });
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [showCustomTopic, setShowCustomTopic] = useState<boolean>(false);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [showBulkAdd, setShowBulkAdd] = useState<boolean>(false);
  const [bulkWords, setBulkWords] = useState<string>('');
  const [bulkTopic, setBulkTopic] = useState<string>('');
  const [bulkSearchTerm, setBulkSearchTerm] = useState<string>('');
  const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set());
  const [bulkMode, setBulkMode] = useState<'text' | 'select'>('select');
  
  // Topic management state
  const [showTopicManagement, setShowTopicManagement] = useState<boolean>(false);
  const [topicStats, setTopicStats] = useState<Array<{name: string, count: number}>>([]);
  const [editingTopic, setEditingTopic] = useState<string>('');
  const [newTopicName, setNewTopicName] = useState<string>('');
  const [showAddTopic, setShowAddTopic] = useState<boolean>(false);
  
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

  // Fetch vocabulary on component mount
  useEffect(() => {
    fetchVocabulary();
  }, []);

  // Filter vocabulary based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredVocabulary(vocabulary);
    } else {
      const filtered = vocabulary.filter(
        v => v.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
             v.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
             v.phonetic.toLowerCase().includes(searchTerm.toLowerCase()) ||
             v.topic.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVocabulary(filtered);
    }
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [vocabulary, searchTerm]);

  // Update available topics when vocabulary changes
  useEffect(() => {
    const topics = Array.from(new Set(vocabulary.map(v => v.topic))).sort();
    setAvailableTopics(topics);
  }, [vocabulary]);

  // Fetch topic stats when component mounts or when topic management is shown
  useEffect(() => {
    if (showTopicManagement) {
      fetchTopicStats();
    }
  }, [showTopicManagement]);

  // Filter vocabulary for bulk select
  const getBulkFilteredVocabulary = () => {
    if (bulkSearchTerm.trim() === '') {
      return vocabulary;
    }
    return vocabulary.filter(
      v => v.word.toLowerCase().includes(bulkSearchTerm.toLowerCase()) ||
           v.meaning.toLowerCase().includes(bulkSearchTerm.toLowerCase()) ||
           v.phonetic.toLowerCase().includes(bulkSearchTerm.toLowerCase()) ||
           v.topic.toLowerCase().includes(bulkSearchTerm.toLowerCase())
    );
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredVocabulary.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVocabulary = filteredVocabulary.slice(startIndex, endIndex);

  // Fetch all vocabulary from API
  const fetchVocabulary = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vocabulary');
      if (response.ok) {
        const data = await response.json();
        setVocabulary(data);
      } else {
        alert('Error fetching vocabulary');
      }
    } catch (error) {
      console.error('Error fetching vocabulary:', error);
      alert('Error fetching vocabulary');
    } finally {
      setLoading(false);
    }
  };

  // Validate form data
  const validateForm = () => {
    const errors = { word: '', meaning: '', phonetic: '', topic: '' };
    let isValid = true;

    if (!formData.word.trim()) {
      errors.word = 'Word is required';
      isValid = false;
    }

    if (!formData.meaning.trim()) {
      errors.meaning = 'Meaning is required';
      isValid = false;
    }

    if (!formData.phonetic.trim()) {
      errors.phonetic = 'Phonetic is required';
      isValid = false;
    }

    if (!formData.topic.trim()) {
      errors.topic = 'Topic is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Handle form submission (add or edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      const url = '/api/vocabulary';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId 
        ? { id: editingId, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchVocabulary(); // Refresh the list
        resetForm();
        alert(editingId ? 'Vocabulary updated successfully!' : 'Vocabulary added successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Error saving vocabulary');
      }
    } catch (error) {
      console.error('Error saving vocabulary:', error);
      alert('Error saving vocabulary');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle delete vocabulary
  const handleDelete = async (id: number, word: string) => {
    if (!confirm(`Are you sure you want to delete "${word}"?`)) return;

    try {
      const response = await fetch(`/api/vocabulary?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchVocabulary(); // Refresh the list
        alert('Vocabulary deleted successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Error deleting vocabulary');
      }
    } catch (error) {
      console.error('Error deleting vocabulary:', error);
      alert('Error deleting vocabulary');
    }
  };

  // Start editing a vocabulary item
  const startEdit = (vocab: Vocabulary) => {
    setEditingId(vocab.id);
    setFormData({ word: vocab.word, meaning: vocab.meaning, phonetic: vocab.phonetic, topic: vocab.topic });
    setShowAddForm(true);
    setFormErrors({ word: '', meaning: '', phonetic: '', topic: '' });
  };

  // Reset form and close it
  const resetForm = () => {
    setFormData({ word: '', meaning: '', phonetic: '', topic: '' });
    setFormErrors({ word: '', meaning: '', phonetic: '', topic: '' });
    setEditingId(null);
    setShowAddForm(false);
    setShowCustomTopic(false);
    setCustomTopic('');
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle speech for vocabulary word
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

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of vocabulary list
    const vocabularyList = document.getElementById('vocabulary-list');
    if (vocabularyList) {
      vocabularyList.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle bulk add words (text mode)
  const handleBulkAddText = async () => {
    if (!bulkWords.trim() || !bulkTopic.trim()) {
      alert('Please enter words and select a topic');
      return;
    }

    const lines = bulkWords.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      alert('Please enter at least one word');
      return;
    }

    setSubmitLoading(true);
    try {
      const promises = lines.map(async (line) => {
        const parts = line.split(':').map(p => p.trim());
        if (parts.length < 2) {
          throw new Error(`Invalid format: ${line}. Expected format: "word:meaning" or "word:meaning:phonetic"`);
        }

        const word = parts[0];
        const meaning = parts[1];
        const phonetic = parts[2] || word; // Use word as phonetic if not provided

        const response = await fetch('/api/vocabulary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word, meaning, phonetic, topic: bulkTopic })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to add "${word}": ${error.error}`);
        }

        return response.json();
      });

      await Promise.all(promises);
      await fetchVocabulary();
      setBulkWords('');
      setBulkTopic('');
      setShowBulkAdd(false);
      alert(`Successfully added ${lines.length} words to topic "${bulkTopic}"`);
    } catch (error) {
      console.error('Bulk add error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to add words'}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle bulk add words (select mode)
  const handleBulkAddSelect = async () => {
    if (selectedWords.size === 0 || !bulkTopic.trim()) {
      alert('Please select words and choose a topic');
      return;
    }

    setSubmitLoading(true);
    try {
      const promises = Array.from(selectedWords).map(async (wordId) => {
        const word = vocabulary.find(v => v.id === wordId);
        if (!word) return;

        const response = await fetch('/api/vocabulary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            word: word.word, 
            meaning: word.meaning, 
            phonetic: word.phonetic, 
            topic: bulkTopic 
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to add "${word.word}": ${error.error}`);
        }

        return response.json();
      });

      await Promise.all(promises);
      await fetchVocabulary();
      setSelectedWords(new Set());
      setBulkTopic('');
      setShowBulkAdd(false);
      alert(`Successfully added ${selectedWords.size} words to topic "${bulkTopic}"`);
    } catch (error) {
      console.error('Bulk add error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to add words'}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle word selection for bulk add
  const handleWordSelect = (wordId: number) => {
    const newSelected = new Set(selectedWords);
    if (newSelected.has(wordId)) {
      newSelected.delete(wordId);
    } else {
      newSelected.add(wordId);
    }
    setSelectedWords(newSelected);
  };

  // Select all filtered words
  const handleSelectAll = () => {
    const filtered = getBulkFilteredVocabulary();
    const allIds = new Set(filtered.map(v => v.id));
    setSelectedWords(allIds);
  };

  // Clear all selections
  const handleClearAll = () => {
    setSelectedWords(new Set());
  };

  // Fetch topic statistics
  const fetchTopicStats = async () => {
    try {
      const response = await fetch('/api/topics');
      if (response.ok) {
        const stats = await response.json();
        setTopicStats(stats);
      }
    } catch (error) {
      console.error('Error fetching topic stats:', error);
    }
  };

  // Add new topic
  const handleAddTopic = async () => {
    if (!newTopicName.trim()) {
      alert('Please enter a topic name');
      return;
    }

    try {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTopicName.trim() })
      });

      if (response.ok) {
        await fetchTopicStats();
        setNewTopicName('');
        setShowAddTopic(false);
        alert(`Topic "${newTopicName.trim()}" is ready to use. Add words to this topic to make it appear in the list.`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding topic:', error);
      alert('Failed to add topic');
    }
  };

  // Rename topic
  const handleRenameTopic = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName.trim()) {
      alert('Please enter a different topic name');
      return;
    }

    try {
      const response = await fetch('/api/topics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName, newName: newName.trim() })
      });

      if (response.ok) {
        const result = await response.json();
        await fetchTopicStats();
        await fetchVocabulary(); // Refresh vocabulary list
        setEditingTopic('');
        alert(result.message);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error renaming topic:', error);
      alert('Failed to rename topic');
    }
  };

  // Delete topic
  const handleDeleteTopic = async (topicName: string) => {
    if (!confirm(`Are you sure you want to delete topic "${topicName}" and all its words? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/topics', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: topicName })
      });

      if (response.ok) {
        const result = await response.json();
        await fetchTopicStats();
        await fetchVocabulary(); // Refresh vocabulary list
        alert(result.message);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert('Failed to delete topic');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Vocabulary</h1>
        <p className="text-gray-600">Add, edit, delete, and search your vocabulary collection.</p>
        
        {/* Debug Info for Speech */}
        {isSupported && (
          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
            <strong>Speech Debug:</strong> {availableVoices.length} Japanese voices available
            {availableVoices.length > 0 && (
              <div className="mt-1">
                Current: {currentVoice?.name || 'None'} | 
                All voices: {availableVoices.map(v => v.name).join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls Section */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
          {/* Search Input */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search words or meanings..."
              className="input-field"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
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
              <div className="text-sm text-gray-600 min-w-0 max-w-32 truncate" title={`${currentVoice?.name || 'No voice'} (${availableVoices.length} voices)`}>
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
          
          {/* Add New Button */}
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              if (showAddForm) resetForm();
            }}
            className="btn-primary whitespace-nowrap"
          >
            {showAddForm ? 'Cancel' : '+ Add New Word'}
          </button>
          <button
            onClick={() => {
              setShowBulkAdd(!showBulkAdd);
              if (showBulkAdd) {
                setBulkWords('');
                setBulkTopic('');
              }
            }}
            className="btn-secondary whitespace-nowrap"
          >
            {showBulkAdd ? 'Cancel Bulk Add' : '📝 Bulk Add Words'}
          </button>
          <button
            onClick={() => {
              setShowTopicManagement(!showTopicManagement);
              if (showTopicManagement) {
                setEditingTopic('');
                setNewTopicName('');
                setShowAddTopic(false);
              }
            }}
            className="btn-secondary whitespace-nowrap"
          >
            {showTopicManagement ? 'Cancel Topic Management' : '🏷️ Manage Topics'}
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? 'Edit Vocabulary' : 'Add New Vocabulary'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Word *
                  </label>
                  <input
                    type="text"
                    name="word"
                    value={formData.word}
                    onChange={handleInputChange}
                    className={`input-field ${formErrors.word ? 'border-red-500' : ''}`}
                    placeholder="Enter word..."
                  />
                  {formErrors.word && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.word}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meaning *
                  </label>
                  <input
                    type="text"
                    name="meaning"
                    value={formData.meaning}
                    onChange={handleInputChange}
                    className={`input-field ${formErrors.meaning ? 'border-red-500' : ''}`}
                    placeholder="Enter meaning..."
                  />
                  {formErrors.meaning && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.meaning}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phonetic *
                  </label>
                  <input
                    type="text"
                    name="phonetic"
                    value={formData.phonetic}
                    onChange={handleInputChange}
                    className={`input-field ${formErrors.phonetic ? 'border-red-500' : ''}`}
                    placeholder="Enter phonetic..."
                  />
                  {formErrors.phonetic && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.phonetic}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Topic *
                  </label>
                  <div className="space-y-2">
                    <select
                      name="topic"
                      value={formData.topic}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setShowCustomTopic(true);
                          setFormData(prev => ({ ...prev, topic: '' }));
                        } else {
                          setShowCustomTopic(false);
                          setFormData(prev => ({ ...prev, topic: e.target.value }));
                        }
                      }}
                      className={`input-field ${formErrors.topic ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select topic...</option>
                      {availableTopics.map((topic) => (
                        <option key={topic} value={topic}>
                          {topic}
                        </option>
                      ))}
                      <option value="custom">+ Add new topic</option>
                    </select>
                    
                    {showCustomTopic && (
                      <input
                        type="text"
                        value={customTopic}
                        onChange={(e) => {
                          setCustomTopic(e.target.value);
                          setFormData(prev => ({ ...prev, topic: e.target.value }));
                        }}
                        className="input-field"
                        placeholder="Enter new topic name..."
                      />
                    )}
                  </div>
                  {formErrors.topic && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.topic}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="btn-primary"
                >
                  {submitLoading ? 'Saving...' : (editingId ? 'Update' : 'Add')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bulk Add Form */}
        {showBulkAdd && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Bulk Add Words</h3>
            
            {/* Mode Selection */}
            <div className="mb-4">
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="bulkMode"
                    value="select"
                    checked={bulkMode === 'select'}
                    onChange={(e) => setBulkMode(e.target.value as 'select' | 'text')}
                    className="mr-2"
                  />
                  Select from existing words
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="bulkMode"
                    value="text"
                    checked={bulkMode === 'text'}
                    onChange={(e) => setBulkMode(e.target.value as 'select' | 'text')}
                    className="mr-2"
                  />
                  Enter new words
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Topic
                </label>
                <select
                  value={bulkTopic}
                  onChange={(e) => setBulkTopic(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select topic...</option>
                  {availableTopics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </div>

              {bulkMode === 'select' ? (
                <>
                  {/* Search for words */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Words
                    </label>
                    <input
                      type="text"
                      value={bulkSearchTerm}
                      onChange={(e) => setBulkSearchTerm(e.target.value)}
                      className="input-field"
                      placeholder="Search by word, meaning, phonetic, or topic..."
                    />
                  </div>

                  {/* Selection controls */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={handleSelectAll}
                      className="btn-secondary text-sm"
                    >
                      Select All ({getBulkFilteredVocabulary().length})
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="btn-secondary text-sm"
                    >
                      Clear All
                    </button>
                    <span className="text-sm text-gray-600 self-center">
                      {selectedWords.size} selected
                    </span>
                  </div>

                  {/* Word selection list */}
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    {getBulkFilteredVocabulary().length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No words found
                      </div>
                    ) : (
                      <div className="divide-y">
                        {getBulkFilteredVocabulary().map((vocab) => (
                          <div
                            key={vocab.id}
                            className={`p-3 flex items-center space-x-3 hover:bg-gray-50 ${
                              selectedWords.has(vocab.id) ? 'bg-blue-50' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedWords.has(vocab.id)}
                              onChange={() => handleWordSelect(vocab.id)}
                              className="h-4 w-4 text-blue-600"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{vocab.word}</span>
                                <span className="text-gray-600">{vocab.meaning}</span>
                                <span className="text-gray-500 font-mono text-sm">{vocab.phonetic}</span>
                              </div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                {vocab.topic}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Text input mode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Words (one per line)
                    </label>
                    <textarea
                      value={bulkWords}
                      onChange={(e) => setBulkWords(e.target.value)}
                      className="input-field h-32 resize-none"
                      placeholder={`Enter words in format:
word:meaning
word:meaning:phonetic

Example:
こんにちは:hello
ありがとう:thank you:arigatou
さようなら:goodbye:sayounara`}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Format: word:meaning or word:meaning:phonetic (one per line)
                    </p>
                  </div>
                </>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={bulkMode === 'select' ? handleBulkAddSelect : handleBulkAddText}
                  disabled={
                    submitLoading || 
                    !bulkTopic.trim() || 
                    (bulkMode === 'select' ? selectedWords.size === 0 : !bulkWords.trim())
                  }
                  className="btn-primary"
                >
                  {submitLoading ? 'Adding...' : `Add ${bulkMode === 'select' ? selectedWords.size : 'All'} Words`}
                </button>
                <button
                  onClick={() => {
                    setBulkWords('');
                    setBulkTopic('');
                    setBulkSearchTerm('');
                    setSelectedWords(new Set());
                    setShowBulkAdd(false);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Topic Management */}
        {showTopicManagement && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Topic Management</h3>
            
            {/* Add New Topic */}
            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setShowAddTopic(!showAddTopic)}
                  className="btn-primary"
                >
                  {showAddTopic ? 'Cancel' : '+ Add New Topic'}
                </button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Topics are created when you add words to them. 
                  Use this to prepare a topic name that will be available when adding new vocabulary.
                </p>
              </div>
              
              {showAddTopic && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTopicName}
                      onChange={(e) => setNewTopicName(e.target.value)}
                      className="input-field flex-1"
                      placeholder="Enter new topic name..."
                    />
                    <button
                      onClick={handleAddTopic}
                      disabled={!newTopicName.trim()}
                      className="btn-primary"
                    >
                      Add Topic
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Topics List */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Existing Topics</h4>
              {topicStats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No topics found
                </div>
              ) : (
                <div className="grid gap-3">
                  {topicStats.map((topic) => (
                    <div
                      key={topic.name}
                      className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {topic.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {topic.count} word{topic.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {editingTopic === topic.name ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              defaultValue={topic.name}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleRenameTopic(topic.name, e.currentTarget.value);
                                } else if (e.key === 'Escape') {
                                  setEditingTopic('');
                                }
                              }}
                              className="input-field text-sm"
                              autoFocus
                            />
                            <button
                              onClick={(e) => {
                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                handleRenameTopic(topic.name, input.value);
                              }}
                              className="btn-primary text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingTopic('')}
                              className="btn-secondary text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingTopic(topic.name)}
                              className="text-blue-600 hover:text-blue-900 text-sm"
                            >
                              Rename
                            </button>
                            <button
                              onClick={() => handleDeleteTopic(topic.name)}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Vocabulary List */}
      <div className="card" id="vocabulary-list">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Vocabulary List ({filteredVocabulary.length})
            {totalPages > 1 && (
              <span className="text-sm text-gray-500 ml-2">
                (Page {currentPage} of {totalPages})
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading vocabulary...</p>
          </div>
        ) : filteredVocabulary.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-gray-600">
              {searchTerm ? 'No vocabulary found matching your search.' : 'No vocabulary added yet. Start by adding your first word!'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto" style={{ maxHeight: '100vh', overflowY: 'auto' }}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Word
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meaning
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phonetic
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Topic
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentVocabulary.map((vocab) => (
                    <tr key={vocab.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-900">{vocab.word}</div>
                          {isSupported && (
                            <button
                              onClick={() => handleSpeakWord(vocab.word, vocab.phonetic)}
                              disabled={speakingWord === vocab.word}
                              className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
                              title="Listen to pronunciation"
                            >
                              {speakingWord === vocab.word ? (
                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.816a1 1 0 011-.108zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{vocab.meaning}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 font-mono">{vocab.phonetic}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {vocab.topic}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => startEdit(vocab)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(vocab.id, vocab.word)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4" style={{ maxHeight: '100vh', overflowY: 'auto' }}>
              {currentVocabulary.map((vocab) => (
                <div key={vocab.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{vocab.word}</h3>
                      {isSupported && (
                        <button
                          onClick={() => handleSpeakWord(vocab.word, vocab.phonetic)}
                          disabled={speakingWord === vocab.word}
                          className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
                          title="Listen to pronunciation"
                        >
                          {speakingWord === vocab.word ? (
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.816a1 1 0 011-.108zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEdit(vocab)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(vocab.id, vocab.word)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-1">{vocab.meaning}</p>
                  <p className="text-gray-600 font-mono text-sm mb-2">{vocab.phonetic}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {vocab.topic}
                  </span>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredVocabulary.length)} of {filteredVocabulary.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 text-sm border rounded-md ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VocabularyPage;
