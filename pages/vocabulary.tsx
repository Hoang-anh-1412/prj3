// Vocabulary management page with CRUD operations
import React, { useState, useEffect } from 'react';
import { Vocabulary } from '../types';

const VocabularyPage: React.FC = () => {
  // State management
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [filteredVocabulary, setFilteredVocabulary] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ word: '', meaning: '' });
  const [formErrors, setFormErrors] = useState({ word: '', meaning: '' });
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

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
             v.meaning.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVocabulary(filtered);
    }
  }, [vocabulary, searchTerm]);

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
    const errors = { word: '', meaning: '' };
    let isValid = true;

    if (!formData.word.trim()) {
      errors.word = 'Word is required';
      isValid = false;
    }

    if (!formData.meaning.trim()) {
      errors.meaning = 'Meaning is required';
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
    setFormData({ word: vocab.word, meaning: vocab.meaning });
    setShowAddForm(true);
    setFormErrors({ word: '', meaning: '' });
  };

  // Reset form and close it
  const resetForm = () => {
    setFormData({ word: '', meaning: '' });
    setFormErrors({ word: '', meaning: '' });
    setEditingId(null);
    setShowAddForm(false);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Vocabulary</h1>
        <p className="text-gray-600">Add, edit, delete, and search your vocabulary collection.</p>
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
      </div>

      {/* Vocabulary List */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Vocabulary List ({filteredVocabulary.length})
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
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Word
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meaning
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVocabulary.map((vocab) => (
                    <tr key={vocab.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{vocab.word}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{vocab.meaning}</div>
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
            <div className="md:hidden space-y-4">
              {filteredVocabulary.map((vocab) => (
                <div key={vocab.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{vocab.word}</h3>
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
                  <p className="text-gray-700">{vocab.meaning}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VocabularyPage;
