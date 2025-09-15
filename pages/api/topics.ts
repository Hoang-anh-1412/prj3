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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      // Get all unique topics
      try {
        const vocabulary = readVocabulary();
        const topics = Array.from(new Set(vocabulary.map(v => v.topic))).sort();
        
        // Count words per topic
        const topicStats = topics.map(topic => ({
          name: topic,
          count: vocabulary.filter(v => v.topic === topic).length
        }));

        return res.status(200).json(topicStats);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch topics' });
      }

    case 'POST':
      // Create new topic (by adding a word with new topic)
      try {
        const { name } = req.body;
        
        if (!name || typeof name !== 'string' || name.trim() === '') {
          return res.status(400).json({ error: 'Topic name is required' });
        }

        const topicName = name.trim();
        const vocabulary = readVocabulary();
        
        // Check if topic already exists
        const existingTopic = vocabulary.find(v => v.topic === topicName);
        if (existingTopic) {
          return res.status(400).json({ error: 'Topic already exists' });
        }

        // For now, just return success - topic will be created when first word is added
        // In a real app, you might want to create a separate topics table
        return res.status(200).json({ 
          message: 'Topic created successfully',
          topic: topicName 
        });
      } catch (error) {
        console.error('Error creating topic:', error);
        return res.status(500).json({ error: 'Failed to create topic' });
      }

    case 'PUT':
      // Rename topic
      try {
        const { oldName, newName } = req.body;
        
        if (!oldName || !newName || typeof oldName !== 'string' || typeof newName !== 'string') {
          return res.status(400).json({ error: 'Old name and new name are required' });
        }

        const oldTopicName = oldName.trim();
        const newTopicName = newName.trim();
        
        if (oldTopicName === newTopicName) {
          return res.status(400).json({ error: 'New name must be different from old name' });
        }

        const vocabulary = readVocabulary();
        
        // Check if old topic exists
        const oldTopicWords = vocabulary.filter(v => v.topic === oldTopicName);
        if (oldTopicWords.length === 0) {
          return res.status(404).json({ error: 'Topic not found' });
        }

        // Check if new topic name already exists
        const existingTopic = vocabulary.find(v => v.topic === newTopicName);
        if (existingTopic) {
          return res.status(400).json({ error: 'New topic name already exists' });
        }

        // Update all words with old topic to new topic
        const updatedVocabulary = vocabulary.map(v => 
          v.topic === oldTopicName ? { ...v, topic: newTopicName } : v
        );

        writeVocabulary(updatedVocabulary);

        return res.status(200).json({ 
          message: `Topic renamed from "${oldTopicName}" to "${newTopicName}"`,
          updatedCount: oldTopicWords.length
        });
      } catch (error) {
        return res.status(500).json({ error: 'Failed to rename topic' });
      }

    case 'DELETE':
      // Delete topic (and all words in that topic)
      try {
        const { name } = req.body;
        
        if (!name || typeof name !== 'string' || name.trim() === '') {
          return res.status(400).json({ error: 'Topic name is required' });
        }

        const topicName = name.trim();
        const vocabulary = readVocabulary();
        
        // Check if topic exists
        const topicWords = vocabulary.filter(v => v.topic === topicName);
        if (topicWords.length === 0) {
          return res.status(404).json({ error: 'Topic not found' });
        }

        // Remove all words with this topic
        const updatedVocabulary = vocabulary.filter(v => v.topic !== topicName);
        writeVocabulary(updatedVocabulary);

        return res.status(200).json({ 
          message: `Topic "${topicName}" and ${topicWords.length} words deleted successfully`,
          deletedCount: topicWords.length
        });
      } catch (error) {
        return res.status(500).json({ error: 'Failed to delete topic' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}
