// API route for vocabulary CRUD operations
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { Vocabulary } from '../../types';

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

// Helper function to write vocabulary to JSON file
const writeVocabulary = (vocabulary: Vocabulary[]): void => {
  try {
    const dir = path.dirname(vocabularyFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(vocabularyFilePath, JSON.stringify(vocabulary, null, 2));
  } catch (error) {
    console.error('Error writing vocabulary file:', error);
    throw new Error('Failed to save vocabulary');
  }
};

// Helper function to get next ID
const getNextId = (vocabulary: Vocabulary[]): number => {
  if (vocabulary.length === 0) return 1;
  return Math.max(...vocabulary.map(v => v.id)) + 1;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      // Get all vocabulary or search by keyword
      try {
        const vocabulary = readVocabulary();
        const { search } = req.query;
        
        if (search && typeof search === 'string') {
          const searchTerm = search.toLowerCase();
          const filtered = vocabulary.filter(
            v => v.word.toLowerCase().includes(searchTerm) || 
                 v.meaning.toLowerCase().includes(searchTerm)
          );
          return res.status(200).json(filtered);
        }
        
        return res.status(200).json(vocabulary);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch vocabulary' });
      }

    case 'POST':
      // Add new vocabulary
      try {
        const { word, meaning } = req.body;
        
        if (!word || !meaning) {
          return res.status(400).json({ error: 'Word and meaning are required' });
        }

        const vocabulary = readVocabulary();
        
        // Check if word already exists
        const existingWord = vocabulary.find(v => v.word.toLowerCase() === word.toLowerCase());
        if (existingWord) {
          return res.status(400).json({ error: 'Word already exists' });
        }

        const newVocabulary: Vocabulary = {
          id: getNextId(vocabulary),
          word: word.trim(),
          meaning: meaning.trim()
        };

        vocabulary.push(newVocabulary);
        writeVocabulary(vocabulary);

        return res.status(201).json(newVocabulary);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to add vocabulary' });
      }

    case 'PUT':
      // Update existing vocabulary
      try {
        const { id, word, meaning } = req.body;
        
        if (!id || !word || !meaning) {
          return res.status(400).json({ error: 'ID, word and meaning are required' });
        }

        const vocabulary = readVocabulary();
        const index = vocabulary.findIndex(v => v.id === parseInt(id));
        
        if (index === -1) {
          return res.status(404).json({ error: 'Vocabulary not found' });
        }

        // Check if word already exists (excluding current item)
        const existingWord = vocabulary.find(v => 
          v.word.toLowerCase() === word.toLowerCase() && v.id !== parseInt(id)
        );
        if (existingWord) {
          return res.status(400).json({ error: 'Word already exists' });
        }

        vocabulary[index] = {
          id: parseInt(id),
          word: word.trim(),
          meaning: meaning.trim()
        };

        writeVocabulary(vocabulary);
        return res.status(200).json(vocabulary[index]);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to update vocabulary' });
      }

    case 'DELETE':
      // Delete vocabulary
      try {
        const { id } = req.query;
        
        if (!id || Array.isArray(id)) {
          return res.status(400).json({ error: 'Valid ID is required' });
        }

        const vocabulary = readVocabulary();
        const filteredVocabulary = vocabulary.filter(v => v.id !== parseInt(id));
        
        if (filteredVocabulary.length === vocabulary.length) {
          return res.status(404).json({ error: 'Vocabulary not found' });
        }

        writeVocabulary(filteredVocabulary);
        return res.status(200).json({ message: 'Vocabulary deleted successfully' });
      } catch (error) {
        return res.status(500).json({ error: 'Failed to delete vocabulary' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}
