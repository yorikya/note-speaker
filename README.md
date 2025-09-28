# DroidScript Note Secretary App

## Overview
The `note_secretary_router.js` file now contains a complete DroidScript application with:
- **Note Router Integration** - Processes commands in English and Hebrew
- **Gemini AI Chat** - Conversational responses for unknown commands
- **Conversation History** - Chat-like interface with timestamps
- **TTS Support** - Text-to-speech for responses
- **Auto Language Detection** - Automatically detects English/Hebrew input

## Features

### 🎯 Main Functions
- **`OnStart()`** - Main DroidScript entry point
- **`CreateMainLayout()`** - Creates the UI layout
- **`ProcessUserInput()`** - Processes user commands
- **`UpdateConversationDisplay()`** - Updates chat display
- **`UpdateConversationHistory()`** - Manages conversation history
- **`SpeakText()`** - TTS integration

### 🎨 UI Components
- **Title** - "Note Secretary" header
- **Status Display** - Shows current processing status
- **Conversation History** - Scrollable chat display
- **Input Field** - Text input for commands
- **Process Button** - Processes user input
- **Clear Button** - Clears conversation history
- **TTS Toggle** - Enables/disables text-to-speech

### 🤖 Supported Commands
- **English**: "create a note groceries", "find note shopping", "delete note old"
- **Hebrew**: "צור פתק קניות", "מצא פתק קניות", "מחק פתק ישן"
- **Conversational**: "I want to remember something", "Help me organize my notes"

### 🔧 Configuration
- **API Key**: Set in `OnStart()` function
- **TTS**: Toggleable via UI button
- **Language**: Auto-detected from input
- **Theme**: Dark theme with custom colors

## Usage

### In DroidScript:
1. Copy `note_secretary_router.js` to your DroidScript project
2. The `OnStart()` function will automatically initialize the app
3. Users can type commands and get responses
4. Gemini AI handles unknown commands conversationally

### Example Commands:
```
User: "create a note groceries"
Assistant: "Action: create_note (confidence: 1) Title: groceries"

User: "I want to remember something"
Assistant: "I can help you create a note! What would you like to remember?"

User: "צור פתק קניות"
Assistant: "Action: create_note (confidence: 1) Title: קניות"
```

## Technical Details

### Dependencies:
- **Gemini API** - For conversational responses
- **DroidScript Framework** - For UI and TTS
- **XMLHttpRequest** - For API calls (available in DroidScript)

### Error Handling:
- **No API Key** - Shows error message
- **Network Issues** - Falls back to available commands
- **Invalid Input** - Shows helpful suggestions

### Performance:
- **Conversation History** - Limited to 10 messages
- **API Timeout** - 10 seconds
- **Retry Logic** - 3 attempts for failed requests

## Ready for Deployment! 🚀

The `note_secretary_router.js` file is now a complete DroidScript application that can be deployed directly.
