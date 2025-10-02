// NoteManager.js - Note CRUD Operations Module
// Handles all note creation, reading, updating, deleting, and searching operations

var NoteManager = {
    // -------- Note Storage Configuration --------
    notesFile: "notes.json",
    notesData: { notes: [], last_note_id: 0 },
    
    // -------- Note Storage Functions --------
    loadNotes: function() {
        try {
            var content = app.ReadFile(this.notesFile);
            this.notesData = JSON.parse(content);
        } catch(e) {
            // File doesn't exist, start with empty notes
            this.notesData = { notes: [], last_note_id: 0 };
            this.saveNotes();
        }
    },
    
    saveNotes: function() {
        app.WriteFile(this.notesFile, JSON.stringify(this.notesData, null, 2));
    },
    
    // -------- Note ID Management --------
    generateNoteId: function() {
        this.notesData.last_note_id++;
        return this.notesData.last_note_id.toString();
    },
    
    // -------- Note CRUD Operations --------
    createNote: function(title, description, parentId) {
        var note = {
            id: this.generateNoteId(),
            title: title,
            description: description || "",
            parent_id: parentId || null,
            done: false,
            done_date: null,
            creation_date: new Date().toISOString(),
            tags: [],
            images: [],
            deleted: false
        };
        
        this.notesData.notes.push(note);
        this.saveNotes();
        return note;
    },
    
    deleteNote: function(noteId) {
        for (var i = 0; i < this.notesData.notes.length; i++) {
            if (this.notesData.notes[i].id === noteId) {
                var note = this.notesData.notes[i];
                note.deleted = true;
                note.deletion_date = new Date().toISOString();
                this.saveNotes();
                return note;
            }
        }
        return null;
    },
    
    updateNoteDescription: function(noteId, newDescription) {
        for (var i = 0; i < this.notesData.notes.length; i++) {
            if (this.notesData.notes[i].id === noteId) {
                var note = this.notesData.notes[i];
                
                // Create date prefix in the format: [Sun Sep 28 09:45:05 IDT 2025]
                var now = new Date();
                var datePrefix = "[" + now.toString() + "] ";
                
                // If there's existing description, append the new one with date prefix
                if (note.description && note.description.trim()) {
                    note.description = note.description + "\n\n" + datePrefix + newDescription;
                } else {
                    // If no existing description, just add the new one with date prefix
                    note.description = datePrefix + newDescription;
                }
                
                note.last_updated = new Date().toISOString();
                this.saveNotes();
                return note;
            }
        }
        return null;
    },
    
    markNoteAsDone: function(noteId) {
        for (var i = 0; i < this.notesData.notes.length; i++) {
            if (this.notesData.notes[i].id === noteId) {
                var note = this.notesData.notes[i];
                note.done = true;
                note.done_date = new Date().toISOString();
                note.last_updated = new Date().toISOString();
                this.saveNotes();
                return note;
            }
        }
        return null;
    },
    
    // -------- Note Search Functions --------
    findNotesByTitle: function(query) {
        var results = [];
        var threshold = 0.6; // Minimum similarity threshold
        
        for (var i = 0; i < this.notesData.notes.length; i++) {
            var note = this.notesData.notes[i];
            if (note.deleted) continue;
            
            var similarity = this.calculateSimilarity(query.toLowerCase(), note.title.toLowerCase());
            if (similarity >= threshold) {
                results.push({
                    note: note,
                    similarity: similarity
                });
            }
        }
        
        // Sort by similarity (highest first)
        results.sort(function(a, b) {
            return b.similarity - a.similarity;
        });
        
        return results;
    },
    
    findNotesById: function(id) {
        for (var i = 0; i < this.notesData.notes.length; i++) {
            var note = this.notesData.notes[i];
            if (note.id === id && !note.deleted) {
                return [note];
            }
        }
        return [];
    },
    
    findNoteChildren: function(parentId) {
        var children = [];
        for (var i = 0; i < this.notesData.notes.length; i++) {
            var note = this.notesData.notes[i];
            if (note.parent_id === parentId && !note.deleted) {
                children.push(note);
            }
        }
        return children;
    },
    
    // -------- Note Utility Functions --------
    areAllChildrenCompleted: function(parentId) {
        var children = this.findNoteChildren(parentId);
        if (children.length === 0) {
            return true; // No children, so it's considered "all completed"
        }
        
        for (var i = 0; i < children.length; i++) {
            if (!children[i].done) {
                return false; // Found at least one incomplete child
            }
        }
        return true; // All children are completed
    },
    
    getIncompleteChildren: function(parentId) {
        var children = this.findNoteChildren(parentId);
        var incomplete = [];
        
        for (var i = 0; i < children.length; i++) {
            if (!children[i].done) {
                incomplete.push(children[i]);
            }
        }
        return incomplete;
    },
    
    createNoteTree: function(note, children) {
        // Add completion status icon
        var statusIcon = note.done ? "✅" : "➡️";
        var tree = statusIcon + " 📝 " + note.title + " (ID: " + note.id + ")";
        
        if (children && children.length > 0) {
            tree += "\n";
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                var isLast = (i === children.length - 1);
                var prefix = isLast ? "└── " : "├── ";
                var childStatusIcon = child.done ? "✅" : "➡️";
                tree += prefix + childStatusIcon + " 📄 " + child.title + " (ID: " + child.id + ")";
                
                // Add description if it exists
                if (child.description && child.description.trim()) {
                    var desc = child.description.trim();
                    
                    // Remove date prefix if it exists (format: [date] content)
                    var datePrefixMatch = desc.match(/^\[.*?\]\s*(.+)$/);
                    if (datePrefixMatch) {
                        desc = datePrefixMatch[1];
                    }
                    
                    // Allow up to 2 lines, truncate if longer
                    var lines = desc.split('\n');
                    if (lines.length > 2) {
                        desc = lines.slice(0, 2).join('\n') + '...';
                    } else if (desc.length > 100) {
                        // If single line is too long, truncate
                        desc = desc.substring(0, 97) + '...';
                    }
                    
                    tree += "\n" + (isLast ? "    " : "│   ") + "   💬 " + desc;
                }
                
                if (!isLast) {
                    tree += "\n";
                }
            }
        } else {
            tree += "\n└── (no sub-notes)";
        }
        
        return tree;
    },
    
    // -------- Similarity Calculation (for fuzzy search) --------
    calculateSimilarity: function(str1, str2) {
        // Simple Levenshtein distance-based similarity
        var longer = str1.length > str2.length ? str1 : str2;
        var shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        var distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    },
    
    levenshteinDistance: function(str1, str2) {
        var matrix = [];
        
        for (var i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (var j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (var i = 1; i <= str2.length; i++) {
            for (var j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    },
    
    // -------- Note Data Access --------
    getAllNotes: function() {
        return this.notesData.notes;
    },
    
    getNotesData: function() {
        return this.notesData;
    },
    
    
    getRecentNotes: function(hoursAgo) {
        var cutoffTime = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000));
        var recentNotes = [];
        
        for (var i = 0; i < this.notesData.notes.length; i++) {
            var note = this.notesData.notes[i];
            if (!note.deleted && note.creation_date) {
                var noteDate = new Date(note.creation_date);
                if (noteDate >= cutoffTime) {
                    recentNotes.push(note);
                }
            }
        }
        return recentNotes;
    },
    
    // -------- Image Management Functions --------
    addImageToNote: function(noteId, imagePath) {
        for (var i = 0; i < this.notesData.notes.length; i++) {
            if (this.notesData.notes[i].id === noteId) {
                var note = this.notesData.notes[i];
                if (!note.images) {
                    note.images = [];
                }
                // Check if image already exists
                if (note.images.indexOf(imagePath) === -1) {
                    note.images.push(imagePath);
                    note.last_updated = new Date().toISOString();
                    this.saveNotes();
                    return note;
                }
                return note; // Image already exists
            }
        }
        return null;
    },
    
    removeImageFromNote: function(noteId, imagePath) {
        for (var i = 0; i < this.notesData.notes.length; i++) {
            if (this.notesData.notes[i].id === noteId) {
                var note = this.notesData.notes[i];
                if (note.images) {
                    var index = note.images.indexOf(imagePath);
                    if (index > -1) {
                        note.images.splice(index, 1);
                        note.last_updated = new Date().toISOString();
                        this.saveNotes();
                        return note;
                    }
                }
                return note;
            }
        }
        return null;
    },
    
    getNoteImages: function(noteId) {
        for (var i = 0; i < this.notesData.notes.length; i++) {
            if (this.notesData.notes[i].id === noteId) {
                return this.notesData.notes[i].images || [];
            }
        }
        return [];
    },
    
    // -------- Debug and Utility Functions --------
    clearAllNotes: function() {
        this.notesData = { notes: [], last_note_id: 0 };
        this.saveNotes();
    }
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NoteManager;
}
