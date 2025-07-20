class UpdateDescriptionTool:
    def __init__(self, nlp_service):
        self.nlp_service = nlp_service

    def start(self, note_title):
        self.nlp_service.recording = True
        self.nlp_service.recording_note_title = note_title
        self.nlp_service.accumulated_description = []
        return f"Starting description accumulation for '{note_title}'. Send your description lines. Say 'stop recording' to finish."

    def accumulate(self, message):
        self.nlp_service.accumulated_description.append(message)
        return "Description line added. Continue or say 'stop recording'."

    def stop(self):
        note_title = self.nlp_service.recording_note_title
        note = next((n for n in self.nlp_service.notes if n["title"] == note_title), None)
        if note:
            note["description"] = "\n".join(self.nlp_service.accumulated_description)
            self.nlp_service.recording = False
            self.nlp_service.recording_note_title = None
            self.nlp_service.accumulated_description = []
            return f"Stopped recording. Updated '{note_title}' description."
        else:
            self.nlp_service.recording = False
            self.nlp_service.recording_note_title = None
            self.nlp_service.accumulated_description = []
            return f"Note '{note_title}' not found." 