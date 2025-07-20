class CreateNoteTool:
    def __init__(self, notes, nlp_service):
        self.notes = notes
        self.nlp_service = nlp_service

    def run(self, data):
        # Expect data to be a dict with 'title' and 'description'
        title = data.get('title') if isinstance(data, dict) else data
        description = data.get('description', '') if isinstance(data, dict) else ''
        note = {"title": title, "description": description}
        self.notes.append(note)
        print(f"[DEBUG] Created note: {note}")
        print(f"[DEBUG] Current notes list: {self.notes}")
        return f"Note created: {title}" 