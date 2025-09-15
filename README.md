# 📚 Vocabulary Learning App

A comprehensive web application built with React and Next.js for learning and managing vocabulary. Practice your vocabulary with interactive quizzes and manage your personal word collection.

## ✨ Features

### 📝 Vocabulary Management (CRUD)
- **Display All**: View all vocabulary entries in a responsive table/list format
- **Add New Words**: Add new words with their meanings to your collection  
- **Edit Existing**: Update words and meanings with inline editing
- **Delete Words**: Remove unwanted vocabulary entries
- **Search & Filter**: Find words quickly by searching through words or meanings

### 🧠 Interactive Quiz Mode
- **Multiple Choice Questions**: 4-option multiple choice format
- **Dual Quiz Types**: 
  - Word → Meaning: See a word, choose the correct meaning
  - Meaning → Word: See a meaning, choose the correct word
  - Mixed Mode: Random combination of both types
- **Instant Feedback**: Immediate indication of correct/incorrect answers
- **Continuous Flow**: Automatic progression to next question after selection
- **Smart Question Generation**: Random selection with proper incorrect options

### 📊 Quiz Results & Analytics
- **Score Display**: Percentage and fraction of correct answers
- **Performance Feedback**: Encouraging messages based on performance
- **Detailed Summary**: Complete review of all questions with correct/incorrect indicators
- **Progress Tracking**: Visual progress bar during quiz

### 💾 Data Persistence
- **JSON File Storage**: All vocabulary stored in server-side JSON file
- **Real-time Updates**: All CRUD operations immediately update the JSON file
- **Data Validation**: Prevents duplicate words and validates input

### 🎨 User Interface
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional design using Tailwind CSS
- **Intuitive Navigation**: Clear navigation between different sections
- **Loading States**: Smooth loading indicators and transitions
- **Error Handling**: User-friendly error messages and validation

## 🚀 Getting Started

### Prerequisites
- Node.js 16.0 or later
- npm or yarn package manager

### Installation

1. **Clone or download the project files**

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   # or  
   yarn dev
   ```

4. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
vocabulary-learning-app/
├── components/           # React components
│   └── Layout.tsx       # Main layout with navigation
├── data/                # Data storage
│   └── vocabulary.json  # JSON file for vocabulary storage
├── pages/               # Next.js pages
│   ├── api/            # API routes
│   │   ├── vocabulary.ts  # CRUD operations API
│   │   └── quiz.ts       # Quiz generation API
│   ├── _app.tsx        # Main App component
│   ├── index.tsx       # Home page
│   ├── vocabulary.tsx  # Vocabulary management page
│   └── quiz.tsx        # Quiz mode page
├── styles/             # CSS styles
│   └── globals.css     # Global styles and Tailwind
├── types/              # TypeScript definitions
│   └── index.ts        # Type definitions
└── README.md          # Project documentation
```

## 🎯 Usage Guide

### 1. **Adding Vocabulary**
- Navigate to "Manage Vocabulary" from the navigation menu
- Click "Add New Word" button
- Enter the word and its meaning
- Click "Add" to save

### 2. **Managing Existing Vocabulary**
- Use the search box to find specific words
- Click "Edit" on any word to modify it
- Click "Delete" to remove unwanted words
- All changes are automatically saved

### 3. **Taking Quizzes**
- Go to "Quiz Mode" from the navigation menu  
- Choose your preferred quiz type:
  - **Word → Meaning**: See words, choose meanings
  - **Meaning → Word**: See meanings, choose words
  - **Mixed Mode**: Random combination
- Answer questions by clicking on options
- Click "Finish Quiz" when you're done
- Review your results and detailed summary

### 4. **Viewing Results**
- See your score as percentage and fraction
- Review each question with your answer vs correct answer
- Get performance feedback and encouragement
- Take another quiz or return to manage vocabulary

## 💻 Technical Details

### Built With
- **Next.js 14** - React framework for production
- **React 18** - UI library with hooks for state management
- **TypeScript** - Type safety and better development experience
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Node.js File System** - Server-side file operations for data persistence

### Key Features Implementation
- **API Routes**: RESTful API endpoints for vocabulary CRUD and quiz generation
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Type Safety**: Full TypeScript implementation with proper interfaces
- **State Management**: React hooks (useState, useEffect) for client-state
- **Error Handling**: Comprehensive error handling and user feedback
- **Data Validation**: Client and server-side validation

### API Endpoints
- `GET /api/vocabulary` - Fetch all vocabulary or search
- `POST /api/vocabulary` - Add new vocabulary
- `PUT /api/vocabulary` - Update existing vocabulary
- `DELETE /api/vocabulary?id={id}` - Delete vocabulary
- `GET /api/quiz?mode={mode}` - Generate quiz question

## 🔧 Customization

### Adding New Quiz Modes
1. Update the `QuizMode` type in `types/index.ts`
2. Modify the quiz generation logic in `pages/api/quiz.ts`
3. Add new mode option in the quiz mode selection UI

### Styling Changes
- Modify `styles/globals.css` for global styles
- Update Tailwind classes in components for UI changes
- Customize color scheme in `tailwind.config.js`

### Data Storage
- Current implementation uses JSON file storage
- Can be easily extended to use databases (MongoDB, PostgreSQL, etc.)
- Modify API routes in `pages/api/` to change storage backend

## 📚 Sample Vocabulary

The app comes with 10 sample vocabulary entries to get you started:
- Basic greetings (Hello, Goodbye, Thank you)
- Common words (Yes, No, Please)
- Descriptive words (Beautiful, Amazing)
- Technology terms (Computer, Internet)

## 🤝 Contributing

1. Fork the project
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues or have questions:
1. Check the browser console for error messages
2. Ensure all dependencies are properly installed
3. Verify that the development server is running on port 3000
4. Make sure you have at least 4 vocabulary entries for quiz mode

---

**Happy Learning! 🎉**

Start building your vocabulary today with this interactive learning tool!
