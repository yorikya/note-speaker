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
            case "get_all_notes":
                this.handleGetAllNotes(o, ip, id);
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
        
        console.log("DEBUG: onWsReceive - calling detectIntent with text='" + o.text + "'");
        
        // Debug: Check pending states before detectIntent
        var pendingNote = StateManager.getPendingNoteCreation();
        var pendingDeletion = StateManager.getPendingNoteDeletion();
        var pendingMarkDone = StateManager.getPendingNoteMarkDone();
        var pendingSubNote = StateManager.getPendingSubNoteCreation();
        var pendingUpdate = StateManager.getPendingStoryUpdate();
        console.log("DEBUG: Pending states before detectIntent - Note:", pendingNote, "Deletion:", pendingDeletion, "MarkDone:", pendingMarkDone, "SubNote:", pendingSubNote, "Update:", pendingUpdate);
        
        var det = CommandRouter.detectIntent(o.text, Settings);
        console.log("DEBUG: onWsReceive - detectIntent returned:", JSON.stringify(det));
        
        // Handle slash commands that need to set state BEFORE formatOutcome
        if (det.action === "slash_createsub") {
            var context = StateManager.getCurrentFindContext();
            if (context && context.length > 0) {
                var note = context[0].note || context[0];
                StateManager.setPendingSubNoteCreation(note.id);
                console.log("DEBUG: Set pending sub-note creation for note ID:", note.id);
            }
        }
        
        // Handle other commands that set pending states
        console.log("DEBUG: Checking slash_createnote - action:", det.action, "hasParameter:", det.params?.hasParameter, "title:", det.params?.title);
        if (det.action === "slash_create_note" && det.params?.hasParameter && det.params?.title) {
            StateManager.setPendingNoteCreation(det.params.title, null);
            console.log("DEBUG: Set pending note creation for title:", det.params.title);
        }
        
        
        // Handle sub-commands that set pending states
        if (det.action === "find_sub_edit_description") {
            var context = StateManager.getCurrentFindContext();
            if (context && context.length > 0) {
                var note = context[0].note || context[0];
                StateManager.setStoryEditingMode(note.id, note.title);
                StateManager.clearCurrentFindContext();
                console.log("DEBUG: Set story editing mode for note ID:", note.id, "title:", note.title);
                console.log("DEBUG: Story editing mode after setting:", StateManager.getStoryEditingMode());
            }
        }
        
        if (det.action === "slash_editdescription") {
            var context = StateManager.getCurrentFindContext();
            if (context && context.length > 0) {
                var note = context[0].note || context[0];
                StateManager.setStoryEditingMode(note.id, note.title);
                // Don't clear context here - let formatOutcome handle it
                console.log("DEBUG: Set story editing mode for note ID:", note.id, "title:", note.title);
                console.log("DEBUG: Story editing mode after setting:", StateManager.getStoryEditingMode());
            }
        }
        
        if (det.action === "slash_talkai") {
            var context = StateManager.getCurrentFindContext();
            if (context && context.length > 0) {
                var note = context[0].note || context[0];
                StateManager.setAiConversationMode(note); // Pass the full note object
                // Don't clear context here - let formatOutcome handle it
                console.log("DEBUG: Set AI conversation mode for note ID:", note.id, "title:", note.title);
                console.log("DEBUG: AI conversation mode after setting:", StateManager.getAiConversationMode());
            }
        }
        
        if (det.action === "find_sub_delete") {
            var context = StateManager.getCurrentFindContext();
            if (context && context.length > 0) {
                var note = context[0].note || context[0];
                StateManager.setPendingNoteDeletion(note.id);
                console.log("DEBUG: Set pending note deletion for note ID:", note.id);
            }
        }
        
        if (det.action === "find_sub_mark_done") {
            var context = StateManager.getCurrentFindContext();
            if (context && context.length > 0) {
                var note = context[0].note || context[0];
                StateManager.setPendingNoteMarkDone(note.id);
                console.log("DEBUG: Set pending note mark done for note ID:", note.id);
            }
        }
        
        if (det.action === "slash_markdone") {
            var context = StateManager.getCurrentFindContext();
            if (context && context.length > 0) {
                var note = context[0].note || context[0];
                StateManager.setPendingNoteMarkDone(note.id);
                console.log("DEBUG: Set pending note mark done for note ID:", note.id);
            }
        }
        
        if (det.action === "find_sub_talk_ai") {
            var context = StateManager.getCurrentFindContext();
            if (context && context.length > 0) {
                var note = context[0].note || context[0];
                StateManager.setAiConversationMode(note);
                StateManager.clearCurrentFindContext();
                console.log("DEBUG: Set AI conversation mode for note ID:", note.id);
            }
        }
        
        if (det.action === "slash_selectsubnote") {
            // No state setting needed for selectsubnote - it's handled in formatOutcome
            console.log("DEBUG: Processing slash_selectsubnote command");
        }
        
        // Handle confirmation responses
        if (det.action === "confirmation_yes") {
            var response = this.handleConfirmationResponse(o.text);
            if (response) {
                console.log("DEBUG: handleConfirmationResponse returned:", response);
                this.sendToClient({ type: "reply", text: response }, ip, id);
                return;
            }
        }
        
        if (det.action === "confirmation_no") {
            var response = this.handleConfirmationResponse(o.text);
            if (response) {
                console.log("DEBUG: handleConfirmationResponse returned:", response);
                this.sendToClient({ type: "reply", text: response }, ip, id);
                return;
            }
        }
        
        // Check for yes/no responses to confirmations AFTER setting pending states
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
    
    handleGetAllNotes: function(o, ip, id) {
        try {
            var allNotes = NoteManager.getAllNotes();
            this.sendToClient({ type: "all_notes", notes: allNotes }, ip, id);
        } catch (error) {
            this.sendToClient({ type: "reply", text: "Error getting notes: " + error.message }, ip, id);
        }
    },
    
    // -------- Confirmation Response Handling --------
    handleConfirmationResponse: function(text) {
        var isHebrew = (Settings.lang === "he");
        var lowerText = text.toLowerCase().trim();
        
        console.log("DEBUG: handleConfirmationResponse called with text:", text);
        console.log("DEBUG: lowerText:", lowerText);
        
        // Debug: Check what pending states exist
        var pendingNote = StateManager.getPendingNoteCreation();
        var pendingDeletion = StateManager.getPendingNoteDeletion();
        var pendingMarkDone = StateManager.getPendingNoteMarkDone();
        console.log("DEBUG: Pending states - Note:", pendingNote, "Deletion:", pendingDeletion, "MarkDone:", pendingMarkDone);
        
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
                    
                    // If this is a sub-note creation (has parentId), return to parent context
                    if (pendingNote.parentId) {
                        // Find the parent note and set it as current context
                        var parentNote = NoteManager.findNotesById(pendingNote.parentId);
                        if (parentNote && parentNote.length > 0) {
                            StateManager.setCurrentFindContext(parentNote);
                            if (isHebrew) {
                                return "תת-פתק נוצר בהצלחה! ID: " + note.id + ", כותרת: '" + note.title + "'\n\n" +
                                       "חזרתי להקשר של הפתק הראשי '" + parentNote[0].title + "'. מה תרצה לעשות? (/editdescription /delete /createsub /markdone /talkai /selectsubnote)";
                            }
                            return "Sub-note created successfully! ID: " + note.id + ", Title: '" + note.title + "'\n\n" +
                                   "Returned to parent note '" + parentNote[0].title + "' context. What would you like to do? (/editdescription /delete /createsub /markdone /talkai /selectsubnote)";
                        }
                    }
                    
                    // For regular notes, clear find context
                    StateManager.clearCurrentFindContext();
                    if (isHebrew) {
                        return "פתק נוצר בהצלחה! ID: " + note.id + ", כותרת: '" + note.title + "'";
                    }
                    return "Note created successfully! ID: " + note.id + ", Title: '" + note.title + "'";
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
        var commands = [];
        
        // Check current application state
        var currentFindContext = StateManager.getCurrentFindContext();
        var storyEditingMode = StateManager.getStoryEditingMode();
        var aiConversationMode = StateManager.getAiConversationMode();
        var pendingNoteCreation = StateManager.getPendingNoteCreation();
        var pendingNoteDeletion = StateManager.getPendingNoteDeletion();
        var pendingNoteMarkDone = StateManager.getPendingNoteMarkDone();
        var pendingSubNoteCreation = StateManager.getPendingSubNoteCreation();
        
        console.log("DEBUG: getAvailableCommands - currentFindContext:", currentFindContext);
        console.log("DEBUG: getAvailableCommands - storyEditingMode:", storyEditingMode);
        console.log("DEBUG: getAvailableCommands - aiConversationMode:", aiConversationMode);
        
        // Define command metadata
        var commandMetadata = {
            slash_create_note: { 
                category: "📝 Create", 
                description: "Creating a new note",
                examples: ["/createnote groceries", "/createnote my task"],
                requiresParam: true,
                contexts: ["main"] // Only in main context
            },
            slash_find_note: { 
                category: "🔍 Find", 
                description: "Searching for notes by title",
                examples: ["/findnote shopping", "/findnote my tasks"],
                requiresParam: true,
                contexts: ["main"] // Only in main context
            },
            slash_find_by_id: { 
                category: "🔍 Find", 
                description: "Finding note by ID number",
                examples: ["/findbyid 5", "/findbyid 12"],
                requiresParam: true,
                contexts: ["main"] // Only in main context
            },
            slash_show_parents: { 
                category: "📋 Show", 
                description: "Showing all parent notes",
                examples: ["/showparents"],
                requiresParam: false,
                contexts: ["main", "find_context"] // Available in main and find contexts
            },
            slash_help: { 
                category: "❓ Help", 
                description: "Showing available commands",
                examples: ["/help"],
                requiresParam: false,
                contexts: ["main", "find_context", "story_editing", "ai_conversation", "pending_creation"] // Available in all contexts
            },
            slash_editdescription: { 
                category: "✏️ Edit", 
                description: "Editing note description",
                examples: ["/editdescription"],
                requiresParam: false,
                contexts: ["find_context"] // Only when a note is found
            },
            slash_markdone: { 
                category: "✅ Mark", 
                description: "Marking the current note as done",
                examples: ["/markdone"],
                requiresParam: false,
                contexts: ["find_context"] // Only when a note is found
            },
            slash_delete: { 
                category: "🗑️ Delete", 
                description: "Deleting the current note",
                examples: ["/delete"],
                requiresParam: false,
                contexts: ["find_context"] // Only when a note is found
            },
            slash_createsub: { 
                category: "📝 Create", 
                description: "Creating a sub-note under current note",
                examples: ["/createsub"],
                requiresParam: false,
                contexts: ["find_context"] // Only when a note is found
            },
            slash_talkai: { 
                category: "🤖 AI", 
                description: "Starting AI conversation about current note",
                examples: ["/talkai"],
                requiresParam: false,
                contexts: ["find_context"] // Only when a note is found
            },
            slash_selectsubnote: { 
                category: "🔍 Navigate", 
                description: "Selecting a sub-note by number",
                examples: ["/selectsubnote 2", "/selectsub 3", "/sub 4"],
                requiresParam: true,
                contexts: ["find_context"] // Only when a note is found
            },
            slash_stopediting: { 
                category: "📝 Edit", 
                description: "Stopping description editing mode",
                examples: ["/stopediting"],
                requiresParam: false,
                contexts: ["story_editing"] // Only when editing
            },
            slash_back: { 
                category: "🔙 Back", 
                description: "Going back to previous context",
                examples: ["/back"],
                requiresParam: false,
                contexts: ["find_context", "story_editing", "ai_conversation", "pending_creation"] // Available in most contexts
            },
            yes_response: { 
                category: "✅ Confirm", 
                description: "Confirming the action",
                examples: ["yes", "y", "yeah", "sure", "ok"],
                requiresParam: false,
                contexts: ["pending_creation"] // Only when waiting for confirmation
            },
            no_response: { 
                category: "❌ Decline", 
                description: "Declining the action",
                examples: ["no", "n", "nope", "cancel"],
                requiresParam: false,
                contexts: ["pending_creation"] // Only when waiting for confirmation
            }
        };
        
        // Determine current context
        var currentContext = "main"; // Default
        
        console.log("DEBUG: getAvailableCommands - checking context conditions:");
        console.log("DEBUG: - storyEditingMode:", storyEditingMode);
        console.log("DEBUG: - aiConversationMode:", aiConversationMode);
        console.log("DEBUG: - pendingNoteCreation:", pendingNoteCreation);
        console.log("DEBUG: - pendingNoteDeletion:", pendingNoteDeletion);
        console.log("DEBUG: - pendingNoteMarkDone:", pendingNoteMarkDone);
        console.log("DEBUG: - pendingSubNoteCreation:", pendingSubNoteCreation);
        console.log("DEBUG: - currentFindContext:", currentFindContext);
        
        if (storyEditingMode) {
            currentContext = "story_editing";
        } else if (aiConversationMode) {
            currentContext = "ai_conversation";
        } else if (pendingNoteCreation || pendingNoteDeletion || pendingNoteMarkDone || pendingSubNoteCreation) {
            currentContext = "pending_creation";
        } else if (currentFindContext && currentFindContext.length > 0) {
            currentContext = "find_context";
        }
        
        console.log("DEBUG: getAvailableCommands - determined context:", currentContext);
        
        // Extract commands based on current context
        for (var action in commandMetadata) {
            if (action.startsWith("slash_") || action.endsWith("_response")) {
                var metadata = commandMetadata[action];
                
                // Check if this command is available in current context
                if (metadata.contexts.includes(currentContext)) {
                    // Map action to command prefix
                    var commandMap = {
                        'slash_create_note': '/createnote',
                        'slash_find_note': '/findnote',
                        'slash_find_by_id': '/findbyid',
                        'slash_show_parents': '/showparents',
                        'slash_help': '/help',
                        'slash_editdescription': '/editdescription',
                        'slash_markdone': '/markdone',
                        'slash_delete': '/delete',
                        'slash_createsub': '/createsub',
                        'slash_talkai': '/talkai',
                        'slash_selectsubnote': '/selectsubnote',
                        'slash_stopediting': '/stopediting',
                        'slash_back': '/back',
                        'yes_response': 'yes',
                        'no_response': 'no'
                    };
                    
                    var command = commandMap[action];
                    if (command) {
                        console.log("DEBUG: Adding command:", command, "for action:", action, "in context:", currentContext);
                        commands.push({
                            action: action,
                            command: command,
                            category: metadata.category,
                            description: metadata.description,
                            examples: metadata.examples,
                            requiresParam: metadata.requiresParam
                        });
                    }
                }
            }
        }
        
        console.log("DEBUG: getAvailableCommands - returning commands:", commands.length);
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
        
        if (r.action === "unknown_command") {
            if (isHebrew) {
                return "לא הבנתי את הפקודה. נסה להשתמש בפקודות הזמינות או אמור '/help' לרשימת פקודות.";
            }
            return "I didn't understand that command. Try using the available commands or say '/help' for a list of commands.";
        }
        
        if (r.action === "gemini_question") {
            // This should only happen when explicitly requested via /talkai command
            // For now, redirect to help since AI should only be used in specific contexts
            if (isHebrew) {
                return "🤖 AI זמין רק במצב שיחה עם פתק ספציפי. השתמש ב-'/talkai' כדי להתחיל שיחה עם AI על פתק.";
            }
            return "🤖 AI is only available when talking with a specific note. Use '/talkai' to start an AI conversation about a note.";
        }
        
        // Handle slash commands first
        if (r.action === "slash_create_note") {
            if (r.params?.hasParameter && r.params?.title) {
                // User provided title with command - create directly
                var title = r.params.title;
                // Note: setPendingNoteCreation is now handled in handleChatMessage before formatOutcome
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
                        return "נמצא פתק אחד: '" + note.title + "' (ID: " + note.id + ").\n\n" + treeText + "\n\nמה תרצה לעשות? (/editdescription /delete /createsub /markdone /talkai /selectsubnote)";
                    }
                    return "Found 1 note: '" + note.title + "' (ID: " + note.id + ").\n\n" + treeText + "\n\nWhat would you like to do? (/editdescription /delete /createsub /markdone /talkai /selectsubnote)";
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
                    return "נמצא פתק: '" + note.title + "' (ID: " + note.id + ").\n\n" + treeText + "\n\nמה תרצה לעשות? (/editdescription /delete /createsub /markdone /talkai /selectsubnote)";
                }
                return "Found note: '" + note.title + "' (ID: " + note.id + ").\n\n" + treeText + "\n\nWhat would you like to do? (/editdescription /delete /createsub /markdone /talkai /selectsubnote)";
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
                       "🔍 **פקודות חיפוש:**\n" +
                       "• `/findnote [שם]` - חפש פתקים\n" +
                       "• `/findbyid [מספר]` - חפש לפי מזהה\n\n" +
                       "📋 **פקודות הצגה:**\n" +
                       "• `/showparents` - הצג פתקים ראשיים\n\n" +
                       "🔙 **פקודות ניווט:**\n" +
                       "• `/back` - חזור להקשר הקודם\n\n" +
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
                   "🔍 **Find Commands:**\n" +
                   "• `/findnote [title]` - Search for notes\n" +
                   "• `/findbyid [number]` - Find by ID\n\n" +
                   "📋 **Show Commands:**\n" +
                   "• `/showparents` - Show parent notes\n\n" +
                   "✏️ **Edit Commands:**\n" +
                   "• `/editdescription` - Edit note description\n" +
                   "• `/stopediting` - Stop editing description\n" +
                   "• `/markdone` - Mark note as done\n" +
                   "• `/delete` - Delete note\n" +
                   "• `/createsub` - Create sub-note\n" +
                   "• `/selectsubnote [number]` - Select sub-note\n\n" +
                   "🤖 **AI Commands:**\n" +
                   "• `/talkai` - Start AI conversation\n\n" +
                   "🔙 **Navigation Commands:**\n" +
                   "• `/back` - Go back to previous context\n\n" +
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
            console.log("DEBUG: formatOutcome - processing story_content action");
            var content = r.params?.content;
            if (content) {
                StateManager.addToStoryEditing(content);
                console.log("DEBUG: Added to story editing:", content);
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
                return "נבחר הפתק: '" + selectedNote.title + "' (ID: " + selectedNote.id + ").\n\n" + treeText + "\n\nמה תרצה לעשות? (/editdescription /delete /createsub /markdone /talkai /selectsubnote)";
            }
            return "Selected note: '" + selectedNote.title + "' (ID: " + selectedNote.id + ").\n\n" + treeText + "\n\nWhat would you like to do? (/editdescription /delete /createsub /markdone /talkai /selectsubnote)";
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
            // Note: setPendingSubNoteCreation is now handled in handleChatMessage before formatOutcome
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
            
            // Note: setStoryEditingMode is now handled in handleChatMessage before formatOutcome
            
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
            // Note: setPendingNoteDeletion is now handled in handleChatMessage before formatOutcome
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
            
            // Note: setPendingNoteMarkDone is now handled in handleChatMessage before formatOutcome
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
            
            // Note: setAiConversationMode is now handled in handleChatMessage before formatOutcome
            
            if (isHebrew) {
                return "🤖 התחלתי שיחה עם AI על הפתק '" + note.title + "'. אמור 'cancel' לסיום השיחה.";
            }
            return "🤖 Started AI conversation about note '" + note.title + "'. Say 'cancel' to end the conversation.";
        }
        
        if (r.action === "find_sub_select") {
            var context = StateManager.getCurrentFindContext();
            if (!context || context.length === 0) {
                if (isHebrew) {
                    return "לא נמצאו פתקים לבחירה. נסה לחפש קודם.";
                }
                return "No notes found to select from. Try searching first.";
            }
            
            var parentNote = context[0].note || context[0];
            var subNoteId = r.params?.subNoteId;
            
            if (!subNoteId) {
                if (isHebrew) {
                    return "אנא ציין את מזהה התת-פתק. לדוגמה: /selectsubnote 2";
                }
                return "Please specify the sub-note ID. For example: /selectsubnote 2";
            }
            
            // Find the sub-note by ID
            var subNotes = NoteManager.findNoteChildren(parentNote.id);
            var selectedSubNote = null;
            
            for (var i = 0; i < subNotes.length; i++) {
                if (subNotes[i].id === subNoteId) {
                    selectedSubNote = subNotes[i];
                    break;
                }
            }
            
            if (!selectedSubNote) {
                if (isHebrew) {
                    return "לא נמצא תת-פתק עם מזהה " + subNoteId + " תחת '" + parentNote.title + "'";
                }
                return "No sub-note found with ID " + subNoteId + " under '" + parentNote.title + "'";
            }
            
            // Update context with the selected sub-note
            StateManager.setCurrentFindContext([selectedSubNote]);
            
            // Find children of the selected sub-note
            var children = NoteManager.findNoteChildren(selectedSubNote.id);
            var treeText = NoteManager.createNoteTree(selectedSubNote, children);
            
            if (isHebrew) {
                return "נבחר תת-פתק: '" + selectedSubNote.title + "' (ID: " + selectedSubNote.id + ").\n\n" + treeText + "\n\nמה תרצה לעשות? (/editdescription /delete /createsub /markdone /talkai /selectsubnote)";
            }
            return "Selected sub-note: '" + selectedSubNote.title + "' (ID: " + selectedSubNote.id + ").\n\n" + treeText + "\n\nWhat would you like to do? (/editdescription /delete /createsub /markdone /talkai /selectsubnote)";
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
                var conversationHistory = StateManager.getAiConversationHistory();
                
                // Use AIService to generate context-aware response with conversation history
                var response = AIService.generateNoteContextResponseWithHistory(message, note, conversationHistory);
                
                // Add to conversation history
                StateManager.addToAiConversationHistory(message, response);
                
                return response;
            }
            
            if (isHebrew) {
                return "לא הבנתי את ההודעה שלך.";
            }
            return "I didn't understand your message.";
        }
        
        // Find sub-commands as slash commands
        if (r.action === "slash_editdescription") {
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
            // Note: setAiConversationMode is now handled in handleChatMessage before formatOutcome
            // Just return the confirmation message
            var context = StateManager.getCurrentFindContext();
            if (!context || context.length === 0) {
                if (isHebrew) {
                    return "לא נמצאו פתקים לשיחה עם AI. נסה לחפש קודם.";
                }
                return "No notes found for AI conversation. Try searching first.";
            }
            
            var note = context[0].note || context[0];
            // Clear context after getting the note info
            StateManager.clearCurrentFindContext();
            
            if (isHebrew) {
                return "🤖 התחלתי שיחה עם AI על הפתק '" + note.title + "'. אמור 'cancel' לסיום השיחה.";
            }
            return "🤖 Started AI conversation about note '" + note.title + "'. Say 'cancel' to end the conversation.";
        }
        if (r.action === "slash_selectsubnote") {
            return this.formatOutcome({action: "find_sub_select", params: r.params, confidence: 1});
        }
        
        if (r.action === "slash_stopediting") {
            // Check if we're in story editing mode
            var storyEditingMode = StateManager.getStoryEditingMode();
            if (!storyEditingMode) {
                if (isHebrew) {
                    return "לא נמצא במצב עריכת תיאור.";
                }
                return "Not in description editing mode.";
            }
            
            // Get the current story content
            var storyContent = StateManager.getStoryEditingContent();
            if (!storyContent || storyContent.trim() === "") {
                if (isHebrew) {
                    return "לא נוסף תוכן לעריכה. עריכת התיאור בוטלה.";
                }
                return "No content added for editing. Description editing cancelled.";
            }
            
            // Update the note with the new description
            var noteId = storyEditingMode.noteId;
            var note = NoteManager.findNotesById(noteId);
            if (note) {
                NoteManager.updateNoteDescription(noteId, storyContent);
                StateManager.clearStoryEditingMode();
                
                if (isHebrew) {
                    return "✅ תיאור הפתק '" + note.title + "' עודכן בהצלחה!";
                }
                return "✅ Note description for '" + note.title + "' updated successfully!";
            } else {
                StateManager.clearStoryEditingMode();
                if (isHebrew) {
                    return "❌ לא ניתן למצוא את הפתק. עריכת התיאור בוטלה.";
                }
                return "❌ Could not find the note. Description editing cancelled.";
            }
        }
        
        if (r.action === "slash_back") {
            // Clear all pending states and modes
            StateManager.clearPendingNoteCreation();
            StateManager.clearPendingNoteDeletion();
            StateManager.clearPendingNoteMarkDone();
            StateManager.clearPendingSubNoteCreation();
            StateManager.clearStoryEditingMode();
            StateManager.clearAiConversationMode();
            StateManager.clearCurrentFindContext();
            
            if (isHebrew) {
                return "✅ בוטל. חזרתי למצב רגיל.";
            }
            return "✅ Cancelled. Back to normal mode.";
        }
        
        if (r.action === "confirmation_yes") {
            // This should be handled in handleChatMessage, but just in case
            var response = this.handleConfirmationResponse(r.params?.text || "yes");
            return response || "Confirmation processed.";
        }
        
        if (r.action === "confirmation_no") {
            // This should be handled in handleChatMessage, but just in case
            var response = this.handleConfirmationResponse(r.params?.text || "no");
            return response || "Cancellation processed.";
        }
        
        if (r.action === "unknown_slash_command") {
            var command = r.params?.command || "unknown";
            if (isHebrew) {
                return "לא ידוע פקודה: " + command + ". נסה /help לרשימת פקודות זמינות.";
            }
            return "Unknown command: " + command + ". Try /help for available commands.";
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
        console.log("DEBUG: formatOutcome - processing sub_note_name action");
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
    
};
