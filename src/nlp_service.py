from typing import Optional
from .tools.create_note import CreateNoteTool
from .tools.find_note import FindNoteTool
from .tools.update_description import UpdateDescriptionTool
from .tools.delete_note import DeleteNoteTool
from .vector_utils import VectorUtils, normalize_text
import numpy as np
from rapidfuzz import process

DELETE_INTENTS = [
    "yes", "yes delete", "delete", "delete the note", "remove it", "remove note", "please delete", "delete this note"
]

def is_delete_intent(user_input):
    match = process.extractOne(user_input.lower(), DELETE_INTENTS, score_cutoff=70)
    return match is not None

def extract_title_from_command(command, canonical_phrases):
    # Find the longest matching canonical phrase at the start of the command
    command_lower = command.lower()
    best_match = ''
    for phrase in sorted(canonical_phrases, key=len, reverse=True):
        if command_lower.startswith(phrase.lower()):
            best_match = phrase
            break
    if best_match:
        title = command[len(best_match):].strip()
        return best_match, title
    return None, command

class NLPService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.model = None
        self.embed_model = None
        if api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel('gemini-2.0-flash')
                # Try to get embedding model if available
                if hasattr(genai, 'EmbeddingModel'):
                    self.embed_model = genai.EmbeddingModel('models/embedding-001')
                else:
                    self.embed_model = self.model  # fallback
            except Exception as e:
                print(f"[DEBUG] Error initializing Gemini model: {e}")
        self.notes = []
        self.vector_utils = VectorUtils(self.embed_model)
        self.tools = {
            "create": CreateNoteTool(self.notes, self),
            "find": FindNoteTool(self.notes, self.vector_utils),
        }
        self.recording = False
        self.recording_note_title = None
        self.accumulated_description = []
        self.update_description_tool = UpdateDescriptionTool(self)
        self.general_tool = GeneralTool(self.tools, self.vector_utils)
        self.last_found_note_title = None
        self.delete_note_tool = DeleteNoteTool(self.notes)

    def handle_command(self, command: str, data):
        if self.recording:
            return self._handle_recording_state(command, data)
        if isinstance(command, str) and command.lower() == "cancel":
            return self._handle_cancel(command)
        if isinstance(command, str):
            result = self._handle_create_or_find(command, data)
            if result is not None:
                return result
            result = self._handle_delete_after_find(command)
            if result is not None:
                return result
        if command == "find":
            return self._handle_find_flow(command, data)
        if command == "update description":
            return self._handle_update_description(data)
        return self.general_tool.route(command, data)

    def _handle_recording_state(self, command, data):
        if isinstance(command, str) and command.lower() == "stop recording":
            return self.update_description_tool.stop()
        elif isinstance(command, str) and command.lower() == "cancel":
            self.recording = False
            self.recording_note_title = None
            self.accumulated_description = []
            return "Update cancelled. Description not changed."
        else:
            return self.update_description_tool.accumulate(data if isinstance(data, str) else str(data))

    def _handle_cancel(self, command):
        return "Action cancelled."

    def _handle_create_or_find(self, command, data):
        create_phrases = [p for p in self.tools if p == "create"] + GeneralTool.CANONICALS["create"]
        find_phrases = [p for p in self.tools if p == "find"] + GeneralTool.CANONICALS["find"]
        action, title = extract_title_from_command(command, create_phrases)
        if action and action in create_phrases:
            if isinstance(data, dict):
                note_obj = {"title": data.get("title", title), "description": data.get("description", "")}
            else:
                note_obj = {"title": title, "description": ""}
            return self.tools["create"].run(note_obj)
        action, title = extract_title_from_command(command, find_phrases)
        if action and action in find_phrases:
            if action == "find" and (not title or title == ""):
                result = self.tools["find"].run(data)
                matches = [note for note in self.notes if note["title"] == data]
                if len(matches) == 1:
                    self.last_found_note_title = matches[0]["title"]
                    return f"Found 1 record '{matches[0]['title']}'. Would you like me to update description or delete the record?"
                if isinstance(result, str) and result.startswith("Notes found:"):
                    found_titles = [t.strip() for t in result[len("Notes found:"):].split(",")]
                    if len(found_titles) == 1:
                        self.last_found_note_title = found_titles[0]
                        return f"Found 1 record '{found_titles[0]}'. Would you like me to update description or delete the record?"
                return result
            result = self.tools["find"].run(title)
            matches = [note for note in self.notes if note["title"] == title]
            if len(matches) == 1:
                self.last_found_note_title = matches[0]["title"]
                return f"Found 1 record '{matches[0]['title']}'. Would you like me to update description or delete the record?"
            if isinstance(result, str) and result.startswith("Notes found:"):
                found_titles = [t.strip() for t in result[len("Notes found:"):].split(",")]
                if len(found_titles) == 1:
                    self.last_found_note_title = found_titles[0]
                    return f"Found 1 record '{found_titles[0]}'. Would you like me to update description or delete the record?"
            return result
        return None

    def _handle_delete_after_find(self, command):
        if self.last_found_note_title and is_delete_intent(command):
            deleted = self.delete_note_tool.run(self.last_found_note_title)
            self.last_found_note_title = None
            return deleted
        return None

    def _handle_find_flow(self, command, data):
        result = self.general_tool.route(command, data)
        matches = [note for note in self.notes if note["title"] == data]
        if len(matches) == 1:
            self.last_found_note_title = matches[0]["title"]
            return f"Found 1 record '{matches[0]['title']}'. Would you like me to update description or delete the record?"
        return result

    def _handle_update_description(self, data):
        return self.update_description_tool.start(data)

