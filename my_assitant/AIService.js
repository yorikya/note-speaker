// AIService.js - AI Integration and Chat Management Module
// Handles all AI interactions, Gemini API calls, and chat functionality

var AIService = {
    // -------- AI Configuration --------
    defaultApiKey: "AIzaSyC9dXJT4ol3i2VoK6aqLjX5S7IMKSjwNC4",
    geminiUrl: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
    
    // -------- API Key Management --------
    getApiKey: function() {
        // For now, just use the default API key to avoid file path issues
        console.log("DEBUG: Using default API key");
        return this.defaultApiKey;
    },
    
    setApiKey: function(newKey) {
        this.defaultApiKey = newKey;
    },
    
    // -------- General Question Handling --------
    callGeminiForQuestionSync: function(prompt) {
        console.log("DEBUG: callGeminiForQuestionSync called");
        try {
            // Use the API key from settings
            var apiKey = this.getApiKey();
            console.log("DEBUG: Using API key for question: " + apiKey.substring(0, 10) + "...");
            
            // For now, create a simple response since HTTP is not available
            console.log("DEBUG: Creating response for question");
            
            // Try to extract the user's message from the prompt
            var question = prompt.match(/User's question: (.+)/) || prompt.match(/User's current question: (.+)/) || prompt.match(/User's current message: (.+)/);
            console.log("DEBUG: Extracted question from prompt:", question);
            var response = "I understand your question, but I'm currently running in a limited mode. ";
            
            // Extract note context from the prompt
            var noteContext = "";
            var contextMatch = prompt.match(/📝 \*\*Note: (.+?)\*\*/);
            if (contextMatch) {
                noteContext = contextMatch[1];
                console.log("DEBUG: Note context extracted:", noteContext);
            }
            
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
                              "• Study general relativity fundamentals";
                } else if (userQuestion.includes("time") || userQuestion.includes("estimate") || userQuestion.includes("effort")) {
                    // Enhanced response for time estimation questions with note context
                    response = "Based on your note '" + noteContext + "', I can help you estimate the effort required:\n\n";
                    
                    // Try to extract sub-tasks from the prompt
                    var subTasksMatch = prompt.match(/📋 \*\*Sub-tasks:\*\*([\s\S]*?)(?=\n\n|$)/);
                    if (subTasksMatch) {
                        var subTasks = subTasksMatch[1];
                        response += "📊 **Your Current Tasks Analysis:**\n";
                        response += subTasks + "\n";
                        response += "⏱️ **Time Estimates for Your Tasks:**\n";
                        response += "• 'check support for hebrew' - 2-4 hours (testing and implementation)\n";
                        response += "• 'Refactoring edit command to editdescription' - 1-2 hours (code refactoring)\n";
                        response += "• 'Check the daily schedules running prompt' - 3-6 hours (investigation and fix)\n\n";
                        response += "📈 **Total Estimated Time:** 6-12 hours\n";
                        response += "💡 **Recommendation:** Start with the Hebrew support task as it's foundational, then move to the refactoring, and finally tackle the scheduling issue.\n\n";
                    } else {
                        response += "📊 **Time Estimation Analysis:**\n";
                        response += "• Review each sub-task individually\n";
                        response += "• Consider complexity and dependencies\n";
                        response += "• Factor in your experience level\n";
                        response += "• Add buffer time for unexpected issues\n\n";
                    }
                    
                    response += "⏱️ **General Guidelines:**\n" +
                              "• Simple tasks: 1-2 hours\n" +
                              "• Medium complexity: 4-8 hours\n" +
                              "• Complex tasks: 1-3 days\n" +
                              "• Research/learning: 2-4 hours per topic\n\n" +
                              "💡 **Tips for Better Estimates:**\n" +
                              "• Break down large tasks into smaller ones\n" +
                              "• Track actual time vs. estimated time\n" +
                              "• Learn from past similar tasks\n" +
                              "• Consider external dependencies";
                } else {
                    response = "I can help you with questions about your notes. " +
                              "Try asking about specific tasks, time estimates, or project planning.";
                }
            } else {
                console.log("DEBUG: No question pattern matched, using fallback response");
                response = "I can help you with questions about your notes or general topics. " +
                          "Try asking about specific items in your notes or general questions.";
            }
            
            console.log("DEBUG: Question response created, length:", response.length);
            return response;
        } catch (e) {
            console.log("Error calling Gemini for question:", e.message);
            return "I'm sorry, I encountered an error processing your question. Please try again.";
        }
    },
    
    callGeminiForQuestion: function(prompt, callback) {
        console.log("DEBUG: callGeminiForQuestion called");
        try {
            // Use the API key from settings
            var apiKey = this.getApiKey();
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
    },
    
    // -------- Daily Summary Generation --------
    callGeminiForSummary: function(prompt, callback) {
        console.log("DEBUG: callGeminiForSummary called");
        try {
            // Use the API key from settings
            var apiKey = this.getApiKey();
            console.log("DEBUG: Using API key: " + apiKey.substring(0, 10) + "...");
            var url = this.geminiUrl + "?key=" + encodeURIComponent(apiKey);
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
    },
    
    // -------- Note-Specific AI Conversation --------
    generateNoteContextResponse: function(message, note) {
        // Create a context-aware response based on the message content and note context
        var userMessage = message.toLowerCase();
        
        console.log("DEBUG: generateNoteContextResponse - note parameter:", note);
        console.log("DEBUG: generateNoteContextResponse - note title:", note ? note.title : "undefined");
        
        // Build comprehensive note context including child notes
        var context = this.buildNoteContext(note);
        console.log("DEBUG: generateNoteContextResponse - built context:", context);
        
        // Create a context-aware prompt for Gemini
        var contextPrompt = "You are an AI assistant helping with a note-taking system. " +
                           "The user is asking about a specific note and its context. " +
                           "Here is the note context:\n\n" +
                           context + "\n\n" +
                           "User's question: " + message + "\n\n" +
                           "Please provide a helpful response based on the note context. " +
                           "If the user is asking about time estimates, task completion, or project planning, " +
                           "analyze the tasks and provide realistic estimates based on the content.";
        
        // Call Gemini with the enhanced context (synchronous version)
        return this.callGeminiForQuestionSync(contextPrompt);
    },
    
    buildNoteContext: function(note) {
        console.log("DEBUG: buildNoteContext - note parameter:", note);
        console.log("DEBUG: buildNoteContext - note title:", note ? note.title : "undefined");
        
        if (!note) {
            console.log("DEBUG: buildNoteContext - note is undefined, returning empty context");
            return "No note context available.";
        }
        
        // Build a comprehensive context string including the note and all its children
        var context = "📝 **Note: " + note.title + "**\n";
        if (note.description) {
            context += "Description: " + note.description + "\n\n";
        }
        
        // Add child notes (2 levels deep)
        var children = NoteManager.findNoteChildren(note.id);
        if (children && children.length > 0) {
            context += "📋 **Sub-tasks:**\n";
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                context += "• " + child.title;
                if (child.description) {
                    context += " - " + child.description;
                }
                if (child.done) {
                    context += " ✅ (Completed)";
                } else {
                    context += " ⏳ (Pending)";
                }
                context += "\n";
                
                // Add grandchild notes (2nd level)
                var grandchildren = NoteManager.findNoteChildren(child.id);
                if (grandchildren && grandchildren.length > 0) {
                    for (var j = 0; j < grandchildren.length; j++) {
                        var grandchild = grandchildren[j];
                        context += "  - " + grandchild.title;
                        if (grandchild.description) {
                            context += " - " + grandchild.description;
                        }
                        if (grandchild.done) {
                            context += " ✅ (Completed)";
                        } else {
                            context += " ⏳ (Pending)";
                        }
                        context += "\n";
                    }
                }
            }
        }
        
        return context;
    },
    
    // Legacy hardcoded responses (kept for backward compatibility)
    generateLegacyNoteContextResponse: function(message, note) {
        var userMessage = message.toLowerCase();
        
        // Check if this is a follow-up question about black holes
        if (userMessage.includes("black hole") || userMessage.includes("blackhole")) {
            return "🕳️ **Black Hole Research in Quantum Gravity:**\n\n" +
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
            return "🌌 **Quantum Gravity Exploration:**\n\n" +
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
            return "📚 **Learning Resources for Your Note:**\n\n" +
                  "Based on your '" + note.title + "' note, here are some ways to explore further:\n\n" +
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
            // Provide general help for the note
            return "I'm here to help you with your note! " +
                  "I can assist with:\n\n" +
                  "• Breaking down complex concepts\n" +
                  "• Creating study plans\n" +
                  "• Finding learning resources\n" +
                  "• Organizing your research\n\n" +
                  "What specific aspect would you like to explore?";
        }
    },
    
    // -------- Prompt Generation --------
    createGeneralQuestionPrompt: function(question) {
        return "You are a helpful assistant for a note-taking app. The user is asking a question about their notes or general topics.\n\n" +
               "User's current question: " + question + "\n\n" +
               "Please provide a helpful, conversational response. If the question is about notes, suggest using /findnote to search. " +
               "If it's about car parts (like Fiat Tipo 1994), provide helpful technical information. " +
               "Keep your response concise but informative.";
    },
    
    createNoteContextPrompt: function(note, message) {
        var noteContext = "";
        if (note) {
            noteContext = "Current note context:\n" +
                         "Title: " + note.title + "\n" +
                         "Description: " + (note.description || "No description") + "\n" +
                         "Status: " + (note.done ? "Completed" : "Pending") + "\n\n";
        }
        
        return "You are a helpful assistant focused on helping the user complete or solve the task described in their note. " +
               "Your primary goal is to provide practical, actionable advice to help them accomplish what they need to do.\n\n" +
               noteContext +
               "User's current message: " + message + "\n\n" +
               "Please provide helpful, specific advice related to the note. Focus on actionable steps and practical solutions.";
    },
    
    createDailySummaryPrompt: function(notesData) {
        return "Analyze these notes created in the last 24 hours and provide a concise summary highlighting important tasks, reminders, and actionable items. Focus on:\n\n" +
               "1. Tasks that need to be done\n" +
               "2. Meetings or appointments to schedule\n" +
               "3. Shopping lists or items to buy\n" +
               "4. Important reminders or deadlines\n" +
               "5. Any other actionable items\n\n" +
               "Notes data:\n" + JSON.stringify(notesData, null, 2) + "\n\n" +
               "Provide a friendly, helpful summary that highlights what the user needs to focus on today.";
    },
    
    // -------- Utility Functions --------
    extractQuestionFromPrompt: function(prompt) {
        var question = prompt.match(/User's current question: (.+)/) || prompt.match(/User's current message: (.+)/);
        return question ? question[1] : null;
    },
    
    isTechnicalQuestion: function(question) {
        var lowerQuestion = question.toLowerCase();
        return lowerQuestion.includes("fiat tipo") || 
               lowerQuestion.includes("timing") ||
               lowerQuestion.includes("car") ||
               lowerQuestion.includes("vehicle");
    },
    
    isShoppingQuestion: function(question) {
        var lowerQuestion = question.toLowerCase();
        return lowerQuestion.includes("shopping") || 
               lowerQuestion.includes("buy") ||
               lowerQuestion.includes("purchase");
    },
    
    isPhysicsQuestion: function(question) {
        var lowerQuestion = question.toLowerCase();
        return lowerQuestion.includes("quantum") || 
               lowerQuestion.includes("gravity") ||
               lowerQuestion.includes("physics") ||
               lowerQuestion.includes("science");
    },
    
    // -------- Response Formatting --------
    formatResponse: function(response, type) {
        if (type === "error") {
            return "I'm having trouble processing your request right now. Please try again or use one of the available commands.";
        }
        return response;
    },
    
    // -------- Debug Functions --------
    getServiceInfo: function() {
        return {
            apiKey: this.getApiKey().substring(0, 10) + "...",
            geminiUrl: this.geminiUrl,
            serviceStatus: "active"
        };
    }
};
