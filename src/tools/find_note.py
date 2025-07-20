from rapidfuzz import process

class FindNoteTool:
    def __init__(self, notes, vector_utils=None):
        self.notes = notes
        # vector_utils is ignored for rapidfuzz, but kept for compatibility

    def run(self, name: str):
        if not self.notes:
            print(f"[DEBUG] No notes to search.")
            return f"Note '{name}' not found."
        choices = [note["title"] for note in self.notes]
        print(f"[DEBUG] Searching for: '{name}' in choices: {choices}")
        if name in choices:
            print(f"[DEBUG] Exact match found: '{name}'")
            return f"Note found: {name}"
        # Get all matches above threshold
        matches = process.extract(name, choices, score_cutoff=80)
        print(f"[DEBUG] Fuzzy matches above threshold: {matches}")
        if matches:
            matched_titles = [match[0] for match in matches]
            return f"Notes found: {', '.join(matched_titles)}"
        print(f"[DEBUG] No suitable match found for: '{name}'")
        return f"Note '{name}' not found." 