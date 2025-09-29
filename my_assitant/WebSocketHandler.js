// WebSocketHandler.js - WebSocket Communication Module
// Handles all WebSocket server operations, message routing, and client communication

var WebSocketHandler = {
    // -------- WebSocket Server Configuration --------
    server: null,
    webView: null,
    port: 8080,
    
    // -------- Server Initialization --------
    initializeServer: function() {
        // Create and start the web server to serve HTML and handle WebSocket
        this.server = app.CreateWebServer(this.port);
        this.server.SetFolder(app.GetAppPath());
        this.server.SetOnReceive(this.onWsReceive.bind(this));
        this.server.Start();
        
        // Create WebView to display the HTML content directly
        this.webView = app.CreateWebView(1.0, 1.0, "FillXY");
        this.webView.LoadHtml(HTML_CONTENT);
        app.AddLayout(this.webView);
        
        console.log("WebSocket server started on port " + this.port);
    },
    
    // -------- Message Broadcasting --------
    broadcast: function(obj) {
        var msg = (typeof obj === "string") ? obj : JSON.stringify(obj);
        this.server.SendText(msg); // no ip/id → broadcast to all clients
    },
    
    sendToClient: function(obj, ip, id) {
        var msg = (typeof obj === "string") ? obj : JSON.stringify(obj);
        this.server.SendText(msg, ip, id);
    },
    
    // -------- Message Handling --------
    onWsReceive: function(msg, ip, id) {
        // Handle empty or null messages
        if (!msg || msg.trim() === "") {
            this.sendToClient({ type: "reply", text: "Empty message received" }, ip, id);
            return;
        }
        
        // Expect JSON: {type:'chat', text:'...', lang:'en'|'he'}
        try {
            var o = JSON.parse(msg);
            
            // Validate required fields
            if (!o.type) {
                this.sendToClient({ type: "reply", text: "Missing message type" }, ip, id);
                return;
            }
            
            // Route message based on type
            this.routeMessage(o, ip, id);
            
        } catch (e) {
            // Better error handling - log the problematic message
            console.log("JSON Parse Error - Received message: " + msg);
            console.log("Error: " + e.message);
            this.sendToClient({ type: "reply", text: "Bad JSON: " + e.message }, ip, id);
        }
    },
    
    // -------- Message Routing --------
    routeMessage: function(o, ip, id) {
        switch (o.type) {
            case "chat":
                this.handleChatMessage(o, ip, id);
                break;
            case "debug":
                this.handleDebugMessage(o, ip, id);
                break;
            case "story_update":
                this.handleStoryUpdate(o, ip, id);
                break;
            case "save_settings":
                this.handleSaveSettings(o, ip, id);
                break;
            case "get_commands":
                this.handleGetCommands(o, ip, id);
                break;
            default:
                this.sendToClient({ type: "reply", text: "Unknown message type: " + o.type }, ip, id);
        }
    },
    
    // -------- Chat Message Handling --------
    handleChatMessage: function(o, ip, id) {
        // Validate chat message
        if (!o.text) {
            this.sendToClient({ type: "reply", text: "Missing text in chat message" }, ip, id);
            return;
        }
        
        Settings.lang = (o.lang === "he") ? "he" : "en";
        
        // Check for yes/no responses to create_note confirmation
        // But skip this check if we're waiting for a sub-note name
        if (!StateManager.getPendingSubNoteCreation()) {
            var response = this.handleConfirmationResponse(o.text);
            if (response) {
                console.log("DEBUG: handleConfirmationResponse returned:", response);
                this.sendToClient({ type: "reply", text: response }, ip, id);
                return;
            }
        } else {
            console.log("DEBUG: Skipping handleConfirmationResponse because waiting for sub-note name");
        }
        
        console.log("DEBUG: onWsReceive - calling detectIntent with text='" + o.text + "'");
        var det = CommandRouter.detectIntent(o.text, Settings);
        console.log("DEBUG: onWsReceive - detectIntent returned:", JSON.stringify(det));
        var out = this.formatOutcome(det);
        console.log("DEBUG: onWsReceive - formatOutcome returned:", typeof out === 'string' ? out : JSON.stringify(out));
        
        // Note: No general chat history - AI conversations are note-specific
        
        // Send regular response (no more graph data)
        console.log("DEBUG: Sending regular response");
        this.sendToClient({ type: "reply", text: out }, ip, id);
    },
    
    // -------- Debug Message Handling --------
    handleDebugMessage: function(o, ip, id) {
        switch (o.action) {
            case "get_notes":
                var notesJson = JSON.stringify(NoteManager.getNotesData(), null, 2);
                this.sendToClient({ type: "debug_notes", notes: notesJson }, ip, id);
                break;
            case "clear_notes":
                // Clear all notes
                NoteManager.clearAllNotes();
                this.sendToClient({ type: "debug_cleared" }, ip, id);
                break;
            default:
                this.sendToClient({ type: "reply", text: "Unknown debug action: " + o.action }, ip, id);
        }
    },
    
    // -------- Story Update Handling --------
    handleStoryUpdate: function(o, ip, id) {
        if (o.noteId && o.description) {
            var updatedNote = NoteManager.updateNoteDescription(o.noteId, o.description);
            if (updatedNote) {
                var isHebrew = (Settings.lang === "he");
                var message = isHebrew ? 
                    "תיאור הסיפור '" + updatedNote.title + "' עודכן בהצלחה!" :
                    "Story description for '" + updatedNote.title + "' updated successfully!";
                this.sendToClient({ type: "reply", text: message }, ip, id);
            } else {
                this.sendToClient({ type: "reply", text: "Failed to update story description" }, ip, id);
            }
        } else {
            this.sendToClient({ type: "reply", text: "Missing noteId or description" }, ip, id);
        }
    },
    
    // -------- Settings Handling --------
    handleSaveSettings: function(o, ip, id) {
        try {
            var settings = {
                geminiApiKey: o.geminiApiKey || "AIzaSyC9dXJT4ol3i2VoK6aqLjX5S7IMKSjwNC4"
            };
            app.WriteFile("settings.json", JSON.stringify(settings, null, 2));
            this.sendToClient({ type: "reply", text: "Settings saved successfully!" }, ip, id);
        } catch (error) {
            this.sendToClient({ type: "reply", text: "Error saving settings: " + error.message }, ip, id);
        }
    },
    
    // -------- Commands Handling --------
    handleGetCommands: function(o, ip, id) {
        try {
            var commands = this.getAvailableCommands();
            this.sendToClient({ type: "available_commands", commands: commands }, ip, id);
        } catch (error) {
            this.sendToClient({ type: "reply", text: "Error getting commands: " + error.message }, ip, id);
        }
    },
    
    // -------- Confirmation Response Handling --------
    handleConfirmationResponse: function(text) {
        var isHebrew = (Settings.lang === "he");
        var lowerText = text.toLowerCase().trim();
        
        console.log("DEBUG: handleConfirmationResponse called with text:", text);
        console.log("DEBUG: lowerText:", lowerText);
        
        // Check for yes responses
        var yesPatterns = isHebrew ? 
            [/\b(כן|כן כן|כן בבקשה|כן אני רוצה|כן תודה)\b/] :
            [/\b(yes|yeah|yep|yup|sure|ok|okay|please|do it)\b/];
        
        // Check for no responses  
        var noPatterns = isHebrew ?
            [/\b(לא|לא תודה|לא רוצה|לא עכשיו|בטל|ביטול)\b/] :
            [/\b(no|nope|nah|cancel|don't|don't want)\b/, /\bstop\b(?!\s+(editing|recording|writing))/];
        
        for (var pattern of yesPatterns) {
            if (pattern.test(lowerText)) {
                // Check if we have a pending note creation
                var pendingNote = StateManager.getPendingNoteCreation();
                if (pendingNote) {
                    var note = NoteManager.createNote(pendingNote.title, "", pendingNote.parentId);
                    StateManager.clearPendingNoteCreation();
                    StateManager.clearCurrentFindContext(); // Clear find context after action
                    if (isHebrew) {
                        return "פתק נוצר בהצלחה! ID: " + note.id + ", כותרת: '" + note.title + "'";
                    }
                    return "Note created successfully! ID: " + note.id + ", Title: '" + note.title + "'";
                }
                
                // Check if we have a pending story creation
                var pendingStory = StateManager.getPendingStoryCreation();
                if (pendingStory) {
                    // Create the story note with empty description initially
                    var note = NoteManager.createNote(pendingStory.title, "", null);
                    StateManager.clearPendingStoryCreation();
                    
                    // Start story editing mode
                    StateManager.setStoryEditingMode(note.id, note.title);
                    
                    if (isHebrew) {
                        return "סיפור נוצר! ID: " + note.id + ", כותרת: '" + note.title + "'. כדי להתחיל לערוך את תיאור הסיפור, לחץ על כפתור ההקלטה או הקלד הודעה בצ'אט. לסיום אמור 'עצור עריכת תיאור'.";
                    }
                    return "Story created! ID: " + note.id + ", Title: '" + note.title + "'. To start editing the story description, please click the record button or type a message in the chat. To finish, say 'stop editing description'.";
                }
                
                // Check if we have a pending story update
                var pendingUpdate = StateManager.getPendingStoryUpdate();
                if (pendingUpdate) {
                    var updatedNote = NoteManager.updateNoteDescription(pendingUpdate.noteId, pendingUpdate.description);
                    StateManager.clearPendingStoryUpdate();
                    if (updatedNote) {
                        if (isHebrew) {
                            return "תיאור הסיפור '" + updatedNote.title + "' עודכן בהצלחה!";
                        }
                        return "Story description for '" + updatedNote.title + "' updated successfully!";
                    } else {
                        if (isHebrew) {
                            return "שגיאה בעדכון תיאור הסיפור.";
                        }
                        return "Error updating story description.";
                    }
                }
                
                // Check if we have a pending note deletion
                var pendingDeletion = StateManager.getPendingNoteDeletion();
                if (pendingDeletion) {
                    var deletedNote = NoteManager.deleteNote(pendingDeletion);
                    StateManager.clearPendingNoteDeletion();
                    StateManager.clearCurrentFindContext(); // Clear find context after action
                    if (isHebrew) {
                        return "הפתק '" + deletedNote.title + "' נמחק בהצלחה!";
                    }
                    return "Note '" + deletedNote.title + "' deleted successfully!";
                }
                
                // Check if we have a pending note mark done
                var pendingMarkDone = StateManager.getPendingNoteMarkDone();
                if (pendingMarkDone) {
                    var markedNote = NoteManager.markNoteAsDone(pendingMarkDone);
                    StateManager.clearPendingNoteMarkDone();
                    StateManager.clearCurrentFindContext(); // Clear find context after action
                    if (isHebrew) {
                        return "הפתק '" + markedNote.title + "' סומן כהושלם בהצלחה!";
                    }
                    return "Note '" + markedNote.title + "' marked as done successfully!";
                }
            }
        }
        
        for (var pattern of noPatterns) {
            if (pattern.test(lowerText)) {
                console.log("DEBUG: No pattern matched:", pattern);
                // User declined - cancel any pending actions
                var pendingNote = StateManager.getPendingNoteCreation();
                var pendingDeletion = StateManager.getPendingNoteDeletion();
                var pendingMarkDone = StateManager.getPendingNoteMarkDone();
                var pendingSubNote = StateManager.getPendingSubNoteCreation();
                
                console.log("DEBUG: Pending states - Note:", pendingNote, "Deletion:", pendingDeletion, "MarkDone:", pendingMarkDone, "SubNote:", pendingSubNote);
                
                if (pendingNote) {
                    StateManager.clearPendingNoteCreation();
                    if (isHebrew) {
                        return "יצירת הפתק בוטלה.";
                    }
                    return "Note creation cancelled.";
                }
                
                if (pendingDeletion) {
                    StateManager.clearPendingNoteDeletion();
                    if (isHebrew) {
                        return "מחיקת הפתק בוטלה.";
                    }
                    return "Note deletion cancelled.";
                }
                
                if (pendingMarkDone) {
                    StateManager.clearPendingNoteMarkDone();
                    if (isHebrew) {
                        return "סימון הפתק כהושלם בוטל.";
                    }
                    return "Note mark done cancelled.";
                }
                
                if (pendingSubNote) {
                    console.log("DEBUG: Cancelling sub-note creation");
                    StateManager.clearPendingSubNoteCreation();
                    StateManager.clearCurrentFindContext();
                    if (isHebrew) {
                        return "יצירת התת-פתק בוטלה.";
                    }
                    return "Sub-note creation cancelled.";
                }
                
                // Check for pending story update
                var pendingUpdate = StateManager.getPendingStoryUpdate();
                if (pendingUpdate) {
                    StateManager.clearPendingStoryUpdate();
                    if (isHebrew) {
                        return "עדכון תיאור הסיפור בוטל.";
                    }
                    return "Story description update cancelled.";
                }
            }
        }
        
        return null; // No confirmation response detected
    },
    
    // -------- Command Generation --------
    getAvailableCommands: function() {
        var lang = Settings.lang || "en";
        var patterns = CommandRouter.getPatterns(lang);
        var commands = [];
        
        // Define command metadata
        var commandMetadata = {
            slash_create_note: { 
                category: "📝 Create", 
                description: "Create a new note",
                examples: ["/createnote groceries", "/createnote my task"],
                requiresParam: true
            },
            slash_create_story: { 
                category: "📝 Create", 
                description: "Create a long story",
                examples: ["/createstory my story", "/createstory daily journal"],
                requiresParam: true
            },
            slash_find_note: { 
                category: "🔍 Find", 
                description: "Search for notes",
                examples: ["/findnote shopping", "/findnote my tasks"],
                requiresParam: true
            },
            slash_find_by_id: { 
                category: "🔍 Find", 
                description: "Find note by ID",
                examples: ["/findbyid 5", "/findbyid 12"],
                requiresParam: true
            },
            slash_show_parents: { 
                category: "📋 Show", 
                description: "Show parent notes",
                examples: ["/showparents"],
                requiresParam: false
            },
            slash_help: { 
                category: "❓ Help", 
                description: "Show help",
                examples: ["/help"],
                requiresParam: false
            }
        };
        
        // Extract commands from patterns
        for (var action in patterns) {
            if (action.startsWith("slash_") && commandMetadata[action]) {
                var metadata = commandMetadata[action];
                var patterns_list = patterns[action];
                
                // Find the compact command format (prefer compact over shortest)
                var compactCommand = null;
                var shortestCommand = null;
                
                for (var i = 0; i < patterns_list.length; i++) {
                    var pattern = patterns_list[i];
                    var patternStr = pattern.toString();
                    
                    // Extract command from regex pattern - handle different regex formats
                    var match = patternStr.match(/^\/(.+?)(?:\$|\s|\\s)/);
                    if (match) {
                        var cmd = "/" + match[1];
                        
                        // Clean up any regex escape sequences
                        cmd = cmd.replace(/\\\//g, '/');  // Remove escaped slashes
                        cmd = cmd.replace(/\\\^/g, '');    // Remove escaped carets
                        cmd = cmd.replace(/\\\$/g, '');    // Remove escaped dollar signs
                        cmd = cmd.replace(/\\s/g, '');     // Remove escaped spaces
                        cmd = cmd.replace(/\\+/g, '');     // Remove escaped plus signs
                        cmd = cmd.replace(/\\d/g, '');      // Remove escaped digits
                        cmd = cmd.replace(/\\w/g, '');     // Remove escaped word chars
                        cmd = cmd.replace(/\\b/g, '');     // Remove escaped word boundaries
                        cmd = cmd.replace(/\\\(/g, '');    // Remove escaped parentheses
                        cmd = cmd.replace(/\\\)/g, '');    // Remove escaped parentheses
                        cmd = cmd.replace(/\\\[/g, '');    // Remove escaped brackets
                        cmd = cmd.replace(/\\\]/g, '');     // Remove escaped brackets
                        cmd = cmd.replace(/\\\?/g, '');     // Remove escaped question marks
                        cmd = cmd.replace(/\\\*/g, '');     // Remove escaped asterisks
                        cmd = cmd.replace(/\\\|/g, '');     // Remove escaped pipes
                        cmd = cmd.replace(/\\\./g, '');     // Remove escaped dots
                        cmd = cmd.replace(/\\\*/g, '');     // Remove escaped asterisks
                        
                        // Only keep commands that start with / and contain letters
                        if (cmd.match(/^\/[a-zA-Z]/)) {
                            // Prioritize compact commands (like /createnote, /findnote)
                            if (cmd.includes("note") || cmd.includes("story") || cmd.includes("parents") || cmd.includes("help")) {
                                if (!compactCommand) {
                                    compactCommand = cmd;
                                }
                            } else {
                                // Keep track of shortest for fallback
                                if (!shortestCommand || cmd.length < shortestCommand.length) {
                                    shortestCommand = cmd;
                                }
                            }
                        }
                    }
                }
                
                // Use compact command if available, otherwise use shortest
                var selectedCommand = compactCommand || shortestCommand;
                
                if (selectedCommand) {
                    commands.push({
                        action: action,
                        command: selectedCommand,
                        category: metadata.category,
                        description: metadata.description,
                        examples: metadata.examples,
                        requiresParam: metadata.requiresParam
                    });
                }
            }
        }
        
        return commands;
    },
    
    // -------- Format Outcome (moved from main.js) --------
    formatOutcome: function(r) {
        var isHebrew = (Settings.lang === "he");
        
        if (r.action === "unknown") {
            if (isHebrew) {
                return "לא הבנתי. נסה לומר: 'צור פתק על קניות' או 'מצא את הפתקים שלי'";
            }
            return "I didn't understand that. Try saying: 'create a note about groceries' or 'find my notes'";
        }
        
        if (r.action === "gemini_question") {
            var question = r.params?.question;
            if (question) {
                // Note: No chat history for general questions - keep it simple
                
                // Create prompt for Gemini
                var prompt = AIService.createGeneralQuestionPrompt(question);
                
                // Call Gemini API
                AIService.callGeminiForQuestion(prompt, function(response) {
                    if (response) {
                        // Send response to user
                        WebSocketHandler.broadcast({
                            type: "reply",
                            text: response
                        });
                    } else {
                        // Fallback response
                        var fallbackResponse = "I'm having trouble processing your question right now. Please try again or use one of the available commands.";
                        WebSocketHandler.broadcast({
                            type: "reply",
                            text: fallbackResponse
                        });
                    }
                });
                
                // Return immediate response
                if (isHebrew) {
                    return "🤖 שואל את Gemini...";
                }
                return "🤖 Asking Gemini...";
            }
            
            if (isHebrew) {
                return "לא הבנתי את השאלה שלך.";
            }
            return "I didn't understand your question.";
        }
        
        // Handle slash commands first
        if (r.action === "slash_create_note") {
            if (r.params?.hasParameter && r.params?.title) {
                // User provided title with command - create directly
                var title = r.params.title;
                StateManager.setPendingNoteCreation(title, null);
                if (isHebrew) {
                    return "האם תרצה ליצור פתק בשם '" + title + "'? (כן/לא)";
                }
                return "Do you want to create a note with title '" + title + "'? (yes/no)";
            } else {
                // No title provided - ask for it
                CommandRouter.setPendingCommandCompletion("create_note", "slash_create_note");
                if (isHebrew) {
                    return "מה השם של הפתק החדש?";
                }
                return "What should be the title of the new note?";
            }
        }
        
        if (r.action === "slash_create_story") {
            if (r.params?.hasParameter && r.params?.title) {
                // User provided title with command - create directly
                var title = r.params.title;
                StateManager.setPendingStoryCreation(title);
                if (isHebrew) {
                    return "האם תרצה ליצור סיפור בשם '" + title + "'? (כן/לא)";
                }
                return "Do you want to create a story called '" + title + "'? (yes/no)";
            } else {
                // No title provided - ask for it
                CommandRouter.setPendingCommandCompletion("create_story", "slash_create_story");
                if (isHebrew) {
                    return "מה השם של הסיפור החדש?";
                }
                return "What should be the title of the new story?";
            }
        }
        
        if (r.action === "slash_find_note") {
            if (r.params?.hasParameter && r.params?.query) {
                // User provided query with command - search directly
                var query = r.params.query;
                var foundNotes = NoteManager.findNotesByTitle(query);
                
                if (foundNotes.length === 0) {
                    if (isHebrew) {
                        return "לא נמצאו פתקים עבור '" + query + "'";
                    }
                    return "No notes found for '" + query + "'";
                }
                
                // Set the found notes in context for sub-commands
                StateManager.setCurrentFindContext(foundNotes);
                
                if (foundNotes.length === 1) {
                    var note = foundNotes[0].note || foundNotes[0];
                    // Find children of this note
                    var children = NoteManager.findNoteChildren(note.id);
                    // Create simple text tree representation
                    var treeText = NoteManager.createNoteTree(note, children);
                    
                    if (isHebrew) {
                        return "נמצא פתק אחד: '" + note.title + "' (ID: " + note.id + ").\n\n" + treeText + "\n\nמה תרצה לעשות? (/edit /delete /createsub /markdone /talkai)";
                    }
                    return "Found 1 note: '" + note.title + "' (ID: " + note.id + ").\n\n" + treeText + "\n\nWhat would you like to do? (/edit /delete /createsub /markdone /talkai)";
                } else {
                    var noteList = "";
                    for (var i = 0; i < Math.min(foundNotes.length, 5); i++) {
                        var note = foundNotes[i].note || foundNotes[i];
                        var statusIcon = note.done ? "✅" : "➡️";
                        noteList += (i + 1) + ". " + statusIcon + " '" + note.title + "' (ID: " + note.id + ")\n";
                    }
                    if (isHebrew) {
                        return "נמצאו " + foundNotes.length + " פתקים:\n" + noteList + "\nאיזה פתק תרצה לבחור? (אמור את המספר או השם)";
                    }
                    return "Found " + foundNotes.length + " notes:\n" + noteList + "\nWhich note would you like to select? (say the number or name)";
                }
            } else {
                // No query provided - ask for it
                CommandRouter.setPendingCommandCompletion("find_note", "slash_find_note");
                if (isHebrew) {
                    return "מה השם של הפתק שאתה מחפש?";
                }
                return "What is the name of the note you're looking for?";
            }
        }
        
        if (r.action === "slash_find_by_id") {
            if (r.params?.hasParameter && r.params?.query) {
                // User provided ID with command - search directly
                var query = r.params.query;
                var foundNotes = NoteManager.findNotesById(query);
                
                if (foundNotes.length === 0) {
                    if (isHebrew) {
                        return "לא נמצא פתק עם מזהה '" + query + "'";
                    }
                    return "No note found with ID '" + query + "'";
                }
                
                // Set the found notes in context for sub-commands
                StateManager.setCurrentFindContext(foundNotes);
                
                var note = foundNotes[0];
                // Find children of this note
                var children = NoteManager.findNoteChildren(note.id);
                // Create simple text tree representation
                var treeText = NoteManager.createNoteTree(note, children);
                
                if (isHebrew) {
                    return "נמצא פתק: '" + note.title + "' (ID: " + note.id + ").\n\n" + treeText + "\n\nמה תרצה לעשות? (/edit /delete /createsub /markdone /talkai)";
                }
                return "Found note: '" + note.title + "' (ID: " + note.id + ").\n\n" + treeText + "\n\nWhat would you like to do? (/edit /delete /createsub /markdone /talkai)";
            } else {
                // No ID provided - ask for it
                CommandRouter.setPendingCommandCompletion("find_by_id", "slash_find_by_id");
                if (isHebrew) {
                    return "מה המזהה של הפתק שאתה מחפש?";
                }
                return "What is the ID of the note you're looking for?";
            }
        }
        
        if (r.action === "slash_show_parents") {
            // Get all notes that don't have a parent (parent_id is null)
            var parentNotes = [];
            var allNotes = NoteManager.getAllNotes();
            for (var i = 0; i < allNotes.length; i++) {
                var note = allNotes[i];
                if (!note.deleted && !note.parent_id) {
                    parentNotes.push(note);
                }
            }
            
            if (parentNotes.length === 0) {
                if (isHebrew) {
                    return "לא נמצאו פתקים ראשיים.";
                }
                return "No parent notes found.";
            }
            
            // Sort by creation date (newest first)
            parentNotes.sort(function(a, b) {
                return new Date(b.creation_date) - new Date(a.creation_date);
            });
            
            var noteList = "";
            for (var j = 0; j < parentNotes.length; j++) {
                var note = parentNotes[j];
                var statusIcon = note.done ? "✅" : "➡️";
                var children = NoteManager.findNoteChildren(note.id);
                var childrenCount = children.length;
                
                noteList += (j + 1) + ". " + statusIcon + " '" + note.title + "' (ID: " + note.id + ")";
                if (childrenCount > 0) {
                    noteList += " [" + childrenCount + " sub-note" + (childrenCount > 1 ? "s" : "") + "]";
                }
                noteList += "\n";
            }
            
            if (isHebrew) {
                return "נמצאו " + parentNotes.length + " פתקים ראשיים:\n\n" + noteList + "\nלעבודה עם פתק ספציפי, השתמש ב-`/findnote [שם]` או `/findbyid [מספר]`.";
            }
            return "Found " + parentNotes.length + " parent notes:\n\n" + noteList + "\nTo work with a specific note, use `/findnote [name]` or `/findbyid [number]`.";
        }
        
        if (r.action === "slash_help") {
            if (isHebrew) {
                return "🆘 **פקודות זמינות:**\n\n" +
                       "📝 **פקודות יצירה:**\n" +
                       "• `/createnote [שם]` - צור פתק חדש\n" +
                       "• `/createstory [שם]` - צור סיפור ארוך\n\n" +
                       "🔍 **פקודות חיפוש:**\n" +
                       "• `/findnote [שם]` - חפש פתקים\n" +
                       "• `/findbyid [מספר]` - חפש לפי מזהה\n\n" +
                       "📋 **פקודות הצגה:**\n" +
                       "• `/showparents` - הצג פתקים ראשיים\n\n" +
                       "💡 **דוגמאות מהירות:**\n" +
                       "• `/createnote רשימת קניות`\n" +
                       "• `/findnote מוצרים`\n" +
                       "• `/findbyid 5`\n" +
                       "• `/showparents`\n\n" +
                       "ℹ️ **הערה:** כל פורמטי הפקודות נתמכים:\n" +
                       "• Snake case: `/create_note`, `/find_note`, `/find_by_id`\n" +
                       "• Kebab case: `/create-note`, `/find-note`, `/find-by-id`\n" +
                       "• Camel case: `/createNote`, `/findNote`, `/findById`\n" +
                       "• הקצר ביותר: `/create`, `/find`, `/id`, `/parents`";
            }
            return "🆘 **Available Commands:**\n\n" +
                   "📝 **Create Commands:**\n" +
                   "• `/createnote [title]` - Create a new note\n" +
                   "• `/createstory [title]` - Create a long story\n\n" +
                   "🔍 **Find Commands:**\n" +
                   "• `/findnote [title]` - Search for notes\n" +
                   "• `/findbyid [number]` - Find by ID\n\n" +
                   "📋 **Show Commands:**\n" +
                   "• `/showparents` - Show parent notes\n\n" +
                   "💡 **Quick Examples:**\n" +
                   "• `/createnote shopping list`\n" +
                   "• `/findnote groceries`\n" +
                   "• `/findbyid 5`\n" +
                   "• `/showparents`\n\n" +
                   "ℹ️ **Note:** All command formats are supported:\n" +
                   "• Snake case: `/create_note`, `/find_note`, `/find_by_id`\n" +
                   "• Kebab case: `/create-note`, `/find-note`, `/find-by-id`\n" +
                   "• Camel case: `/createNote`, `/findNote`, `/findById`\n" +
                   "• Shortest: `/create`, `/find`, `/id`, `/parents`";
        }
        
        // Handle story content during editing mode
        if (r.action === "story_content") {
            var content = r.params?.content;
            if (content) {
                StateManager.addToStoryEditing(content);
                if (isHebrew) {
                    return "✅ הוספתי לתיאור הסיפור. המשך לכתוב או אמור 'עצור עריכת תיאור' לסיום.";
                }
                return "✅ Added to story description. Continue writing or say 'stop editing description' to finish.";
            }
            return "";
        }
        
        // Handle stop editing description
        if (r.action === "stop_editing_description") {
            var editingMode = StateManager.getStoryEditingMode();
            if (editingMode) {
                var accumulatedText = StateManager.getAccumulatedStoryText();
                if (accumulatedText.trim()) {
                    // Set pending story update for confirmation
                    StateManager.setPendingStoryUpdate(editingMode.noteId, accumulatedText);
                    StateManager.clearStoryEditingMode();
                    
                    if (isHebrew) {
                        return "האם תרצה לעדכן את התיאור של '" + editingMode.noteTitle + "' עם: '" + accumulatedText + "'? (כן/לא)";
                    }
                    return "Do you want to update the description for '" + editingMode.noteTitle + "' with: '" + accumulatedText + "'? (yes/no)";
                } else {
                    StateManager.clearStoryEditingMode();
                    if (isHebrew) {
                        return "לא נוסף תוכן לתיאור הסיפור.";
                    }
                    return "No content was added to the story description.";
                }
            }
            if (isHebrew) {
                return "לא נמצא מצב עריכת סיפור פעיל.";
            }
            return "No active story editing mode found.";
        }
        
        // Handle note selection from multiple results
        if (r.action === "note_selection") {
            console.log("DEBUG: formatOutcome - note_selection action detected");
            console.log("DEBUG: formatOutcome - r.params:", JSON.stringify(r.params));
            
            var context = StateManager.getCurrentFindContext();
            console.log("DEBUG: formatOutcome - currentFindContext:", JSON.stringify(context));
            
            if (!context || context.length === 0) {
                console.log("DEBUG: formatOutcome - no context found");
                if (isHebrew) {
                    return "לא נמצאו פתקים לבחירה. נסה לחפש קודם.";
                }
                return "No notes found to select. Try searching first.";
            }
            
            var selectionType = r.params?.selectionType;
            var value = r.params?.value;
            console.log("DEBUG: formatOutcome - selectionType='" + selectionType + "', value='" + value + "'");
            var selectedNote = null;
            
            if (selectionType === "id") {
                // Find by ID
                for (var i = 0; i < context.length; i++) {
                    var note = context[i].note || context[i];
                    if (note.id === value) {
                        selectedNote = note;
                        break;
                    }
                }
            } else if (selectionType === "title") {
                // Find by exact title match
                for (var i = 0; i < context.length; i++) {
                    var note = context[i].note || context[i];
                    if (note.title.toLowerCase() === value.toLowerCase()) {
                        selectedNote = note;
                        break;
                    }
                }
            }
            
            if (!selectedNote) {
                if (isHebrew) {
                    return "לא נמצא פתק תואם. נסה שוב עם מזהה או שם מדויק.";
                }
                return "No matching note found. Try again with ID or exact title.";
            }
            
            // Update context with selected note
            StateManager.setCurrentFindContext([selectedNote]);
            
            // Find children of the selected note
            var children = NoteManager.findNoteChildren(selectedNote.id);
            console.log("DEBUG: Selected note children:", JSON.stringify(children));
            
            // Create simple text tree representation
            var treeText = NoteManager.createNoteTree(selectedNote, children);
            console.log("DEBUG: Created tree text:", treeText);
            
            if (isHebrew) {
                return "נבחר הפתק: '" + selectedNote.title + "' (ID: " + selectedNote.id + ").\n\n" + treeText + "\n\nמה תרצה לעשות? (/edit /delete /createsub /markdone /talkai)";
            }
            return "Selected note: '" + selectedNote.title + "' (ID: " + selectedNote.id + ").\n\n" + treeText + "\n\nWhat would you like to do? (/edit /delete /createsub /markdone /talkai)";
        }
        
        // Handle sub-commands
        if (r.action === "find_sub_create") {
            var context = StateManager.getCurrentFindContext();
            if (!context || context.length === 0) {
                if (isHebrew) {
                    return "לא נמצאו פתקים לעבודה. נסה לחפש קודם.";
                }
                return "No notes found to work with. Try searching first.";
            }
            
            var note = context[0].note || context[0];
            // Set pending sub-note creation
            StateManager.setPendingSubNoteCreation(note.id);
            if (isHebrew) {
                return "אצור תת-פתק תחת '" + note.title + "'. מה השם של התת-פתק?";
            }
            return "I'll create a sub-note under '" + note.title + "'. What should be the name of the sub-note?";
        }
        
        if (r.action === "find_sub_edit_description") {
            var context = StateManager.getCurrentFindContext();
            if (!context || context.length === 0) {
                if (isHebrew) {
                    return "לא נמצאו פתקים לעריכה. נסה לחפש קודם.";
                }
                return "No notes found to edit. Try searching first.";
            }
            
            var note = context[0].note || context[0];
            
            // Start story editing mode for the note
            StateManager.setStoryEditingMode(note.id, note.title);
            StateManager.clearCurrentFindContext();
            
            if (isHebrew) {
                return "אתחיל מצב עריכת תיאור עבור '" + note.title + "'. הקלד או הקלט את התוכן החדש. לסיום אמור 'עצור עריכת תיאור'.";
            }
            return "I'll start description editing mode for '" + note.title + "'. Type or record the new content. To finish, say 'stop editing description'.";
        }
        
        if (r.action === "find_sub_delete") {
            var context = StateManager.getCurrentFindContext();
            if (!context || context.length === 0) {
                if (isHebrew) {
                    return "לא נמצאו פתקים למחיקה. נסה לחפש קודם.";
                }
                return "No notes found to delete. Try searching first.";
            }
            
            var note = context[0].note || context[0];
            // Set pending deletion for confirmation
            StateManager.setPendingNoteDeletion(note.id);
            if (isHebrew) {
                return "האם תרצה למחוק את הפתק '" + note.title + "'? (כן/לא)";
            }
            return "Do you want to delete the note '" + note.title + "'? (yes/no)";
        }
        
        if (r.action === "find_sub_mark_done") {
            var context = StateManager.getCurrentFindContext();
            if (!context || context.length === 0) {
                if (isHebrew) {
                    return "לא נמצאו פתקים לסימון. נסה לחפש קודם.";
                }
                return "No notes found to mark. Try searching first.";
            }
            
            var note = context[0].note || context[0];
            
            // Check if note has children and if they are all completed
            var children = NoteManager.findNoteChildren(note.id);
            if (children.length > 0 && !NoteManager.areAllChildrenCompleted(note.id)) {
                var incompleteChildren = NoteManager.getIncompleteChildren(note.id);
                var incompleteList = "";
                for (var i = 0; i < incompleteChildren.length; i++) {
                    incompleteList += (i + 1) + ". " + incompleteChildren[i].title + " (ID: " + incompleteChildren[i].id + ")\n";
                }
                
                if (isHebrew) {
                    return "לא ניתן לסמן את הפתק '" + note.title + "' כהושלם כי יש תת-פתקים שלא הושלמו:\n" + incompleteList + "\nאנא השלם את התת-פתקים קודם.";
                }
                return "Cannot mark note '" + note.title + "' as done because it has incomplete sub-notes:\n" + incompleteList + "\nPlease complete the sub-notes first.";
            }
            
            // Set pending mark done for confirmation
            StateManager.setPendingNoteMarkDone(note.id);
            if (isHebrew) {
                return "האם תרצה לסמן את הפתק '" + note.title + "' כהושלם? (כן/לא)";
            }
            return "Do you want to mark the note '" + note.title + "' as done? (yes/no)";
        }
        
        if (r.action === "find_sub_talk_ai") {
            var context = StateManager.getCurrentFindContext();
            if (!context || context.length === 0) {
                if (isHebrew) {
                    return "לא נמצאו פתקים לשיחה. נסה לחפש קודם.";
                }
                return "No notes found to discuss. Try searching first.";
            }
            
            var note = context[0].note || context[0];
            
            // Start AI conversation mode with this note
            StateManager.setAiConversationMode(note);
            StateManager.clearCurrentFindContext();
            
            if (isHebrew) {
                return "🤖 התחלתי שיחה עם AI על הפתק '" + note.title + "'. אמור 'cancel' לסיום השיחה.";
            }
            return "🤖 Started AI conversation about note '" + note.title + "'. Say 'cancel' to end the conversation.";
        }
        
        // Handle cancel/abort action in find mode
        if (r.action === "cancel_action") {
            StateManager.clearCurrentFindContext();
            if (isHebrew) {
                return "פעולה בוטלה.";
            }
            return "Action cancelled.";
        }
        
        // Handle AI conversation mode
        if (r.action === "ai_conversation") {
            var message = r.params?.message;
            if (message) {
                // Get the current note context
                var note = StateManager.getAiConversationNote();
                var noteContext = "";
                if (note) {
                    noteContext = "Current note context:\n" +
                                 "Title: " + note.title + "\n" +
                                 "Description: " + (note.description || "No description") + "\n" +
                                 "Status: " + (note.done ? "Completed" : "Pending") + "\n\n";
                }
                
                // Use AIService to generate context-aware response
                var response = AIService.generateNoteContextResponse(message, note);
                
                return response;
            }
            
            if (isHebrew) {
                return "לא הבנתי את ההודעה שלך.";
            }
            return "I didn't understand your message.";
        }
        
        // Find sub-commands as slash commands
        if (r.action === "slash_edit") {
            return this.formatOutcome({action: "find_sub_edit_description", params: r.params, confidence: 1});
        }
        if (r.action === "slash_markdone") {
            return this.formatOutcome({action: "find_sub_mark_done", params: r.params, confidence: 1});
        }
        if (r.action === "slash_delete") {
            return this.formatOutcome({action: "find_sub_delete", params: r.params, confidence: 1});
        }
        if (r.action === "slash_createsub") {
            return this.formatOutcome({action: "find_sub_create", params: r.params, confidence: 1});
        }
        if (r.action === "slash_talkai") {
            return this.formatOutcome({action: "find_sub_talk_ai", params: r.params, confidence: 1});
        }
        
        // Handle cancel AI conversation
        if (r.action === "cancel_ai_conversation") {
            StateManager.clearAiConversationMode();
            StateManager.clearCurrentFindContext();
            if (isHebrew) {
                return "שיחה עם AI בוטלה. חזרת למצב הראשי.";
            }
            return "AI conversation cancelled. Back to main mode.";
        }
        
        // Handle sub-note name collection
        if (r.action === "sub_note_name") {
            var pendingSubNote = StateManager.getPendingSubNoteCreation();
            if (!pendingSubNote) {
                if (isHebrew) {
                    return "לא נמצאה פעולת יצירת תת-פתק ממתינה.";
                }
                return "No pending sub-note creation found.";
            }
            
            var subNoteName = r.params?.name || "untitled";
            // Set pending note creation for confirmation
            StateManager.setPendingNoteCreation(subNoteName, pendingSubNote.parentNoteId);
            StateManager.clearPendingSubNoteCreation();
            StateManager.clearCurrentFindContext();
            
            if (isHebrew) {
                return "האם תרצה ליצור תת-פתק בשם '" + subNoteName + "'? (כן/לא)";
            }
            return "Do you want to create a sub-note with title '" + subNoteName + "'? (yes/no)";
        }
        
        if (isHebrew) {
            return "הבנתי את הבקשה שלך ואני מעבד אותה.";
        }
        return "I understood your request and I'm processing it.";
    },
    
    // -------- Utility Functions --------
    getServerInfo: function() {
        return {
            port: this.port,
            serverStatus: this.server ? "active" : "inactive",
            webViewStatus: this.webView ? "active" : "inactive"
        };
    }
};
