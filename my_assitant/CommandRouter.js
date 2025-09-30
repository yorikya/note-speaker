// CommandRouter.js - Intent Detection and Command Processing Module
// Handles all command pattern matching, intent detection, and command routing

var CommandRouter = {
    // -------- Command Patterns --------
    patterns: {
        en: {
            // Only patterns still used by the detection system
            
            
            // Sub-commands for find flow
            // Free text sub-commands removed - only slash commands supported
            // Sub-note name collection - match simple text that's not a command
            sub_note_name:    [ /^(?!.*\b(create|new|make|add|editdescription|update|delete|remove|find|search|lookup)\b)[a-zA-Z0-9\s]+$/i ],
            // Note selection by ID or exact title
            note_selection:    [ /^(?:note\s+)?id\s+(\d+)$/i, /^(?:note\s+)?(\d+)$/i, /^['"]([^'"]+)['"]$/ ],
            // Stop editing description - fuzzy matching for typos
            stop_editing_description: [ /\b(stop|end|finish|done|complete)\s+(?:editing|writing|recording|dictating)\s+(?:description|story|note|content)\b/i, /\b(stop|end|finish|done|complete)\s+(?:description|story|note|content)\s+(?:editing|writing|recording|dictating)\b/i, /\b(stop|end|finish|done|complete)\s+(?:editing|writing|recording|dictating)\b/i ],
            // Cancel/abort commands for find mode
            cancel_action: [ /\b(cancel|abort|stop|quit|exit|back|return)\b/i ],
            // Cancel AI conversation
            cancel_ai_conversation: [ /\b(cancel|stop|exit|back|return|done|finish)\b/i ],
            // Help command
            help: [ /\b(help|assist|guide|what can i do|what should i do)\b/i, /\b(help|assist|guide)\b/i ],
            // Show parent notes command
            show_parent_notes: [ /\b(show|list|display)\s+(parent|main|root)\s+(notes|note)\b/i, /\b(parent|main|root)\s+(notes|note)\b/i, /\b(show|list|display)\s+(all\s+)?(notes|note)\b/i ],
        },
        he: {
            // Hebrew pattern equivalent of English patterns
            // Sub-note name collection - match simple text that's not a command
            sub_note_name:    [ /^(?!.*\b(צור|יצירת|הוסף|ערוך|עדכן|מחק|מצא|חפש)\b)[א-ת0-9\s]+$/i ],
            // Note selection by ID or exact title
            note_selection:    [ /^(?:פתק\s+)?מזהה\s+(\d+)$/i, /^(?:פתק\s+)?(\d+)$/i, /^['"]([^'"]+)['"]$/ ],
            // Stop editing description - fuzzy matching for typos
            stop_editing_description: [ /\b(עצור|סיים|סיימי|סיימתי|גמר|גמרתי)\s+(?:עריכה|כתיבה|הקלטה|דיקטציה)\s+(?:תיאור|סיפור|פתק|תוכן)\b/i, /\b(עצור|סיים|סיימי|סיימתי|גמר|גמרתי)\s+(?:תיאור|סיפור|פתק|תוכן)\s+(?:עריכה|כתיבה|הקלטה|דיקטציה)\b/i, /\b(עצור|סיים|סיימי|סיימתי|גמר|גמרתי)\s+(?:עריכה|כתיבה|הקלטה|דיקטציה)\b/i ],
            // Cancel/abort commands for find mode
            cancel_action: [ /\b(בטל|ביטול|עצור|חזור|יציאה|סגור|חזרה)\b/i ],
            // Cancel AI conversation
            cancel_ai_conversation: [ /\b(בטל|עצור|יציאה|חזור|סיים|גמר)\b/i ],
            // Help command
            help: [ /\b(עזרה|סיוע|הדרכה|מה אני יכול לעשות|מה עלי לעשות)\b/i, /\b(עזרה|סיוע|הדרכה)\b/i ],
            // Show parent notes command
            show_parent_notes: [ /(הצג|הראה|רשום|רשימה)\s+(פתקים|פתק|הערות|הערה)\s+(ראשיים|עיקריים|שורש)/i, /(פתקים|פתק|הערות|הערה)\s+(ראשיים|עיקריים|שורש)/i, /(הצג|הראה|רשום|רשימה)\s+(כל\s+)?(פתקים|פתק|הערות|הערה)/i ],
        }
    },
    
    // -------- Pattern Management Functions --------
    getPatterns: function(lang) {
        return this.patterns[lang] || {};
    },
    
    // -------- Parameter Extraction Functions --------
    
    extractParams: function(action, raw) {
        console.log("DEBUG: extractParams called with action='" + action + "', raw='" + raw + "'");
        try {
            // Extract quoted text for title
            var titleMatch = raw.match(/'([^']+)'/);
            var title = titleMatch ? titleMatch[1].trim() : null;
            
            // Extract parent reference
            var parentMatch = raw.match(/\bunder\s+'([^']+)'/i) || raw.match(/\bתחת\s+'([^']+)'/i);
            var parent = parentMatch ? parentMatch[1].trim() : null;
            
            var query = title || raw;
            console.log("DEBUG: extractParams - title='" + title + "', parent='" + parent + "', query='" + query + "'");
            
            // Handle slash commands with parameter extraction
            if (action.startsWith("slash_")) {
                // Generic slash command parameter extraction
                var match = raw.match(/^\/\w+[\-_]?\w*\s+(.+)/i);
                if (match && match[1]) {
                    var param = match[1].trim();
                    
                    // Specific handling for different command types
                    if (action === "slash_selectsubnote") {
                        return { subNoteId: param, hasParameter: true };
                    } else if (action === "slash_find_note") {
                        return { title: param, query: param, hasParameter: true };
                    } else if (action === "slash_find_by_id") {
                        return { query: param, hasParameter: true };
                    } else {
                        return { title: param, hasParameter: true };
                    }
                }
                return { hasParameter: false };
            }
            
            // For sub-commands, extract the action and any additional parameters
            if (action.startsWith("find_sub_")) {
                var subAction = action.replace("find_sub_", "");
                return { subAction: subAction, query: query };
            }
            
            // For note selection, extract ID or title
            if (action === "note_selection") {
                console.log("DEBUG: Processing note_selection with raw='" + raw + "'");
                // Try to match ID patterns first
                var idMatch = raw.match(/^(?:note\s+)?id\s+(\d+)$/i) ||
                              raw.match(/^(?:note\s+)?(\d+)$/i) ||
                              raw.match(/^(?:פתק\s+)?מזהה\s+(\d+)$/i) ||
                              raw.match(/^(?:פתק\s+)?(\d+)$/i);
                
                console.log("DEBUG: idMatch result:", idMatch);
                
                if (idMatch) {
                    console.log("DEBUG: Returning ID match - selectionType: 'id', value: '" + idMatch[1] + "'");
                    return { selectionType: "id", value: idMatch[1] };
                }
                
                // Try to match quoted title
                var titleMatch = raw.match(/^['"]([^'"]+)['"]$/);
                console.log("DEBUG: titleMatch result:", titleMatch);
                
                if (titleMatch) {
                    console.log("DEBUG: Returning title match - selectionType: 'title', value: '" + titleMatch[1] + "'");
                    return { selectionType: "title", value: titleMatch[1] };
                }
                
                console.log("DEBUG: Returning unknown match - selectionType: 'unknown', value: '" + raw + "'");
                return { selectionType: "unknown", value: raw };
            }
            
            return { title: title || null };
        } catch (e) {
            console.log("DEBUG: extractParams - ERROR in function:", e.message);
            console.log("DEBUG: extractParams - ERROR stack:", e.stack);
            throw e;
        }
    },
    
    // -------- Intent Detection --------
    detectIntent: function(text, settings) {
        var lang = settings.lang || "en";
        var table = this.getPatterns(lang);
        
        // Check if we're in AI conversation mode
        if (StateManager.getAiConversationMode()) {
            // Check for cancel AI conversation command
            if (table["cancel_ai_conversation"] && table["cancel_ai_conversation"].some(rx => rx.test(text))) {
                return {action: "cancel_ai_conversation", params: {}, confidence: 1};
            }
            // If in AI conversation mode and not a cancel command, treat as AI conversation
            return {action: "ai_conversation", params: {message: text.trim()}, confidence: 1};
        }
        
        // Check if we're in story editing mode
        var storyEditingMode = StateManager.getStoryEditingMode();
        console.log("DEBUG: detectIntent - storyEditingMode:", storyEditingMode);
        if (storyEditingMode) {
            // Check for stop editing description command
            if (table["stop_editing_description"] && table["stop_editing_description"].some(rx => rx.test(text))) {
                return {action: "stop_editing_description", params: {}, confidence: 1};
            }
            // If in story editing mode and not a stop command, treat as story content
            console.log("DEBUG: detectIntent - treating as story content:", text.trim());
            return {action: "story_content", params: {content: text.trim()}, confidence: 1};
        }
        
        // Check if we're waiting for command completion
        if (StateManager.getPendingCommandCompletion()) {
            var pendingCompletion = StateManager.getPendingCommandCompletion();
            var command = pendingCompletion.command;
            var action = pendingCompletion.action;
            
            // Handle the completion based on the command type
            if (command === "create_note") {
                StateManager.clearPendingCommandCompletion();
                return {action: "slash_create_note", params: {title: text.trim(), hasParameter: true}, confidence: 1};
            } else if (command === "create_story") {
                StateManager.clearPendingCommandCompletion();
                return {action: "slash_create_story", params: {title: text.trim(), hasParameter: true}, confidence: 1};
            } else if (command === "find_note") {
                StateManager.clearPendingCommandCompletion();
                return {action: "slash_find_note", params: {query: text.trim(), hasParameter: true}, confidence: 1};
            } else if (command === "find_by_id") {
                StateManager.clearPendingCommandCompletion();
                return {action: "slash_find_by_id", params: {query: text.trim(), hasParameter: true}, confidence: 1};
            }
        }
        
        // Check if we're waiting for sub-note name
        var pendingSubNote = StateManager.getPendingSubNoteCreation();
        console.log("DEBUG: detectIntent - pendingSubNote:", pendingSubNote);
        if (pendingSubNote) {
            // First check for yes/no responses (confirmation) - these should NOT be treated as sub-note names
            var isHebrew = (lang === "he");
            var lowerText = text.toLowerCase().trim();
            
            // Check for yes responses
            var yesPatterns = isHebrew ? 
                [/\b(כן|כן כן|כן בבקשה|כן אני רוצה|כן תודה)\b/] :
                [/\b(yes|yeah|yep|yup|sure|ok|okay|please|do it)\b/];
            
            // Check for no responses  
            var noPatterns = isHebrew ?
                [/\b(לא|לא תודה|לא רוצה|לא עכשיו|בטל|ביטול)\b/] :
                [/\b(no|nope|nah|cancel|don't|don't want)\b/, /\bstop\b(?!\s+(editing|recording|writing))/];
            
            // If it's a yes/no response, don't treat it as a sub-note name
            for (var pattern of yesPatterns) {
                if (pattern.test(lowerText)) {
                    // This is a confirmation, not a sub-note name - let it fall through to normal processing
                    return {action: "unknown", params: {}, confidence: 0};
                }
            }
            
            for (var pattern of noPatterns) {
                if (pattern.test(lowerText)) {
                    // This is a cancellation, not a sub-note name - let it fall through to normal processing
                    return {action: "unknown", params: {}, confidence: 0};
                }
            }
            
            // If we're waiting for a sub-note name, treat ANY text as a sub-note name
            // (unless it's a yes/no response which we already handled above)
            console.log("DEBUG: detectIntent - treating as sub-note name:", text.trim());
            return {action: "sub_note_name", params: {name: text.trim()}, confidence: 1};
        }
        
        // Check if we're in a find context and user is selecting a note
        if (StateManager.getCurrentFindContext()) {
            // Check for cancel/abort commands first
            if (table["cancel_action"] && table["cancel_action"].some(rx => rx.test(text))) {
                return {action: "cancel_action", params: {}, confidence: 1};
            }
            
            // Check for note selection (ID or exact title)
            if (table["note_selection"] && table["note_selection"].some(rx => rx.test(text))) {
                console.log("DEBUG: detectIntent - note_selection pattern matched for text='" + text + "'");
                var params = this.extractParams("note_selection", text);
                console.log("DEBUG: detectIntent - extractParams returned:", JSON.stringify(params));
                return {action: "note_selection", params: params, confidence: 1};
            }
            
            // Free text sub-commands removed - only slash commands supported
        }
        
        // Simple prefix-based command detection
        if (text.startsWith('/')) {
            var parts = text.trim().split(/\s+/);
            var command = parts[0].toLowerCase();
            var params = parts.slice(1).join(' ');
            
            console.log("DEBUG: Slash command detected:", command, "with params:", params);
            
            // Map command prefixes to actions
                var commandMap = {
                    '/createnote': 'slash_create_note',
                    '/createstory': 'slash_create_story', 
                    '/findnote': 'slash_find_note',
                    '/findbyid': 'slash_find_by_id',
                    '/showparents': 'slash_show_parents',
                    '/help': 'slash_help',
                    '/editdescription': 'slash_editdescription',
                    '/editdesc': 'slash_editdescription',
                    '/markdone': 'slash_markdone',
                    '/delete': 'slash_delete',
                    '/createsub': 'slash_createsub',
                    '/talkai': 'slash_talkai',
                    '/selectsubnote': 'slash_selectsubnote',
                    '/selectsub': 'slash_selectsubnote',
                    '/sub': 'slash_selectsubnote',
                    '/stopediting': 'slash_stopediting',
                    '/cancel': 'slash_cancel'
                };
            
            var action = commandMap[command];
            if (action) {
                console.log("DEBUG: Command mapped to action:", action);
                return {action: action, params: this.extractParams(action, text), confidence: 1};
            } else {
                console.log("DEBUG: Unknown slash command:", command);
                return {action: "unknown_slash_command", params: {command: command}, confidence: 0.8};
            }
        }
        
        // Check for confirmation responses when there are pending states
        var pendingNote = StateManager.getPendingNoteCreation();
        var pendingStory = StateManager.getPendingStoryCreation();
        var pendingDeletion = StateManager.getPendingNoteDeletion();
        var pendingMarkDone = StateManager.getPendingNoteMarkDone();
        var pendingSubNote = StateManager.getPendingSubNoteCreation();
        var pendingUpdate = StateManager.getPendingStoryUpdate();
        
        console.log("DEBUG: detectIntent - checking for confirmation responses");
        console.log("DEBUG: detectIntent - pending states - Note:", pendingNote, "Story:", pendingStory, "Deletion:", pendingDeletion, "MarkDone:", pendingMarkDone, "SubNote:", pendingSubNote, "Update:", pendingUpdate);
        
        if (pendingNote || pendingStory || pendingDeletion || pendingMarkDone || pendingSubNote || pendingUpdate) {
            console.log("DEBUG: detectIntent - found pending states, checking for confirmation patterns");
            // Check for yes/no responses
            var isHebrew = (lang === "he");
            var lowerText = text.toLowerCase().trim();
            
            // Check for yes responses
            var yesPatterns = isHebrew ? 
                [/\b(כן|כן כן|כן בבקשה|כן אני רוצה|כן תודה)\b/] :
                [/\b(yes|yeah|yep|yup|sure|ok|okay|please|do it)\b/];
            
            // Check for no responses  
            var noPatterns = isHebrew ?
                [/\b(לא|לא תודה|לא רוצה|לא עכשיו|בטל|ביטול)\b/] :
                [/\b(no|nope|nah|cancel|don't|don't want)\b/, /\bstop\b(?!\s+(editing|recording|writing))/];
            
            for (var pattern of yesPatterns) {
                console.log("DEBUG: detectIntent - testing yes pattern:", pattern, "against text:", lowerText);
                if (pattern.test(lowerText)) {
                    console.log("DEBUG: detectIntent - yes pattern matched!");
                    return {action: "confirmation_yes", params: {text: text}, confidence: 1};
                }
            }
            
            for (var pattern of noPatterns) {
                console.log("DEBUG: detectIntent - testing no pattern:", pattern, "against text:", lowerText);
                if (pattern.test(lowerText)) {
                    console.log("DEBUG: detectIntent - no pattern matched!");
                    return {action: "confirmation_no", params: {text: text}, confidence: 1};
                }
            }
            
            console.log("DEBUG: detectIntent - no confirmation patterns matched");
        }
        
        // If no command matched, treat as free text question for Gemini
        return {action:"gemini_question", params:{question: text}, confidence:0.5};
    },
    
    // -------- Command Processing Helpers --------
    setPendingCommandCompletion: function(command, action) {
        StateManager.setPendingCommandCompletion(command, action);
    },
    
    
};