class GeneralTool:
    CANONICALS = {
        "create": [
            "add a note", "jot note", "note down", "create", "create note", "add note", "new note", "create a new note", "add a new note", "make note", "write note", "save note", "record note", "capture note", "take note", "add something", "add entry", "add record", "add text", "add message", "add memo", "add reminder", "add log", "add journal", "add thought", "add idea", "add info", "add information", "write something", "write entry", "write record", "write text", "write message", "write memo", "write reminder", "write log", "write journal", "write thought", "write idea", "write info", "write information"
        ],
        "find": [
            "find", "search note", "look for note", "get note", "locate note", "lookup note", "retrieve note", "show note", "display note", "view note"
        ],
    }

    def __init__(self, tools, vector_utils):
        self.tools = tools
        self.vector_utils = vector_utils
        self._init_embeddings()

    def _init_embeddings(self):
        # Flatten phrases and keep mapping to action
        self.phrase_to_action = {}
        self.phrases = []
        for action, phrases in self.CANONICALS.items():
            for phrase in phrases:
                self.phrase_to_action[phrase] = action
                self.phrases.append(phrase)
        # Compute embeddings for all phrases
        self.embeddings = self.vector_utils.embed_texts([normalize_text(p) for p in self.phrases])

    def route(self, command: str, text: str):
        # If command is a known action, use it directly
        if command in self.tools:
            print(f"[DEBUG] Router: Direct match for command '{command}'")
            return self.tools[command].run(text)
        # Manual override: if normalized command matches any create phrase, route to create
        norm_command = normalize_text(command)
        create_phrases = [normalize_text(p) for p in self.CANONICALS["create"]]
        if norm_command in create_phrases:
            print(f"[DEBUG] Router: Manual override for create command '{command}'")
            return self.tools["create"].run(text)
        # Otherwise, use vector similarity to match user input
        user_embedding = self.vector_utils.embed_text(norm_command)
        sims = [self.vector_utils.cosine_similarity(user_embedding, emb) for emb in self.embeddings]
        best_idx = int(np.argmax(sims))
        best_sim = sims[best_idx]
        best_phrase = self.phrases[best_idx]
        best_action = self.phrase_to_action[best_phrase]
        threshold = 0.6  # slightly increased similarity threshold
        print(f"[DEBUG] Router: Command '{command}' | Best match: '{best_phrase}' | Similarity: {best_sim:.2f} | Selected action: {best_action}")
        if best_sim < threshold:
            available = ', '.join(self.tools.keys())
            return (f"The command '{command}' is unsupported. "
                    f"Available commands: {available}. "
                    f"Did you mean: {best_action}?")
        return self.tools[best_action].run(text) 