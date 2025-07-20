# Note Speaker

A natural language note-taking assistant with LLM-powered command understanding, designed for Kivy/Buildozer Android apps (but works as a Python module).

## Features

- **Create notes** using natural language ("create note shopping list").
- **Find notes** with fuzzy and semantic matching ("find shopping list", "show note groceries").
- **Update note descriptions** in a conversational, multi-step flow ("update description", then send lines, then "stop recording").
- **Delete notes** with natural language confirmation ("delete", "remove it", etc.).
- **Robust command recognition** using canonical phrases, fuzzy matching, and vector similarity.

## Installation

1. Clone the repository:
   ```sh
   git clone <your-repo-url>
   cd note-speaker
   ```
2. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
3. (Optional) For LLM-powered semantic matching, set up a Google Gemini API key:
   ```sh
   export GOOGLE_API_KEY=your-key-here
   ```

## Usage

Currently, the main entry point is via the `NLPService` class in Python. (A Kivy UI is planned.)

### Example Conversation (Python)

```python
from src.nlp_service import NLPService
nlp = NLPService()

# Create a note
print(nlp.handle_command("create note shopping list", "create note shopping list"))
# Output: Note created: shopping list

# Find a note
print(nlp.handle_command("find note shopping list", "find note shopping list"))
# Output: Found 1 record 'shopping list'. Would you like me to update description or delete the record?

# Update description (multi-step)
print(nlp.handle_command("update description", "shopping list"))
# Output: Starting description accumulation for 'shopping list'. Send your description lines. Say 'stop recording' to finish.
print(nlp.handle_command("accumulate", "This note is for weekly shopping"))
print(nlp.handle_command("accumulate", "Also for small items"))
print(nlp.handle_command("stop recording", ""))
# Output: Stopped recording. Updated 'shopping list' description.

# Delete a note
print(nlp.handle_command("delete", ""))
# Output: Note "shopping list" was deleted.
```

### Example Natural Language Flows

- "add a new note groceries"
- "show note groceries"
- "remove it" (after finding a note)
- "update description" → "Milk, eggs, bread" → "stop recording"
- "cancel" (to abort a multi-step flow)

## Requirements
- Python 3.8+
- [Kivy](https://kivy.org/)
- [rapidfuzz](https://github.com/maxbachmann/RapidFuzz)
- [pytest](https://docs.pytest.org/)
- [google-generativeai](https://github.com/google/generative-ai-python) (optional, for LLM features)

## Testing

Run all tests with:
```sh
pytest
```

## Roadmap
- Kivy/Buildozer Android UI
- Persistent storage
- More LLM-powered features

---

*Note: This project is under active development. Contributions and feedback are welcome!* 