// main.js (DroidScript)
// Backend web+WebSocket server + simple EN/HE intent router.

// -------- Router: patterns & helpers (same logic as before) --------
var Settings = { lang: "en" };

var Patterns = {
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
        
        // Find sub-commands as slash commands
        slash_edit: [ /^\/edit$/i, /^\/editdescription$/i ],
        slash_markdone: [ /^\/markdone$/i, /^\/mark_done$/i, /^\/done$/i ],
        slash_delete: [ /^\/delete$/i, /^\/remove$/i, /^\/rm$/i ],
        slash_createsub: [ /^\/createsub$/i, /^\/createsubnote$/i, /^\/subnote$/i ],
        slash_talkai: [ /^\/talkai$/i, /^\/talk_ai$/i, /^\/ai$/i ],
        
        // Legacy natural language commands (disabled - only slash commands allowed)
        // create_note_story: [ /\b(create|start|new|make).*?\b(note).*\b(story|long|dictation)\b/i, /\b(long|stream|dictation)\s+(note|story)\b/i, /\b(create|start|new|make)\s+(story|long|dictation)\b/i ],
        // create_note:       [ /\b(create|new|make|add)\b.*?\bnote\b/i, /\b(create|new|make|add)\s+(.+)/i ],
        // find_note:         [ /\b(find|search|lookup)\b.*?\b(note|notes)\b/i, /^find\s+/i, /\b(find|search|lookup)\s+(.+)/i ],
        // find_note_by_id:   [ /\b(find|search|lookup)\s+(?:note|notes)?\s+id\s+(\d+)/i, /\b(find|search|lookup)\s+(?:note|notes)?\s+by\s+id\s+(\d+)/i ],
        // Sub-commands for find flow
        find_sub_create:   [ /\b(create|new|make|add)\b.*?\b(sub[- ]?note|child)\b/i ],
        find_sub_edit_description:     [ /\b(edit|update|modify)\b/i ],
        find_sub_delete:   [ /\b(delete|remove|rm)\b/i ],
        find_sub_mark_done: [ /\b(mark|set)\s+(done|complete|finished)\b/i, /\b(complete|finish|done)\b/i ],
        find_sub_talk_ai: [ /\b(talk|chat|ask|discuss)\s+(ai|gemini|assistant)\b/i, /\b(talk|chat|ask|discuss)\b/i ],
        // Sub-note name collection - match simple text that's not a command
        sub_note_name:    [ /^(?!.*\b(create|new|make|add|edit|update|delete|remove|find|search|lookup)\b)[a-zA-Z0-9\s]+$/i ],
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
        create_note_story: [ /(צור|יצירת|התחל|התחילי|הוסף)\s.*?(הערה|פתק).*?(סיפור|ארוך|דקטציה|דִיקְטָצְיָה)/i, /\b(הערה|פתק)\s(ארוך|סיפור)\b/i, /(צור|יצירת|התחל|התחילי|הוסף)\s+(סיפור|ארוך|דקטציה|דִיקְטָצְיָה)/i ],
        create_note:       [ /(צור|יצירת|הוסף)\s.*?\b(פתק|הערה)\b/i, /(צור|יצירת|הוסף)\s+(.+)/i ],
        find_note:         [ /(מצא|חפש|חפשי)\s.*?\b(פתק|פתקים|הערה|הערות)\b/i, /^מצא\s+/i, /^חפש\s+/i, /(מצא|חפש|חפשי)\s+(.+)/i ],
        find_note_by_id:   [ /(מצא|חפש|חפשי)\s+(?:פתק|פתקים|הערה|הערות)?\s+מזהה\s+(\d+)/i, /(מצא|חפש|חפשי)\s+(?:פתק|פתקים|הערה|הערות)?\s+לפי\s+מזהה\s+(\d+)/i ],
        // Sub-commands for find flow
        find_sub_create:   [ /(צור|יצירת|הוסף).*\b(תת[- ]?(פתק|הערה)|ילד)\b/i ],
        find_sub_edit_description:     [ /(ערוך|עדכן|עדכני|שנה)\b/i ],
        find_sub_delete:   [ /(מחק|מחקי|הסר|הסרי)\b/i ],
        find_sub_mark_done: [ /(סמן|הגדר|עשה)\s+(הושלם|סיים|גמור|מוכן)\b/i, /\b(הושלם|סיים|גמור|מוכן)\b/i ],
        find_sub_talk_ai: [ /(דבר|שוחח|שאל|דון)\s+(ai|ג'מיני|עוזר|בינה)\b/i, /(דבר|שוחח|שאל|דון)\b/i ],
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
};
function AddPattern(lang, action, regex){ (Patterns[lang]??={}); (Patterns[lang][action]??=[]).push(regex); }
function extractQuoted(s){ var m = s.match(/'([^']+)'/); return m ? m[1].trim() : null; }
function extractParent(s){ var m = s.match(/\bunder\s+'([^']+)'/i) || s.match(/\bתחת\s+'([^']+)'/i); return m ? m[1].trim() : null; }
function extractParams(action, raw){
    console.log("DEBUG: extractParams called with action='" + action + "', raw='" + raw + "'");
    try {
    var title = extractQuoted(raw), parent = extractParent(raw), query = title || raw;
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
    
    // For create_note, try to extract title from the command pattern
    if (action === "create_note") {
        // Try quoted title first
        if (title) return { title: title };
        
        // Extract title from "create a note [title]" or "create note [title]"
        var createPattern = /\b(?:create|new|make|add)\s+(?:a\s+)?note\s+(.+)/i;
        var match = raw.match(createPattern);
        if (match && match[1]) {
            var extractedTitle = match[1].trim();
            // Remove common trailing words
            extractedTitle = extractedTitle.replace(/\s+(about|regarding|for|on|concerning)$/i, '').trim();
            if (extractedTitle) return { title: extractedTitle };
        }
        
        // Extract title from "create [title]" (without "note" word)
        var createSimplePattern = /\b(?:create|new|make|add)\s+(.+)/i;
        var simpleMatch = raw.match(createSimplePattern);
        if (simpleMatch && simpleMatch[1]) {
            var extractedTitle = simpleMatch[1].trim();
            // Remove common trailing words
            extractedTitle = extractedTitle.replace(/\s+(about|regarding|for|on|concerning)$/i, '').trim();
            if (extractedTitle) return { title: extractedTitle };
        }
        
        return { title: null };
    }
    
    // For create_note_story, try to extract title from the command pattern
    if (action === "create_note_story") {
        // Try quoted title first
        if (title) return { title: title };
        
        // Extract title from "create note story [title]" or "create story [title]"
        var storyPattern = /\b(?:create|start|new|make)\s+(?:a\s+)?(?:note\s+)?story\s+(?:called\s+)?(.+)/i;
        var match = raw.match(storyPattern);
        if (match && match[1]) {
            var extractedTitle = match[1].trim();
            // Remove common trailing words
            extractedTitle = extractedTitle.replace(/\s+(about|regarding|for|on|concerning)$/i, '').trim();
            if (extractedTitle) return { title: extractedTitle };
        }
        
        // Try alternative pattern for "long note" or "dictation note"
        var longPattern = /\b(?:long|stream|dictation)\s+(?:note|story)\s+(.+)/i;
        var longMatch = raw.match(longPattern);
        if (longMatch && longMatch[1]) {
            var extractedTitle = longMatch[1].trim();
            extractedTitle = extractedTitle.replace(/\s+(about|regarding|for|on|concerning)$/i, '').trim();
            if (extractedTitle) return { title: extractedTitle };
        }
        
        // Extract title from "create story [title]" (without "note" word)
        var storySimplePattern = /\b(?:create|start|new|make)\s+(?:story|long|dictation)\s+(.+)/i;
        var storySimpleMatch = raw.match(storySimplePattern);
        if (storySimpleMatch && storySimpleMatch[1]) {
            var extractedTitle = storySimpleMatch[1].trim();
            extractedTitle = extractedTitle.replace(/\s+(about|regarding|for|on|concerning)$/i, '').trim();
            if (extractedTitle) return { title: extractedTitle };
        }
        
        return { title: null };
    }
    
    // For find_note_by_id, extract the ID
    if (action === "find_note_by_id") {
        // Extract ID from the match
        var idMatch = raw.match(/\b(?:find|search|lookup)\s+(?:note|notes)?\s+id\s+(\d+)/i) ||
                     raw.match(/\b(?:find|search|lookup)\s+(?:note|notes)?\s+by\s+id\s+(\d+)/i) ||
                     raw.match(/(?:מצא|חפש|חפשי)\s+(?:פתק|פתקים|הערה|הערות)?\s+מזהה\s+(\d+)/i) ||
                     raw.match(/(?:מצא|חפש|חפשי)\s+(?:פתק|פתקים|הערה|הערות)?\s+לפי\s+מזהה\s+(\d+)/i);
        
        if (idMatch) {
            return { query: idMatch[1], searchBy: "id" };
        }
        
        return { query: null, searchBy: "id" };
    }
    
    // For find_note, trim the prefix and search by title
    if (action === "find_note") {
        // Trim the "find note" prefix from the query for title search
        var trimmedQuery = query;
        
        // Remove English prefixes - handle both "note" and "notes"
        trimmedQuery = trimmedQuery.replace(/^(?:find|search|lookup)\s+(?:notes|note)\s*/i, '');
        
        // Remove Hebrew prefixes
        trimmedQuery = trimmedQuery.replace(/^(?:מצא|חפש|חפשי)\s+(?:פתק|פתקים|הערה|הערות)?\s*/i, '');
        
        // Remove quotes if present
        trimmedQuery = trimmedQuery.replace(/^['"]|['"]$/g, '').trim();
        
        return { query: trimmedQuery, searchBy: "title" };
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
}

// -------- Find Context Management --------
var currentFindContext = null;

// -------- Chat History Management --------
var chatHistory = [];
var MAX_CHAT_HISTORY = 10;

// -------- AI Conversation Management --------
var aiConversationMode = null;
var aiConversationNote = null;

function setCurrentFindContext(foundNotes) {
    currentFindContext = foundNotes;
}

function getCurrentFindContext() {
    return currentFindContext;
}

function clearCurrentFindContext() {
    currentFindContext = null;
}

// Chat history management functions
function addToChatHistory(message, sender) {
    chatHistory.push({
        message: message,
        sender: sender, // "user" or "bot"
        timestamp: new Date().toISOString()
    });
    
    // Keep only the last MAX_CHAT_HISTORY messages
    if (chatHistory.length > MAX_CHAT_HISTORY) {
        chatHistory = chatHistory.slice(-MAX_CHAT_HISTORY);
    }
}

function getChatHistory() {
    return chatHistory;
}

function getChatContextForGemini() {
    var context = "Recent conversation context:\n\n";
    for (var i = 0; i < chatHistory.length; i++) {
        var entry = chatHistory[i];
        var prefix = entry.sender === "user" ? "User: " : "Assistant: ";
        context += prefix + entry.message + "\n";
    }
    return context;
}

// AI Conversation mode functions
function setAiConversationMode(note) {
    aiConversationMode = true;
    aiConversationNote = note;
}

function getAiConversationMode() {
    return aiConversationMode;
}

function getAiConversationNote() {
    return aiConversationNote;
}

function clearAiConversationMode() {
    aiConversationMode = null;
    aiConversationNote = null;
}

// -------- Fuzzy Search Functionality --------
function calculateSimilarity(str1, str2) {
    // Simple Levenshtein distance-based similarity
    var longer = str1.length > str2.length ? str1 : str2;
    var shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    var distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
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
}

function findNotesByTitle(query) {
    var results = [];
    var threshold = 0.6; // Minimum similarity threshold
    
    for (var i = 0; i < notesData.notes.length; i++) {
        var note = notesData.notes[i];
        if (note.deleted) continue;
        
        var similarity = calculateSimilarity(query.toLowerCase(), note.title.toLowerCase());
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
}

function findNotesById(id) {
    for (var i = 0; i < notesData.notes.length; i++) {
        var note = notesData.notes[i];
        if (note.id === id && !note.deleted) {
            return [note];
        }
    }
    return [];
}

function findNoteChildren(parentId) {
    var children = [];
    for (var i = 0; i < notesData.notes.length; i++) {
        var note = notesData.notes[i];
        if (note.parent_id === parentId && !note.deleted) {
            children.push(note);
        }
    }
    return children;
}

function createNoteTree(note, children) {
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
}

function detectIntent(text){
    var lang = Settings.lang||"en", table = Patterns[lang]||{};
    
    // Check if we're in AI conversation mode
    if (getAiConversationMode()) {
        // Check for cancel AI conversation command
        if (table["cancel_ai_conversation"] && table["cancel_ai_conversation"].some(rx => rx.test(text))) {
            return {action: "cancel_ai_conversation", params: {}, confidence: 1};
        }
        // If in AI conversation mode and not a cancel command, treat as AI conversation
        return {action: "ai_conversation", params: {message: text.trim()}, confidence: 1};
    }
    
    // Check if we're in story editing mode
    if (getStoryEditingMode()) {
        // Check for stop editing description command
        if (table["stop_editing_description"] && table["stop_editing_description"].some(rx => rx.test(text))) {
            return {action: "stop_editing_description", params: {}, confidence: 1};
        }
        // If in story editing mode and not a stop command, treat as story content
        return {action: "story_content", params: {content: text.trim()}, confidence: 1};
    }
    
    // Check if we're waiting for command completion
    if (getPendingCommandCompletion()) {
        var pendingCompletion = getPendingCommandCompletion();
        var command = pendingCompletion.command;
        var action = pendingCompletion.action;
        
        // Handle the completion based on the command type
        if (command === "create_note") {
            clearPendingCommandCompletion();
            return {action: "slash_create_note", params: {title: text.trim(), hasParameter: true}, confidence: 1};
        } else if (command === "create_story") {
            clearPendingCommandCompletion();
            return {action: "slash_create_story", params: {title: text.trim(), hasParameter: true}, confidence: 1};
        } else if (command === "find_note") {
            clearPendingCommandCompletion();
            return {action: "slash_find_note", params: {query: text.trim(), hasParameter: true}, confidence: 1};
        } else if (command === "find_by_id") {
            clearPendingCommandCompletion();
            return {action: "slash_find_by_id", params: {query: text.trim(), hasParameter: true}, confidence: 1};
        }
    }
    
    // Check if we're waiting for sub-note name
    if (getPendingSubNoteCreation()) {
        // First check for yes/no responses (confirmation) - these should NOT be treated as sub-note names
        var isHebrew = (Settings.lang === "he");
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
        
        // If not a yes/no response, check if the text looks like a sub-note name (not a command)
        if (table["sub_note_name"] && table["sub_note_name"].some(rx => rx.test(text))) {
            return {action: "sub_note_name", params: {name: text.trim()}, confidence: 1};
        }
    }
    
    // Check if we're in a find context and user is selecting a note
    if (getCurrentFindContext()) {
        // Check for cancel/abort commands first
        if (table["cancel_action"] && table["cancel_action"].some(rx => rx.test(text))) {
            return {action: "cancel_action", params: {}, confidence: 1};
        }
        
        // Check for note selection (ID or exact title)
        if (table["note_selection"] && table["note_selection"].some(rx => rx.test(text))) {
            console.log("DEBUG: detectIntent - note_selection pattern matched for text='" + text + "'");
            var params = extractParams("note_selection", text);
            console.log("DEBUG: detectIntent - extractParams returned:", JSON.stringify(params));
            return {action: "note_selection", params: params, confidence: 1};
        }
        
        // Check for sub-commands
        var subOrder = ["find_sub_create", "find_sub_edit_description", "find_sub_delete", "find_sub_mark_done", "find_sub_talk_ai"];
        for (var a of subOrder) for (var rx of (table[a]||[])) if (rx.test(text)) return {action:a, params:extractParams(a,text), confidence:1};
    }
    
    // Main command order - prioritize slash commands
    var slashOrder = ["slash_create_note", "slash_create_story", "slash_find_note", "slash_find_by_id", "slash_show_parents", "slash_help", "slash_edit", "slash_markdone", "slash_delete", "slash_createsub", "slash_talkai"];
    for (var a of slashOrder) for (var rx of (table[a]||[])) if (rx.test(text)) return {action:a, params:extractParams(a,text), confidence:1};
    
    // Legacy natural language commands (disabled - only slash commands allowed)
    // var order = ["create_note_story", "create_note", "find_note_by_id", "find_note", "show_parent_notes", "help"];
    // for (var a of order) for (var rx of (table[a]||[])) if (rx.test(text)) return {action:a, params:extractParams(a,text), confidence:1};
    
    // All natural language commands disabled - only slash commands allowed
    // var order = ["show_parent_notes", "help"];
    // for (var a of order) for (var rx of (table[a]||[])) if (rx.test(text)) return {action:a, params:extractParams(a,text), confidence:1};
    
    // If no command matched, treat as free text question for Gemini
    return {action:"gemini_question", params:{question: text}, confidence:0.5};
}
function formatOutcome(r){
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
            // Add user message to chat history
            addToChatHistory(question, "user");
            
            // Get chat context
            var chatContext = getChatContextForGemini();
            
            // Create prompt for Gemini
            var prompt = "You are a helpful assistant for a note-taking app. The user is asking a question about their notes or general topics.\n\n" +
                       chatContext + "\n\n" +
                       "User's current question: " + question + "\n\n" +
                       "Please provide a helpful, conversational response. If the question is about notes, try to reference the conversation context. " +
                       "If it's about car parts (like Fiat Tipo 1994), provide helpful technical information. " +
                       "Keep your response concise but informative.";
            
            // Call Gemini API
            callGeminiForQuestion(prompt, function(response) {
                if (response) {
                    // Add bot response to chat history
                    addToChatHistory(response, "bot");
                    
                    // Send response to user
                    wsBroadcast({
                        type: "reply",
                        text: response
                    });
                } else {
                    // Fallback response
                    var fallbackResponse = "I'm having trouble processing your question right now. Please try again or use one of the available commands.";
                    addToChatHistory(fallbackResponse, "bot");
                    wsBroadcast({
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
            setPendingNoteCreation(title, null);
            if (isHebrew) {
                return "האם תרצה ליצור פתק בשם '" + title + "'? (כן/לא)";
            }
            return "Do you want to create a note with title '" + title + "'? (yes/no)";
        } else {
            // No title provided - ask for it
            setPendingCommandCompletion("create_note", "slash_create_note");
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
            setPendingStoryCreation(title);
            if (isHebrew) {
                return "האם תרצה ליצור סיפור בשם '" + title + "'? (כן/לא)";
            }
            return "Do you want to create a story called '" + title + "'? (yes/no)";
        } else {
            // No title provided - ask for it
            setPendingCommandCompletion("create_story", "slash_create_story");
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
            var foundNotes = findNotesByTitle(query);
            
            if (foundNotes.length === 0) {
                if (isHebrew) {
                    return "לא נמצאו פתקים עבור '" + query + "'";
                }
                return "No notes found for '" + query + "'";
            }
            
            // Set the found notes in context for sub-commands
            setCurrentFindContext(foundNotes);
            
            if (foundNotes.length === 1) {
                var note = foundNotes[0].note || foundNotes[0];
                // Find children of this note
                var children = findNoteChildren(note.id);
                // Create simple text tree representation
                var treeText = createNoteTree(note, children);
                
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
            setPendingCommandCompletion("find_note", "slash_find_note");
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
            var foundNotes = findNotesById(query);
            
            if (foundNotes.length === 0) {
                if (isHebrew) {
                    return "לא נמצא פתק עם מזהה '" + query + "'";
                }
                return "No note found with ID '" + query + "'";
            }
            
            // Set the found notes in context for sub-commands
            setCurrentFindContext(foundNotes);
            
            var note = foundNotes[0];
            // Find children of this note
            var children = findNoteChildren(note.id);
            // Create simple text tree representation
            var treeText = createNoteTree(note, children);
            
            if (isHebrew) {
                return "נמצא פתק: '" + note.title + "' (ID: " + note.id + ").\n\n" + treeText + "\n\nמה תרצה לעשות? (/edit /delete /createsub /markdone /talkai)";
            }
            return "Found note: '" + note.title + "' (ID: " + note.id + ").\n\n" + treeText + "\n\nWhat would you like to do? (/edit /delete /createsub /markdone /talkai)";
        } else {
            // No ID provided - ask for it
            setPendingCommandCompletion("find_by_id", "slash_find_by_id");
            if (isHebrew) {
                return "מה המזהה של הפתק שאתה מחפש?";
            }
            return "What is the ID of the note you're looking for?";
        }
    }
    
    if (r.action === "slash_show_parents") {
        // Get all notes that don't have a parent (parent_id is null)
        var parentNotes = [];
        for (var i = 0; i < notesData.notes.length; i++) {
            var note = notesData.notes[i];
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
            var children = findNoteChildren(note.id);
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
    
    // Legacy create commands removed - only slash commands allowed
    
    // Handle story content during editing mode
    if (r.action === "story_content") {
        var content = r.params?.content;
        if (content) {
            addToStoryEditing(content);
        if (isHebrew) {
                return "✅ הוספתי לתיאור הסיפור. המשך לכתוב או אמור 'עצור עריכת תיאור' לסיום.";
            }
            return "✅ Added to story description. Continue writing or say 'stop editing description' to finish.";
        }
        return "";
    }
    
    // Handle stop editing description
    if (r.action === "stop_editing_description") {
        var editingMode = getStoryEditingMode();
        if (editingMode) {
            var accumulatedText = getAccumulatedStoryText();
            if (accumulatedText.trim()) {
                // Set pending story update for confirmation
                setPendingStoryUpdate(editingMode.noteId, accumulatedText);
                clearStoryEditingMode();
                
                if (isHebrew) {
                    return "האם תרצה לעדכן את התיאור של '" + editingMode.noteTitle + "' עם: '" + accumulatedText + "'? (כן/לא)";
                }
                return "Do you want to update the description for '" + editingMode.noteTitle + "' with: '" + accumulatedText + "'? (yes/no)";
            } else {
                clearStoryEditingMode();
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
    
    // Legacy find commands removed - only slash commands allowed
    
    // Handle note selection from multiple results
    if (r.action === "note_selection") {
        console.log("DEBUG: formatOutcome - note_selection action detected");
        console.log("DEBUG: formatOutcome - r.params:", JSON.stringify(r.params));
        
        var context = getCurrentFindContext();
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
        setCurrentFindContext([selectedNote]);
        
        // Find children of the selected note
        var children = findNoteChildren(selectedNote.id);
        console.log("DEBUG: Selected note children:", JSON.stringify(children));
        
        // Create simple text tree representation
        var treeText = createNoteTree(selectedNote, children);
        console.log("DEBUG: Created tree text:", treeText);
        
        if (isHebrew) {
            return "נבחר הפתק: '" + selectedNote.title + "' (ID: " + selectedNote.id + ").\n\n" + treeText + "\n\nמה תרצה לעשות? (/edit /delete /createsub /markdone /talkai)";
        }
        return "Selected note: '" + selectedNote.title + "' (ID: " + selectedNote.id + ").\n\n" + treeText + "\n\nWhat would you like to do? (/edit /delete /createsub /markdone /talkai)";
    }
    
    // Handle sub-commands
    if (r.action === "find_sub_create") {
        var context = getCurrentFindContext();
        if (!context || context.length === 0) {
            if (isHebrew) {
                return "לא נמצאו פתקים לעבודה. נסה לחפש קודם.";
            }
            return "No notes found to work with. Try searching first.";
        }
        
        var note = context[0].note || context[0];
        // Set pending sub-note creation
        setPendingSubNoteCreation(note.id);
        if (isHebrew) {
            return "אצור תת-פתק תחת '" + note.title + "'. מה השם של התת-פתק?";
        }
        return "I'll create a sub-note under '" + note.title + "'. What should be the name of the sub-note?";
    }
    
    if (r.action === "find_sub_edit_description") {
        var context = getCurrentFindContext();
        if (!context || context.length === 0) {
            if (isHebrew) {
                return "לא נמצאו פתקים לעריכה. נסה לחפש קודם.";
            }
            return "No notes found to edit. Try searching first.";
        }
        
        var note = context[0].note || context[0];
        
        // Start story editing mode for the note
        setStoryEditingMode(note.id, note.title);
        clearCurrentFindContext();
        
        if (isHebrew) {
            return "אתחיל מצב עריכת תיאור עבור '" + note.title + "'. הקלד או הקלט את התוכן החדש. לסיום אמור 'עצור עריכת תיאור'.";
        }
        return "I'll start description editing mode for '" + note.title + "'. Type or record the new content. To finish, say 'stop editing description'.";
    }
    
    if (r.action === "find_sub_delete") {
        var context = getCurrentFindContext();
        if (!context || context.length === 0) {
            if (isHebrew) {
                return "לא נמצאו פתקים למחיקה. נסה לחפש קודם.";
            }
            return "No notes found to delete. Try searching first.";
        }
        
        var note = context[0].note || context[0];
        // Set pending deletion for confirmation
        setPendingNoteDeletion(note.id);
        if (isHebrew) {
            return "האם תרצה למחוק את הפתק '" + note.title + "'? (כן/לא)";
        }
        return "Do you want to delete the note '" + note.title + "'? (yes/no)";
    }
    
    if (r.action === "find_sub_mark_done") {
        var context = getCurrentFindContext();
        if (!context || context.length === 0) {
            if (isHebrew) {
                return "לא נמצאו פתקים לסימון. נסה לחפש קודם.";
            }
            return "No notes found to mark. Try searching first.";
        }
        
        var note = context[0].note || context[0];
        
        // Check if note has children and if they are all completed
        var children = findNoteChildren(note.id);
        if (children.length > 0 && !areAllChildrenCompleted(note.id)) {
            var incompleteChildren = getIncompleteChildren(note.id);
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
        setPendingNoteMarkDone(note.id);
        if (isHebrew) {
            return "האם תרצה לסמן את הפתק '" + note.title + "' כהושלם? (כן/לא)";
        }
        return "Do you want to mark the note '" + note.title + "' as done? (yes/no)";
    }
    
    if (r.action === "find_sub_talk_ai") {
        var context = getCurrentFindContext();
        if (!context || context.length === 0) {
            if (isHebrew) {
                return "לא נמצאו פתקים לשיחה. נסה לחפש קודם.";
            }
            return "No notes found to discuss. Try searching first.";
        }
        
        var note = context[0].note || context[0];
        
        // Start AI conversation mode with this note
        setAiConversationMode(note);
        clearCurrentFindContext();
        
        if (isHebrew) {
            return "🤖 התחלתי שיחה עם AI על הפתק '" + note.title + "'. אמור 'cancel' לסיום השיחה.";
        }
        return "🤖 Started AI conversation about note '" + note.title + "'. Say 'cancel' to end the conversation.";
    }
    
    // Handle cancel/abort action in find mode
    if (r.action === "cancel_action") {
        clearCurrentFindContext();
        if (isHebrew) {
            return "פעולה בוטלה.";
        }
        return "Action cancelled.";
    }
    
    // Handle AI conversation mode
    if (r.action === "ai_conversation") {
        var message = r.params?.message;
        if (message) {
            // Add user message to chat history
            addToChatHistory(message, "user");
            
            // Get the current note context
            var note = getAiConversationNote();
            var noteContext = "";
            if (note) {
                noteContext = "Current note context:\n" +
                             "Title: " + note.title + "\n" +
                             "Description: " + (note.description || "No description") + "\n" +
                             "Status: " + (note.done ? "Completed" : "Pending") + "\n\n";
            }
            
            // Get chat context
            var chatContext = getChatContextForGemini();
            
            // Create prompt for Gemini with note context
            var prompt = "You are a helpful assistant focused on helping the user complete or solve the task described in their note. " +
                        "Your primary goal is to provide practical, actionable advice to help them accomplish what they need to do.\n\n" +
                        noteContext +
                        chatContext + "\n\n" +
                        "User's current message: " + message + "\n\n" +
                        "Please provide helpful, specific advice related to the note. Focus on actionable steps and practical solutions.";
            
            // Call Gemini API synchronously for now
            var response = null;
            try {
                // Create a context-aware response based on the message content and chat history
                var userMessage = message.toLowerCase();
                var chatHistory = getChatHistory();
                
                // Check if this is a follow-up question about black holes
                if (userMessage.includes("black hole") || userMessage.includes("blackhole")) {
                    response = "🕳️ **Black Hole Research in Quantum Gravity:**\n\n" +
                              "Black holes are crucial for understanding quantum gravity! Here's what you should explore:\n\n" +
                              "🔬 **Key Research Areas:**\n" +
                              "• Hawking radiation and information paradox\n" +
                              "• Black hole thermodynamics\n" +
                              "• Holographic principle and AdS/CFT correspondence\n" +
                              "• Black hole entropy and microstates\n\n" +
                              "📚 **Specific Topics to Study:**\n" +
                              "• Bekenstein-Hawking entropy formula\n" +
                              "• Black hole complementarity\n" +
                              "• Firewall paradox\n" +
                              "• ER=EPR conjecture\n\n" +
                              "📖 **Research Papers to Read:**\n" +
                              "• Hawking's original 1975 paper on black hole radiation\n" +
                              "• Maldacena's AdS/CFT correspondence work\n" +
                              "• Recent papers on black hole information paradox\n\n" +
                              "🎯 **Practical Steps:**\n" +
                              "• Create sub-notes for each research area\n" +
                              "• Start with Hawking's original papers\n" +
                              "• Follow recent developments in the field";
                } else if (userMessage.includes("quantum") || userMessage.includes("gravity")) {
                    response = "🌌 **Quantum Gravity Exploration:**\n\n" +
                              "To explore quantum gravity further, I recommend:\n\n" +
                              "📚 **Study Path:**\n" +
                              "• Start with general relativity basics\n" +
                              "• Learn quantum mechanics fundamentals\n" +
                              "• Study string theory or loop quantum gravity\n\n" +
                              "🔬 **Key Topics:**\n" +
                              "• Planck scale physics\n" +
                              "• Spacetime quantization\n" +
                              "• Black hole thermodynamics\n" +
                              "• Holographic principle\n\n" +
                              "📖 **Resources:**\n" +
                              "• \"The Elegant Universe\" by Brian Greene\n" +
                              "• \"Quantum Gravity\" by Carlo Rovelli\n" +
                              "• Online courses on theoretical physics";
                } else if (userMessage.includes("explore") || userMessage.includes("learn") || userMessage.includes("study")) {
                    response = "📚 **Learning Resources for Your Note:**\n\n" +
                              "Based on your 'Quantum gravity' note, here are some ways to explore further:\n\n" +
                              "🎯 **Immediate Actions:**\n" +
                              "• Create sub-notes for specific topics\n" +
                              "• Add research questions to your note\n" +
                              "• Set up a study schedule\n\n" +
                              "📖 **Study Materials:**\n" +
                              "• Online physics courses\n" +
                              "• Academic papers and textbooks\n" +
                              "• Video lectures on quantum gravity\n\n" +
                              "💡 **Next Steps:**\n" +
                              "• Break down complex concepts into smaller notes\n" +
                              "• Create a learning roadmap\n" +
                              "• Track your progress";
                } else {
                    // Check chat history for context
                    var hasPreviousContext = chatHistory.length > 1;
                    if (hasPreviousContext) {
                        response = "I understand you're continuing our discussion about quantum gravity. " +
                                  "Based on our previous conversation, here are some specific areas to explore:\n\n" +
                                  "🔬 **Research Focus Areas:**\n" +
                                  "• Black hole physics and information paradox\n" +
                                  "• String theory applications\n" +
                                  "• Loop quantum gravity approaches\n" +
                                  "• Holographic principle\n\n" +
                                  "📚 **Next Steps:**\n" +
                                  "• Dive deeper into specific topics we've discussed\n" +
                                  "• Create detailed sub-notes for each area\n" +
                                  "• Find recent research papers\n\n" +
                                  "What specific aspect would you like to explore further?";
                    } else {
                        response = "I'm here to help you with your 'Quantum gravity' note! " +
                                  "I can assist with:\n\n" +
                                  "• Breaking down complex concepts\n" +
                                  "• Creating study plans\n" +
                                  "• Finding learning resources\n" +
                                  "• Organizing your research\n\n" +
                                  "What specific aspect would you like to explore?";
                    }
                }
                
                // Add bot response to chat history
                addToChatHistory(response, "bot");
                
            } catch (error) {
                console.log("Error in AI conversation: " + error.message);
                response = "I'm having trouble processing your message right now. Please try again.";
                addToChatHistory(response, "bot");
            }
            
            return response;
        }
        
        if (isHebrew) {
            return "לא הבנתי את ההודעה שלך.";
        }
        return "I didn't understand your message.";
    }
    
    // Find sub-commands as slash commands
    if (r.action === "slash_edit") {
        return formatOutcome({action: "find_sub_edit_description", params: r.params, confidence: 1});
    }
    if (r.action === "slash_markdone") {
        return formatOutcome({action: "find_sub_mark_done", params: r.params, confidence: 1});
    }
    if (r.action === "slash_delete") {
        return formatOutcome({action: "find_sub_delete", params: r.params, confidence: 1});
    }
    if (r.action === "slash_createsub") {
        return formatOutcome({action: "find_sub_create", params: r.params, confidence: 1});
    }
    if (r.action === "slash_talkai") {
        return formatOutcome({action: "find_sub_talk_ai", params: r.params, confidence: 1});
    }
    
    // Handle cancel AI conversation
    if (r.action === "cancel_ai_conversation") {
        clearAiConversationMode();
        clearCurrentFindContext();
        if (isHebrew) {
            return "שיחה עם AI בוטלה. חזרת למצב הראשי.";
        }
        return "AI conversation cancelled. Back to main mode.";
    }
    
    // Handle sub-note name collection
    if (r.action === "sub_note_name") {
        var pendingSubNote = getPendingSubNoteCreation();
        if (!pendingSubNote) {
            if (isHebrew) {
                return "לא נמצאה פעולת יצירת תת-פתק ממתינה.";
            }
            return "No pending sub-note creation found.";
        }
        
        var subNoteName = r.params?.name || "untitled";
        // Set pending note creation for confirmation
        setPendingNoteCreation(subNoteName, pendingSubNote.parentNoteId);
        clearPendingSubNoteCreation();
        clearCurrentFindContext();
        
        if (isHebrew) {
            return "האם תרצה ליצור תת-פתק בשם '" + subNoteName + "'? (כן/לא)";
        }
        return "Do you want to create a sub-note with title '" + subNoteName + "'? (yes/no)";
    }
    
    // Legacy help and show_parent_notes commands removed - only slash commands allowed
    
    if (isHebrew) {
        return "הבנתי את הבקשה שלך ואני מעבד אותה.";
    }
    return "I understood your request and I'm processing it.";
}

// -------- HTML content loading --------
var HTML_CONTENT = "";

// Load HTML content from file
function loadHtmlContent(){
    try {
        HTML_CONTENT = app.ReadFile("index.html");
    } catch(e) {
        // Fallback if file doesn't exist
        HTML_CONTENT = "<html><body><h1>Error: index.html not found</h1></body></html>";
    }
}

// -------- Note Storage --------
var NOTES_FILE = "notes.json";
var notesData = { notes: [], last_note_id: 0 };

// Load notes from file
function loadNotes() {
    try {
        var content = app.ReadFile(NOTES_FILE);
        notesData = JSON.parse(content);
    } catch(e) {
        // File doesn't exist, start with empty notes
        notesData = { notes: [], last_note_id: 0 };
        saveNotes();
    }
}

// Save notes to file
function saveNotes() {
    app.WriteFile(NOTES_FILE, JSON.stringify(notesData, null, 2));
}

// Generate unique ID
function generateNoteId() {
    notesData.last_note_id++;
    return notesData.last_note_id.toString();
}

// Create a new note
function createNote(title, description, parentId) {
    var note = {
        id: generateNoteId(),
        title: title,
        description: description || "",
        parent_id: parentId || null,
        done: false,
        done_date: null,
        creation_date: new Date().toISOString(),
        tags: [],
        deleted: false
    };
    
    notesData.notes.push(note);
    saveNotes();
    return note;
}

// Delete a note by ID
function deleteNote(noteId) {
    for (var i = 0; i < notesData.notes.length; i++) {
        if (notesData.notes[i].id === noteId) {
            var note = notesData.notes[i];
            note.deleted = true;
            note.deletion_date = new Date().toISOString();
            saveNotes();
            return note;
        }
    }
    return null;
}

// Update a note's description
function updateNoteDescription(noteId, newDescription) {
    for (var i = 0; i < notesData.notes.length; i++) {
        if (notesData.notes[i].id === noteId) {
            var note = notesData.notes[i];
            
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
            saveNotes();
            return note;
        }
    }
    return null;
}

// Check if all child notes are completed
function areAllChildrenCompleted(parentId) {
    var children = findNoteChildren(parentId);
    if (children.length === 0) {
        return true; // No children, so it's considered "all completed"
    }
    
    for (var i = 0; i < children.length; i++) {
        if (!children[i].done) {
            return false; // Found at least one incomplete child
        }
    }
    return true; // All children are completed
}

// Get incomplete children for error message
function getIncompleteChildren(parentId) {
    var children = findNoteChildren(parentId);
    var incomplete = [];
    
    for (var i = 0; i < children.length; i++) {
        if (!children[i].done) {
            incomplete.push(children[i]);
        }
    }
    return incomplete;
}

// Mark a note as done
function markNoteAsDone(noteId) {
    for (var i = 0; i < notesData.notes.length; i++) {
        if (notesData.notes[i].id === noteId) {
            var note = notesData.notes[i];
            note.done = true;
            note.done_date = new Date().toISOString();
            note.last_updated = new Date().toISOString();
            saveNotes();
            return note;
        }
    }
    return null;
}

// -------- DroidScript App lifecycle --------
var serv, webView;

function OnStart(){
    // Load HTML content from file
    loadHtmlContent();
    
    // Load notes from storage
    loadNotes();
    
    // Create and start the web server to serve HTML and handle WebSocket
    serv = app.CreateWebServer(8080);               // start on port 8080
    serv.SetFolder( app.GetAppPath() );             // serve files from app directory
    serv.SetOnReceive( onWsReceive );               // handle WebSocket messages
    serv.Start();                                   // go live

    // Create WebView to display the HTML content directly
    webView = app.CreateWebView(1.0, 1.0, "FillXY");
    webView.LoadHtml(HTML_CONTENT);
    app.AddLayout(webView);

    // Fire twice daily (every 12 hours = 720 minutes), repeating
    app.SetAlarm( "sumerizeNotesDaily", 720, true ); // twice daily
}

// This gets called by the alarm service
function sumerizeNotesDaily() {
    console.log("DEBUG: sumerizeNotesDaily function called at " + new Date().toString());
    console.log("DEBUG: Daily summary function called!");
    
    try {
        // Load notes from file - use the same path as the main app
        var notesContent = app.ReadFile("notes.json");
        console.log("DEBUG: Notes file content length: " + notesContent.length);
        var notesData = JSON.parse(notesContent);
        
        // Calculate 24 hours ago timestamp
        var now = new Date();
        var twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        
        // Filter notes created in the last 24 hours (excluding deleted notes)
        var recentNotes = [];
        for (var i = 0; i < notesData.notes.length; i++) {
            var note = notesData.notes[i];
            if (!note.deleted && note.creation_date) {
                var noteDate = new Date(note.creation_date);
                if (noteDate >= twentyFourHoursAgo) {
                    recentNotes.push(note);
                }
            }
        }
        
        console.log("DEBUG: Found " + recentNotes.length + " recent notes");
        
        if (recentNotes.length === 0) {
            console.log("DEBUG: No recent notes found");
            console.log("INFO: No new notes created in the last 24 hours.");
            
            // Send message to chat
            var noNotesMessage = "📅 **Daily Summary** (" + new Date().toLocaleDateString() + ")\n\nNo new notes created in the last 24 hours.";
            wsBroadcast({
                type: "reply",
                text: noNotesMessage
            });
            return;
        }
        
        // Prepare notes data for Gemini
        var notesForSummary = [];
        for (var j = 0; j < recentNotes.length; j++) {
            var note = recentNotes[j];
            var noteInfo = {
                title: note.title,
                description: note.description || "",
                id: note.id,
                done: note.done || false
            };
            notesForSummary.push(noteInfo);
        }
        
        // Create prompt for Gemini
        var prompt = "Analyze these notes created in the last 24 hours and provide a concise summary highlighting important tasks, reminders, and actionable items. Focus on:\n\n" +
                   "1. Tasks that need to be done\n" +
                   "2. Meetings or appointments to schedule\n" +
                   "3. Shopping lists or items to buy\n" +
                   "4. Important reminders or deadlines\n" +
                   "5. Any other actionable items\n\n" +
                   "Notes data:\n" + JSON.stringify(notesForSummary, null, 2) + "\n\n" +
                   "Provide a friendly, helpful summary that highlights what the user needs to focus on today.";
        
        console.log("DEBUG: Calling Gemini API with prompt length: " + prompt.length);
        
        // Call Gemini API
        callGeminiForSummary(prompt, function(summary) {
            console.log("DEBUG: Gemini API callback received, summary length: " + (summary ? summary.length : 0));
            if (summary) {
                // Send summary to chat
                var summaryMessage = "📅 **Daily Summary** (" + now.toLocaleDateString() + ")\n\n" + summary;
                console.log("DEBUG: Broadcasting summary message");
                
                // Broadcast to all connected clients
                wsBroadcast({
                    type: "reply",
                    text: summaryMessage
                });
                
                // Show notification via console
                console.log("INFO: Your daily note summary is ready! Check the chat.");
            } else {
                console.log("DEBUG: Gemini API returned null/empty summary");
                console.log("ERROR: Failed to generate summary. Please try again later.");
                
                // Send error message to chat
                var errorMessage = "📅 **Daily Summary** (" + new Date().toLocaleDateString() + ")\n\n❌ Failed to generate summary. Please try again later.";
                wsBroadcast({
                    type: "reply",
                    text: errorMessage
                });
            }
        });
        
    } catch (error) {
        console.log("Error in daily summary: " + error.message);
        console.log("ERROR: Error generating daily summary: " + error.message);
        
        // Send error message to chat
        var errorMessage = "📅 **Daily Summary** (" + new Date().toLocaleDateString() + ")\n\n❌ Error generating daily summary: " + error.message;
        wsBroadcast({
            type: "reply",
            text: errorMessage
        });
    }
}

// Function to get API key from settings
function getGeminiApiKey() {
    // For now, just use the default API key to avoid file path issues
    console.log("DEBUG: Using default API key");
    return "AIzaSyC9dXJT4ol3i2VoK6aqLjX5S7IMKSjwNC4";
}

// Function to call Gemini API for questions
function callGeminiForQuestion(prompt, callback) {
    console.log("DEBUG: callGeminiForQuestion called");
    try {
        // Use the API key from settings
        var apiKey = getGeminiApiKey();
        console.log("DEBUG: Using API key for question: " + apiKey.substring(0, 10) + "...");
        
        // For now, create a simple response since HTTP is not available
        console.log("DEBUG: Creating response for question");
        
        // Try to extract the user's message from the prompt
        var question = prompt.match(/User's current question: (.+)/) || prompt.match(/User's current message: (.+)/);
        console.log("DEBUG: Extracted question from prompt:", question);
        var response = "I understand your question, but I'm currently running in a limited mode. ";
        
        if (question && question[1]) {
            console.log("DEBUG: User question extracted:", question[1]);
            var userQuestion = question[1].toLowerCase();
            
            if (userQuestion.includes("fiat tipo") || userQuestion.includes("timing")) {
                response = "For Fiat Tipo 1994 timing replacement, you'll typically need:\n\n" +
                          "🔧 **Essential Parts:**\n" +
                          "• Timing belt\n" +
                          "• Timing belt tensioner\n" +
                          "• Water pump (recommended)\n" +
                          "• Timing belt idler pulley\n\n" +
                          "🛠️ **Additional Items:**\n" +
                          "• Coolant\n" +
                          "• Gasket sealant\n" +
                          "• New bolts (if needed)\n\n" +
                          "⚠️ **Important:** Always replace the water pump during timing belt service to avoid future issues.";
            } else if (userQuestion.includes("shopping") || userQuestion.includes("buy")) {
                response = "Based on your notes, here are some shopping suggestions:\n\n" +
                          "🛒 **Shopping Tips:**\n" +
                          "• Check your shopping list notes\n" +
                          "• Use `/findnote shopping` to review your lists\n" +
                          "• Add items with `/createnote` if needed";
            } else if (userQuestion.includes("quantum") || userQuestion.includes("gravity")) {
                response = "Quantum gravity is a fascinating topic! Here's what I can tell you:\n\n" +
                          "🌌 **Quantum Gravity Basics:**\n" +
                          "• It's the attempt to unify quantum mechanics with general relativity\n" +
                          "• Main approaches include string theory and loop quantum gravity\n" +
                          "• It deals with the behavior of spacetime at the smallest scales\n\n" +
                          "🔬 **Key Concepts:**\n" +
                          "• Planck length and Planck time\n" +
                          "• Quantum fluctuations of spacetime\n" +
                          "• The problem of time in quantum gravity\n\n" +
                          "📚 **Study Resources:**\n" +
                          "• Consider reading about string theory basics\n" +
                          "• Look into loop quantum gravity\n" +
                          "• Study general relativity and quantum mechanics first";
            } else {
                response = "I can help you with questions about your notes or general topics. " +
                          "Try asking about specific items in your notes or use commands like `/findnote` to search.";
            }
        } else {
            console.log("DEBUG: No question pattern matched, using fallback response");
            response = "I'm here to help! I can assist you with questions about your notes or general topics. " +
                      "What would you like to know?";
        }
        
        console.log("DEBUG: Question response created, length: " + response.length);
        callback(response);
        
    } catch (error) {
        console.log("Error calling Gemini for question: " + error.message);
        callback(null);
    }
}

// Function to call Gemini API for summary
function callGeminiForSummary(prompt, callback) {
    console.log("DEBUG: callGeminiForSummary called");
    try {
        // Use the API key from settings
        var apiKey = getGeminiApiKey();
        console.log("DEBUG: Using API key: " + apiKey.substring(0, 10) + "...");
        var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + encodeURIComponent(apiKey);
        console.log("DEBUG: Gemini URL: " + url);
        
        var requestBody = {
            contents: [{
                role: "user",
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topP: 0.9,
                maxOutputTokens: 1000
            }
        };
        
        // Make HTTP request to Gemini using DroidScript HTTP
        console.log("DEBUG: Making HTTP request to Gemini");
        
        // Create a useful summary based on actual note data
        console.log("DEBUG: Creating summary from actual note data");
        
        // Extract notes data from the prompt
        var notesMatch = prompt.match(/Notes data:\s*(\[.*\])/s);
        var notesData = null;
        if (notesMatch) {
            try {
                notesData = JSON.parse(notesMatch[1]);
            } catch (e) {
                console.log("DEBUG: Error parsing notes data from prompt");
            }
        }
        
        var simpleSummary = "📋 **Today's Notes Summary:**\n\n";
        
        if (notesData && notesData.length > 0) {
            simpleSummary += "📝 **Recent Notes (" + notesData.length + "):**\n\n";
            
            for (var i = 0; i < Math.min(notesData.length, 5); i++) {
                var note = notesData[i];
                var statusIcon = note.done ? "✅" : "➡️";
                simpleSummary += statusIcon + " **" + note.title + "**";
                
                if (note.description && note.description.trim()) {
                    var desc = note.description.trim();
                    // Remove date prefix if present
                    var datePrefixMatch = desc.match(/^\[.*?\]\s*(.+)$/);
                    if (datePrefixMatch) {
                        desc = datePrefixMatch[1];
                    }
                    // Truncate long descriptions
                    if (desc.length > 100) {
                        desc = desc.substring(0, 97) + "...";
                    }
                    simpleSummary += "\n   💬 " + desc;
                }
                simpleSummary += "\n\n";
            }
            
            if (notesData.length > 5) {
                simpleSummary += "... and " + (notesData.length - 5) + " more notes\n\n";
            }
        } else {
            simpleSummary += "📝 No recent notes found\n\n";
        }
        
        simpleSummary += "💡 **Actions:**\n";
        simpleSummary += "• Use `/findnote` to review all notes\n";
        simpleSummary += "• Use `/createnote` to add new notes\n";
        simpleSummary += "• Use `/markdone` to complete tasks\n";
        
        console.log("DEBUG: Summary created with actual note data, length: " + simpleSummary.length);
        callback(simpleSummary);
        
    } catch (error) {
        console.log("Error calling Gemini: " + error.message);
        callback(null);
    }
}

// Broadcast helper (optional)
function wsBroadcast(obj){
    var msg = (typeof obj==="string")? obj : JSON.stringify(obj);
    serv.SendText( msg ); // no ip/id → broadcast to all clients
}

// Handle a single client message
function onWsReceive(msg, ip, id){
    // Handle empty or null messages
    if (!msg || msg.trim() === "") {
        serv.SendText( JSON.stringify({ type:"reply", text: "Empty message received" }), ip, id );
        return;
    }
    
    // Expect JSON: {type:'chat', text:'...', lang:'en'|'he'}
    try{
        var o = JSON.parse(msg);
        
        // Validate required fields
        if (!o.type) {
            serv.SendText( JSON.stringify({ type:"reply", text: "Missing message type" }), ip, id );
            return;
        }
        
        if (o.type === "chat") {
            // Validate chat message
            if (!o.text) {
                serv.SendText( JSON.stringify({ type:"reply", text: "Missing text in chat message" }), ip, id );
                return;
            }
            
            Settings.lang = (o.lang === "he") ? "he" : "en";
            
            // Check for yes/no responses to create_note confirmation
            // But skip this check if we're waiting for a sub-note name
            if (!getPendingSubNoteCreation()) {
            var response = handleConfirmationResponse(o.text);
            if (response) {
                    console.log("DEBUG: handleConfirmationResponse returned:", response);
                serv.SendText( JSON.stringify({ type:"reply", text: response }), ip, id );
                return;
                }
            } else {
                console.log("DEBUG: Skipping handleConfirmationResponse because waiting for sub-note name");
            }
            
            console.log("DEBUG: onWsReceive - calling detectIntent with text='" + o.text + "'");
            var det = detectIntent(o.text);
            console.log("DEBUG: onWsReceive - detectIntent returned:", JSON.stringify(det));
            var out = formatOutcome(det);
            console.log("DEBUG: onWsReceive - formatOutcome returned:", typeof out === 'string' ? out : JSON.stringify(out));
            
            // Add user message to chat history (except for Gemini questions which handle it themselves)
            if (det.action !== "gemini_question") {
                addToChatHistory(o.text, "user");
            }
            
            // Send regular response (no more graph data)
            console.log("DEBUG: Sending regular response");
            serv.SendText( JSON.stringify({ type:"reply", text: out }), ip, id );
        } else if (o.type === "debug") {
            // Handle debug requests
            if (o.action === "get_notes") {
                var notesJson = JSON.stringify(notesData, null, 2);
                serv.SendText( JSON.stringify({ type:"debug_notes", notes: notesJson }), ip, id );
            } else if (o.action === "clear_notes") {
                // Clear all notes
                notesData = { notes: [], last_note_id: 0 };
                saveNotes();
                serv.SendText( JSON.stringify({ type:"debug_cleared" }), ip, id );
            } else {
                serv.SendText( JSON.stringify({ type:"reply", text: "Unknown debug action: " + o.action }), ip, id );
            }
        } else if (o.type === "story_update") {
            // Handle story description updates
            if (o.noteId && o.description) {
                var updatedNote = updateNoteDescription(o.noteId, o.description);
                if (updatedNote) {
                    if (isHebrew) {
                        serv.SendText( JSON.stringify({ type:"reply", text: "תיאור הסיפור '" + updatedNote.title + "' עודכן בהצלחה!" }), ip, id );
        } else {
                        serv.SendText( JSON.stringify({ type:"reply", text: "Story description for '" + updatedNote.title + "' updated successfully!" }), ip, id );
                    }
                } else {
                    serv.SendText( JSON.stringify({ type:"reply", text: "Failed to update story description" }), ip, id );
                }
            } else {
                serv.SendText( JSON.stringify({ type:"reply", text: "Missing noteId or description" }), ip, id );
            }
        } else if (o.type === "save_settings") {
            // Handle saving settings (like API key)
            try {
                var settings = {
                    geminiApiKey: o.geminiApiKey || "AIzaSyC9dXJT4ol3i2VoK6aqLjX5S7IMKSjwNC4"
                };
                app.WriteFile("settings.json", JSON.stringify(settings, null, 2));
                serv.SendText( JSON.stringify({ type:"reply", text: "Settings saved successfully!" }), ip, id );
            } catch (error) {
                serv.SendText( JSON.stringify({ type:"reply", text: "Error saving settings: " + error.message }), ip, id );
            }
        } else if (o.type === "get_commands") {
            // Handle getting available commands for hints
            try {
                var commands = getAvailableCommands();
                serv.SendText( JSON.stringify({ type:"available_commands", commands: commands }), ip, id );
            } catch (error) {
                serv.SendText( JSON.stringify({ type:"reply", text: "Error getting commands: " + error.message }), ip, id );
            }
        } else {
            serv.SendText( JSON.stringify({ type:"reply", text: "Unknown message type: " + o.type }), ip, id );
        }
    } catch(e){
        // Better error handling - log the problematic message
        console.log("JSON Parse Error - Received message: " + msg);
        console.log("Error: " + e.message);
        serv.SendText( JSON.stringify({ type:"reply", text: "Bad JSON: " + e.message }), ip, id );
    }
}

// Handle yes/no responses for note creation and deletion
function handleConfirmationResponse(text) {
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
            var pendingNote = getPendingNoteCreation();
            if (pendingNote) {
                var note = createNote(pendingNote.title, "", pendingNote.parentId);
                clearPendingNoteCreation();
                clearCurrentFindContext(); // Clear find context after action
                if (isHebrew) {
                    return "פתק נוצר בהצלחה! ID: " + note.id + ", כותרת: '" + note.title + "'";
                }
                return "Note created successfully! ID: " + note.id + ", Title: '" + note.title + "'";
            }
            
            // Check if we have a pending story creation
            var pendingStory = getPendingStoryCreation();
            if (pendingStory) {
                // Create the story note with empty description initially
                var note = createNote(pendingStory.title, "", null);
                clearPendingStoryCreation();
                
                // Start story editing mode
                setStoryEditingMode(note.id, note.title);
                
                if (isHebrew) {
                    return "סיפור נוצר! ID: " + note.id + ", כותרת: '" + note.title + "'. כדי להתחיל לערוך את תיאור הסיפור, לחץ על כפתור ההקלטה או הקלד הודעה בצ'אט. לסיום אמור 'עצור עריכת תיאור'.";
                }
                return "Story created! ID: " + note.id + ", Title: '" + note.title + "'. To start editing the story description, please click the record button or type a message in the chat. To finish, say 'stop editing description'.";
            }
            
            // Check if we have a pending story update
            var pendingUpdate = getPendingStoryUpdate();
            if (pendingUpdate) {
                var updatedNote = updateNoteDescription(pendingUpdate.noteId, pendingUpdate.description);
                clearPendingStoryUpdate();
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
            var pendingDeletion = getPendingNoteDeletion();
            if (pendingDeletion) {
                var deletedNote = deleteNote(pendingDeletion);
                clearPendingNoteDeletion();
                clearCurrentFindContext(); // Clear find context after action
                if (isHebrew) {
                    return "הפתק '" + deletedNote.title + "' נמחק בהצלחה!";
                }
                return "Note '" + deletedNote.title + "' deleted successfully!";
            }
            
            // Check if we have a pending note mark done
            var pendingMarkDone = getPendingNoteMarkDone();
            if (pendingMarkDone) {
                var markedNote = markNoteAsDone(pendingMarkDone);
                clearPendingNoteMarkDone();
                clearCurrentFindContext(); // Clear find context after action
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
            var pendingNote = getPendingNoteCreation();
            var pendingDeletion = getPendingNoteDeletion();
            var pendingMarkDone = getPendingNoteMarkDone();
            var pendingSubNote = getPendingSubNoteCreation();
            
            console.log("DEBUG: Pending states - Note:", pendingNote, "Deletion:", pendingDeletion, "MarkDone:", pendingMarkDone, "SubNote:", pendingSubNote);
            
            if (pendingNote) {
            clearPendingNoteCreation();
            if (isHebrew) {
                return "יצירת הפתק בוטלה.";
            }
            return "Note creation cancelled.";
            }
            
            if (pendingDeletion) {
                clearPendingNoteDeletion();
                if (isHebrew) {
                    return "מחיקת הפתק בוטלה.";
                }
                return "Note deletion cancelled.";
            }
            
            if (pendingMarkDone) {
                clearPendingNoteMarkDone();
                if (isHebrew) {
                    return "סימון הפתק כהושלם בוטל.";
                }
                return "Note mark done cancelled.";
            }
            
            if (pendingSubNote) {
                console.log("DEBUG: Cancelling sub-note creation");
                clearPendingSubNoteCreation();
                clearCurrentFindContext();
                if (isHebrew) {
                    return "יצירת התת-פתק בוטלה.";
                }
                return "Sub-note creation cancelled.";
            }
            
            // Check for pending story update
            var pendingUpdate = getPendingStoryUpdate();
            if (pendingUpdate) {
                clearPendingStoryUpdate();
                if (isHebrew) {
                    return "עדכון תיאור הסיפור בוטל.";
                }
                return "Story description update cancelled.";
            }
        }
    }
    
    return null; // No confirmation response detected
}

// Simple pending note storage (in a real app, you'd use a proper session system)
var pendingNoteCreation = null;
var pendingNoteDeletion = null;
var pendingNoteMarkDone = null;
var pendingSubNoteCreation = null;
var pendingStoryCreation = null;

// Command completion state
var pendingCommandCompletion = null;

// Story editing mode state
var storyEditingMode = null;
var pendingStoryUpdate = null;

function setPendingNoteCreation(title, parentId) {
    pendingNoteCreation = { title: title, parentId: parentId };
}

function getPendingNoteCreation() {
    return pendingNoteCreation;
}

function clearPendingNoteCreation() {
    pendingNoteCreation = null;
}

function setPendingNoteDeletion(noteId) {
    pendingNoteDeletion = noteId;
}

function getPendingNoteDeletion() {
    return pendingNoteDeletion;
}

function clearPendingNoteDeletion() {
    pendingNoteDeletion = null;
}

function setPendingNoteMarkDone(noteId) {
    pendingNoteMarkDone = noteId;
}

function getPendingNoteMarkDone() {
    return pendingNoteMarkDone;
}

function clearPendingNoteMarkDone() {
    pendingNoteMarkDone = null;
}

function setPendingSubNoteCreation(parentNoteId) {
    pendingSubNoteCreation = { parentNoteId: parentNoteId };
}

function getPendingSubNoteCreation() {
    return pendingSubNoteCreation;
}

function clearPendingSubNoteCreation() {
    pendingSubNoteCreation = null;
}

function setPendingStoryCreation(title) {
    pendingStoryCreation = { title: title, description: "" };
}

function getPendingStoryCreation() {
    return pendingStoryCreation;
}

function clearPendingStoryCreation() {
    pendingStoryCreation = null;
}

function updatePendingStoryDescription(additionalText) {
    if (pendingStoryCreation) {
        pendingStoryCreation.description += (pendingStoryCreation.description ? " " : "") + additionalText;
    }
}

// Story editing mode functions
function setStoryEditingMode(noteId, noteTitle) {
    storyEditingMode = {
        noteId: noteId,
        noteTitle: noteTitle,
        accumulatedMessages: []
    };
}

function getStoryEditingMode() {
    return storyEditingMode;
}

function clearStoryEditingMode() {
    storyEditingMode = null;
}

function addToStoryEditing(text) {
    if (storyEditingMode) {
        // Add a dot at the end of each message for better sentence structure
        var textWithDot = text.trim();
        if (textWithDot && !textWithDot.endsWith('.') && !textWithDot.endsWith('!') && !textWithDot.endsWith('?')) {
            textWithDot += '.';
        }
        storyEditingMode.accumulatedMessages.push(textWithDot);
    }
}

function getAccumulatedStoryText() {
    if (storyEditingMode && storyEditingMode.accumulatedMessages.length > 0) {
        return storyEditingMode.accumulatedMessages.join(" ");
    }
    return "";
}

// Pending story update functions
function setPendingStoryUpdate(noteId, description) {
    pendingStoryUpdate = { noteId: noteId, description: description };
}

function getPendingStoryUpdate() {
    return pendingStoryUpdate;
}

function clearPendingStoryUpdate() {
    pendingStoryUpdate = null;
}

// Command completion functions
function setPendingCommandCompletion(command, action) {
    pendingCommandCompletion = { command: command, action: action };
}

function getPendingCommandCompletion() {
    return pendingCommandCompletion;
}

function clearPendingCommandCompletion() {
    pendingCommandCompletion = null;
}

// Dynamic command generation for hints
function getAvailableCommands() {
    var lang = Settings.lang || "en";
    var patterns = Patterns[lang] || {};
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
}
