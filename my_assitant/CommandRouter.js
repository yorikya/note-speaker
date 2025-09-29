// CommandRouter.js - Intent Detection and Command Processing Module
// Handles all command pattern matching, intent detection, and command routing

var CommandRouter = {
    // -------- Command Patterns --------
    patterns: {
        en: {
            // Slash-based commands (new system) - supporting multiple naming conventions
            slash_create_note: [ 
                /^\/create_note\s+(.+)/i, /^\/create-note\s+(.+)/i, /^\/createNote\s+(.+)/i,
                /^\/createnote\s+(.+)/i, /^\/createnotes\s+(.+)/i,
                /^\/create\s+(.+)/i,  // Short form with parameter
                /^\/create_note$/i, /^\/create-note$/i, /^\/createNote$/i,
                /^\/createnote$/i, /^\/createnotes$/i,
                /^\/create$/i  // Short form without parameter
            ],
            slash_create_story: [ 
                /^\/create_story\s+(.+)/i, /^\/create-story\s+(.+)/i, /^\/createStory\s+(.+)/i,
                /^\/createstory\s+(.+)/i, /^\/createstories\s+(.+)/i,
                /^\/story\s+(.+)/i,  // Short form with parameter
                /^\/create_story$/i, /^\/create-story$/i, /^\/createStory$/i,
                /^\/createstory$/i, /^\/createstories$/i,
                /^\/story$/i  // Short form without parameter
            ],
            slash_find_note: [ 
                /^\/find_note\s+(.+)/i, /^\/find-note\s+(.+)/i, /^\/findNote\s+(.+)/i,
                /^\/findnote\s+(.+)/i, /^\/findnotes\s+(.+)/i,
                /^\/find\s+(.+)/i,  // Short form with parameter
                /^\/find_note$/i, /^\/find-note$/i, /^\/findNote$/i,
                /^\/findnote$/i, /^\/findnotes$/i,
                /^\/find$/i  // Short form without parameter
            ],
            slash_find_by_id: [ 
                /^\/find_by_id\s+(\d+)/i, /^\/find-by-id\s+(\d+)/i, /^\/findById\s+(\d+)/i,
                /^\/findbyid\s+(\d+)/i, /^\/findid\s+(\d+)/i,
                /^\/id\s+(\d+)/i,  // Short form with parameter
                /^\/find_by_id$/i, /^\/find-by-id$/i, /^\/findById$/i,
                /^\/findbyid$/i, /^\/findid$/i,
                /^\/id$/i  // Short form without parameter
            ],
            slash_show_parents: [ 
                /^\/show_parents$/i, /^\/show-parents$/i, /^\/showParents$/i,
                /^\/showparents$/i, /^\/showparent$/i,
                /^\/parents$/i, /^\/parent$/i  // Short forms
            ],
            slash_help: [ /^\/help$/i, /^\/h$/i ],  // Short form
            
            // Slash commands are now handled by prefix matching above
            // These patterns are kept for backward compatibility but not used
            slash_editdescription: [],
            slash_markdone: [],
            slash_delete: [],
            slash_createsub: [],
            slash_talkai: [],
            slash_selectsubnote: [],
        slash_stopediting: [],
        slash_cancel: [],
            
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
            // Free text commands removed - only slash commands supported
            // Sub-commands for find flow
            // Free text sub-commands removed - only slash commands supported
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
    addPattern: function(lang, action, regex) {
        if (!this.patterns[lang]) {
            this.patterns[lang] = {};
        }
        if (!this.patterns[lang][action]) {
            this.patterns[lang][action] = [];
        }
        this.patterns[lang][action].push(regex);
    },
    
    getPatterns: function(lang) {
        return this.patterns[lang] || {};
    },
    
    // -------- Parameter Extraction Functions --------
    extractQuoted: function(s) {
        var m = s.match(/'([^']+)'/);
        return m ? m[1].trim() : null;
    },
    
    extractParent: function(s) {
        var m = s.match(/\bunder\s+'([^']+)'/i) || s.match(/\bתחת\s+'([^']+)'/i);
        return m ? m[1].trim() : null;
    },
    
    extractParams: function(action, raw) {
        console.log("DEBUG: extractParams called with action='" + action + "', raw='" + raw + "'");
        try {
            var title = this.extractQuoted(raw);
            var parent = this.extractParent(raw);
            var query = title || raw;
            console.log("DEBUG: extractParams - title='" + title + "', parent='" + parent + "', query='" + query + "'");
            
            // Handle slash commands with improved pattern matching
            if (action === "slash_create_note" || action === "slash_create_story") {
                // Extract title from slash command - handle all formats
                var match = raw.match(/^\/\w+[\-_]?\w*\s+(.+)/i);
                if (match && match[1]) {
                    return { title: match[1].trim(), hasParameter: true };
                }
                return { title: null, hasParameter: false };
            }
            
            if (action === "slash_find_note") {
                // Extract query from slash command - handle all formats
                var match = raw.match(/^\/\w+[\-_]?\w*\s+(.+)/i);
                if (match && match[1]) {
                    return { title: match[1].trim(), query: match[1].trim(), hasParameter: true };
                }
                return { query: null, hasParameter: false };
            }
            
            if (action === "slash_find_by_id") {
                // Extract ID from slash command - handle all formats
                var match = raw.match(/^\/\w+[\-_]?\w*\s+(\d+)/i);
                if (match && match[1]) {
                    return { query: match[1], hasParameter: true };
                }
                return { query: null, hasParameter: false };
            }
            
            if (action === "slash_show_parents" || action === "slash_help") {
                // No parameters needed
                return { hasParameter: false };
            }
            
            if (action === "slash_selectsubnote") {
                // Extract sub-note ID from slash command
                var match = raw.match(/^\/\w+[\-_]?\w*\s+(\d+)/i);
                if (match && match[1]) {
                    return { subNoteId: match[1], hasParameter: true };
                }
                return { subNoteId: null, hasParameter: false };
            }
            
            // Free text create_note command removed - only slash commands supported
            
            // Free text create_note_story command removed - only slash commands supported
            
            // Free text find_note_by_id command removed - only slash commands supported
            
            // Free text find_note command removed - only slash commands supported
            
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
        
        // If no command matched, treat as free text question for Gemini
        return {action:"gemini_question", params:{question: text}, confidence:0.5};
    },
    
    // -------- Command Processing Helpers --------
    setPendingCommandCompletion: function(command, action) {
        StateManager.setPendingCommandCompletion(command, action);
    },
    
    // -------- Utility Functions --------
    isCommand: function(text) {
        var commandPatterns = [
            /^\/\w+/i, // Slash commands
            /^(create|find|show|help|editdescription|delete|mark|talk|stop|cancel|yes|no)\b/i,
            /^(צור|מצא|הצג|עזרה|ערוך|מחק|סמן|דבר|עצור|בטל|כן|לא)\b/i
        ];
        return commandPatterns.some(pattern => pattern.test(text));
    },
    
    // -------- Debug Functions --------
    getRouterInfo: function() {
        return {
            supportedLanguages: Object.keys(this.patterns),
            totalPatterns: Object.keys(this.patterns.en || {}).length,
            routerStatus: "active"
        };
    }
};
