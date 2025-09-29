// main.js (DroidScript)
// Backend web+WebSocket server + simple EN/HE intent router.

// -------- Command Processing moved to CommandRouter.js --------
var Settings = { lang: "en" };

// -------- State Management moved to StateManager.js --------

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

// -------- Note Search and Utility Functions moved to NoteManager.js --------

// -------- Intent Detection moved to CommandRouter.js --------
// formatOutcome function moved to WebSocketHandler.js

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

// -------- Note Management moved to NoteManager.js --------

// -------- DroidScript App lifecycle --------

function OnStart(){
    // Load modules in dependency order
    app.LoadScript("StateManager.js", function() {
        app.LoadScript("NoteManager.js", function() {
            app.LoadScript("AIService.js", function() {
                app.LoadScript("CommandRouter.js", function() {
                    app.LoadScript("WebSocketHandler.js", function() {
                        app.LoadScript("DailySummary.js", function() {
                            startApp();
                        });
                    });
                });
            });
        });
    });
}

function startApp() {
    // Load HTML content from file
    loadHtmlContent();
    
    // Load notes from storage
    NoteManager.loadNotes();
    
    // Initialize WebSocket server and WebView
    WebSocketHandler.initializeServer();

    // Setup daily summary alarm
    DailySummary.setupDailySummary();
}

// This gets called by the alarm service
function sumerizeNotesDaily() {
    DailySummary.processDailySummary();
}

// -------- AI Management moved to AIService.js --------

// -------- WebSocket Communication moved to WebSocketHandler.js --------

// -------- Confirmation Response Handling moved to WebSocketHandler.js --------

// -------- Pending State Management moved to StateManager.js --------

// -------- Command Generation moved to WebSocketHandler.js --------
