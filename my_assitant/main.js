// main.js (DroidScript)
// Backend web+WebSocket server + simple EN/HE intent router.

// -------- Global Settings --------
var Settings = { lang: "en" };

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

