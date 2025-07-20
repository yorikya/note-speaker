class DeleteNoteTool:
    def __init__(self, notes):
        self.notes = notes

    def run(self, title: str):
        for i, note in enumerate(self.notes):
            if note["title"] == title:
                del self.notes[i]
                return f'Note "{title}" was deleted.'
        return f'Note "{title}" not found.' 