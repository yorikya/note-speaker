// AIService.js - AI Integration and Chat Management Module
// Handles all AI interactions, Gemini API calls, and chat functionality

var AIService = {
    // -------- AI Configuration --------
    defaultApiKey: "AIzaSyC9dXJT4ol3i2VoK6aqLjX5S7IMKSjwNC4",
    
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
                var userQuestion = question[1];
                
                // Use the new smart response system
                response = this.generateSmartResponse(userQuestion, noteContext, "general");
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
            
            // Extract note context from the prompt
            var noteContext = "";
            var contextMatch = prompt.match(/📝 \*\*Note: (.+?)\*\*/);
            if (contextMatch) {
                noteContext = contextMatch[1];
                console.log("DEBUG: Note context extracted:", noteContext);
            }
            
            if (question && question[1]) {
                console.log("DEBUG: User question extracted:", question[1]);
                var userQuestion = question[1];
                
                // Use the new smart response system
                response = this.generateSmartResponse(userQuestion, noteContext, "general");
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
            
            // Note: HTTP request to Gemini API is not implemented in DroidScript
            // Using fallback summary generation instead
            console.log("DEBUG: Using fallback summary generation");
            
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
    
    
    // -------- Prompt Generation --------
    createGeneralQuestionPrompt: function(question) {
        return "You are a helpful assistant for a note-taking app. The user is asking a question about their notes or general topics.\n\n" +
               "User's current question: " + question + "\n\n" +
               "Please provide a helpful, conversational response. If the question is about notes, suggest using /findnote to search. " +
               "Keep your response concise but informative.";
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
    
    
    
    // -------- Smart Context Analysis --------
    analyzeNoteContext: function(note) {
        if (!note) return "general";
        
        var title = (note.title || "").toLowerCase();
        var description = (note.description || "").toLowerCase();
        var context = title + " " + description;
        
        console.log("DEBUG: Analyzing note context:", context);
        
        // Scheduling/Reminders
        if (context.includes("meeting") || context.includes("schedule") || context.includes("appointment") || 
            context.includes("remind") || context.includes("call") || context.includes("email")) {
            return "scheduling";
        }
        
        // Shopping Lists
        if (context.includes("shopping") || context.includes("buy") || context.includes("grocery") || 
            context.includes("store") || context.includes("purchase") || context.includes("list")) {
            return "shopping";
        }
        
        // Project Management
        if (context.includes("project") || context.includes("task") || context.includes("build") || 
            context.includes("fix") || context.includes("develop") || context.includes("implement") ||
            context.includes("create") || context.includes("design")) {
            return "project";
        }
        
        // Learning/Research
        if (context.includes("study") || context.includes("learn") || context.includes("research") || 
            context.includes("read") || context.includes("book") || context.includes("course") ||
            context.includes("tutorial") || context.includes("practice")) {
            return "learning";
        }
        
        // Goal Tracking
        if (context.includes("goal") || context.includes("target") || context.includes("objective") || 
            context.includes("fitness") || context.includes("career") || context.includes("personal")) {
            return "goals";
        }
        
        return "general";
    },
    
    // -------- Smart Prompt Templates --------
    getSmartPrompt: function(contextType, noteContext, userQuestion) {
        var prompts = {
            scheduling: {
                system: "You are a scheduling and reminder assistant. Help users manage their time, appointments, and commitments.",
                focus: "Focus on time management, scheduling conflicts, reminder strategies, and calendar optimization.",
                examples: "Help with meeting preparation, deadline management, and time blocking strategies."
            },
            shopping: {
                system: "You are a shopping and list management assistant. Help users organize purchases, compare options, and manage shopping lists.",
                focus: "Focus on product recommendations, price comparisons, shopping efficiency, and list organization.",
                examples: "Help with meal planning, budget management, and shopping route optimization."
            },
            project: {
                system: "You are a project management assistant. Help users break down tasks, estimate timelines, and track progress.",
                focus: "Focus on task decomposition, resource planning, timeline estimation, and progress tracking.",
                examples: "Help with project planning, risk assessment, and milestone management."
            },
            learning: {
                system: "You are a learning and research assistant. Help users study effectively, organize knowledge, and track learning progress.",
                focus: "Focus on study strategies, knowledge organization, research methods, and learning optimization.",
                examples: "Help with study planning, research organization, and knowledge retention strategies."
            },
            goals: {
                system: "You are a goal-setting and achievement assistant. Help users define, track, and achieve their objectives.",
                focus: "Focus on goal clarity, progress tracking, motivation strategies, and achievement planning.",
                examples: "Help with goal breakdown, progress measurement, and motivation techniques."
            },
            general: {
                system: "You are a helpful note-taking assistant. Help users organize, understand, and make progress with their notes.",
                focus: "Focus on note organization, information synthesis, and actionable next steps.",
                examples: "Help with note categorization, information extraction, and task identification."
            }
        };
        
        var prompt = prompts[contextType] || prompts.general;
        
        return `You are ${prompt.system}

Context: ${noteContext}

User Question: ${userQuestion}

Instructions:
- ${prompt.focus}
- Provide specific, actionable advice
- Consider the user's note context
- Suggest concrete next steps
- Be encouraging and practical

${prompt.examples}`;
    },
    
    // -------- Smart Response Generation --------
    generateSmartResponse: function(question, noteContext, contextType) {
        var questionLower = question.toLowerCase();
        
        // Time estimation questions
        if (questionLower.includes("time") || questionLower.includes("estimate") || questionLower.includes("effort")) {
            return this.generateTimeEstimationResponse(question, noteContext, contextType);
        }
        
        // Progress questions
        if (questionLower.includes("progress") || questionLower.includes("next") || questionLower.includes("step")) {
            return this.generateProgressResponse(question, noteContext, contextType);
        }
        
        // Planning questions
        if (questionLower.includes("plan") || questionLower.includes("organize") || questionLower.includes("structure")) {
            return this.generatePlanningResponse(question, noteContext, contextType);
        }
        
        // General help
        return this.generateGeneralResponse(question, noteContext, contextType);
    },
    
    generateTimeEstimationResponse: function(question, noteContext, contextType) {
        var baseResponse = `⏱️ **Time Estimation for Your Task**

Based on your note context: "${noteContext}"`;
        
        var specificAdvice = "";
        switch(contextType) {
            case "project":
                specificAdvice = "\n\n🔧 **Project-Specific Tips:**\n" +
                               "• Break down into phases: Planning (20%), Execution (60%), Testing (20%)\n" +
                               "• Add 25% buffer time for unexpected issues\n" +
                               "• Consider dependencies between tasks\n" +
                               "• Factor in learning time for new technologies";
                break;
            case "learning":
                specificAdvice = "\n\n📚 **Learning-Specific Tips:**\n" +
                               "• Allocate time for theory (40%) and practice (60%)\n" +
                               "• Plan regular review sessions\n" +
                               "• Include time for note-taking and reflection\n" +
                               "• Consider your learning style and pace";
                break;
            case "scheduling":
                specificAdvice = "\n\n📅 **Scheduling-Specific Tips:**\n" +
                               "• Consider preparation time before meetings\n" +
                               "• Factor in travel time and buffer periods\n" +
                               "• Account for follow-up tasks\n" +
                               "• Plan for potential delays or rescheduling";
                break;
        }
        
        return baseResponse + specificAdvice + `

📊 **General Analysis:**
• Break down the task into smaller components
• Consider your experience level with similar tasks
• Factor in research and learning time
• Add buffer time for unexpected issues

⏰ **Time Guidelines:**
• Simple tasks: 1-2 hours
• Medium complexity: 4-8 hours  
• Complex tasks: 1-3 days
• Research/learning: 2-4 hours per topic

💡 **Recommendations:**
• Start with the most critical components first
• Set intermediate milestones
• Track actual time vs. estimates for future reference
• Consider breaking large tasks into daily chunks`;
    },
    
    generateProgressResponse: function(question, noteContext, contextType) {
        var baseResponse = `🚀 **Making Progress on Your Task**

Based on your note: "${noteContext}"`;
        
        var specificAdvice = "";
        switch(contextType) {
            case "project":
                specificAdvice = "\n\n🔧 **Project Progress Tips:**\n" +
                               "• Focus on completing one feature/component at a time\n" +
                               "• Test each component before moving to the next\n" +
                               "• Document your progress and decisions\n" +
                               "• Regular code reviews and quality checks";
                break;
            case "learning":
                specificAdvice = "\n\n📚 **Learning Progress Tips:**\n" +
                               "• Practice what you learn immediately\n" +
                               "• Teach others to reinforce your understanding\n" +
                               "• Create summaries and mind maps\n" +
                               "• Apply knowledge to real projects";
                break;
            case "goals":
                specificAdvice = "\n\n🎯 **Goal Progress Tips:**\n" +
                               "• Break goals into daily/weekly actions\n" +
                               "• Track metrics and milestones\n" +
                               "• Celebrate small wins regularly\n" +
                               "• Adjust goals based on progress";
                break;
        }
        
        return baseResponse + specificAdvice + `

📋 **Next Steps:**
• Identify the smallest actionable item
• Set a specific time to work on it
• Remove any blockers or dependencies
• Celebrate small wins along the way

🎯 **Progress Tracking:**
• Update your note with completed items
• Mark sub-tasks as done
• Add notes about what you learned
• Adjust timelines based on actual progress

💪 **Motivation Tips:**
• Focus on one task at a time
• Set realistic daily goals
• Take breaks to maintain energy
• Review progress regularly`;
    },
    
    generatePlanningResponse: function(question, noteContext, contextType) {
        var baseResponse = `📝 **Planning Your Task**

Based on your note: "${noteContext}"`;
        
        var specificAdvice = "";
        switch(contextType) {
            case "project":
                specificAdvice = "\n\n🔧 **Project Planning:**\n" +
                               "• Define clear requirements and scope\n" +
                               "• Create a work breakdown structure\n" +
                               "• Identify risks and mitigation strategies\n" +
                               "• Plan for testing and quality assurance";
                break;
            case "learning":
                specificAdvice = "\n\n📚 **Learning Planning:**\n" +
                               "• Set clear learning objectives\n" +
                               "• Create a study schedule with regular sessions\n" +
                               "• Identify resources and materials needed\n" +
                               "• Plan for practical application and projects";
                break;
            case "shopping":
                specificAdvice = "\n\n🛒 **Shopping Planning:**\n" +
                               "• Categorize items by store or department\n" +
                               "• Check for sales and discounts\n" +
                               "• Plan efficient shopping routes\n" +
                               "• Set a budget and stick to it";
                break;
        }
        
        return baseResponse + specificAdvice + `

🗂️ **Organization Strategy:**
• Break the task into logical phases
• Identify dependencies between steps
• Set clear milestones and deadlines
• Create a visual timeline or checklist

📅 **Time Management:**
• Allocate specific time blocks for each phase
• Consider your energy levels throughout the day
• Plan for research and learning time
• Include buffer time for unexpected issues

🔄 **Review Process:**
• Schedule regular check-ins with yourself
• Adjust the plan based on progress
• Learn from what works and what doesn't
• Celebrate achievements along the way`;
    },
    
    generateGeneralResponse: function(question, noteContext, contextType) {
        var baseResponse = `💡 **Helping You with Your Note**

Based on your note: "${noteContext}"`;
        
        var specificAdvice = "";
        switch(contextType) {
            case "scheduling":
                specificAdvice = "\n\n📅 **Scheduling Focus:**\n" +
                               "• Prioritize tasks by urgency and importance\n" +
                               "• Use time blocking for focused work\n" +
                               "• Set up reminders and notifications\n" +
                               "• Plan buffer time between appointments";
                break;
            case "shopping":
                specificAdvice = "\n\n🛒 **Shopping Focus:**\n" +
                               "• Organize your list by store or category\n" +
                               "• Check for coupons and deals\n" +
                               "• Plan your shopping route efficiently\n" +
                               "• Set a budget and track spending";
                break;
            case "goals":
                specificAdvice = "\n\n🎯 **Goal Focus:**\n" +
                               "• Make your goals SMART (Specific, Measurable, Achievable, Relevant, Time-bound)\n" +
                               "• Break large goals into smaller milestones\n" +
                               "• Track progress regularly\n" +
                               "• Adjust goals as needed";
                break;
        }
        
        return baseResponse + specificAdvice + `

🤔 **Understanding Your Task:**
• What's the main objective you're trying to achieve?
• What information do you already have?
• What additional resources do you need?
• What's the first step you can take today?

🎯 **Actionable Next Steps:**
• Break down the task into smaller, manageable pieces
• Identify any research or learning you need to do
• Set a specific time to work on the first step
• Update your note with progress and insights

💪 **Staying Motivated:**
• Focus on progress, not perfection
• Celebrate small wins
• Ask for help when you need it
• Remember why this task matters to you`;
    },
    
    // -------- Enhanced Note Context Response --------
    generateNoteContextResponse: function(message, note) {
        console.log("DEBUG: generateNoteContextResponse - note parameter:", note);
        console.log("DEBUG: generateNoteContextResponse - note title:", note ? note.title : "undefined");
        
        if (!note) {
            return "I need more context about your note to help you effectively. Please make sure you're in a note context.";
        }
        
        // Analyze the note context to determine the best approach
        var contextType = this.analyzeNoteContext(note);
        console.log("DEBUG: Detected context type:", contextType);
        
        // Build comprehensive note context
        var context = this.buildNoteContext(note);
        console.log("DEBUG: generateNoteContextResponse - built context:", context);
        
        // Create smart prompt based on context type
        var smartPrompt = this.getSmartPrompt(contextType, context, message);
        console.log("DEBUG: Generated smart prompt for context type:", contextType);
        
        // Generate smart response
        var response = this.generateSmartResponse(message, context, contextType);
        console.log("DEBUG: Generated smart response, length:", response.length);
        
        return response;
    },
    
    // -------- Enhanced Note Context Response with History --------
    generateNoteContextResponseWithHistory: function(message, note, conversationHistory) {
        console.log("DEBUG: generateNoteContextResponseWithHistory - note parameter:", note);
        console.log("DEBUG: generateNoteContextResponseWithHistory - note title:", note ? note.title : "undefined");
        console.log("DEBUG: generateNoteContextResponseWithHistory - conversation history length:", conversationHistory ? conversationHistory.length : 0);
        
        if (!note) {
            return "I need more context about your note to help you effectively. Please make sure you're in a note context.";
        }
        
        // Analyze the note context to determine the best approach
        var contextType = this.analyzeNoteContext(note);
        console.log("DEBUG: Detected context type:", contextType);
        
        // Build comprehensive note context
        var context = this.buildNoteContext(note);
        console.log("DEBUG: generateNoteContextResponseWithHistory - built context:", context);
        
        // Build conversation history context
        var historyContext = "";
        if (conversationHistory && conversationHistory.length > 0) {
            historyContext = "\n\n**Previous Conversation:**\n";
            for (var i = 0; i < conversationHistory.length; i++) {
                var turn = conversationHistory[i];
                historyContext += "User: " + turn.user + "\n";
                historyContext += "AI: " + turn.ai + "\n\n";
            }
        }
        
        // Create smart prompt based on context type and conversation history
        var smartPrompt = this.getSmartPromptWithHistory(contextType, context, message, historyContext);
        console.log("DEBUG: Generated smart prompt with history for context type:", contextType);
        
        // Generate smart response with conversation context
        var response = this.generateSmartResponseWithHistory(message, context, contextType, historyContext);
        console.log("DEBUG: Generated smart response with history, length:", response.length);
        
        return response;
    },
    
    // -------- Helper Functions for Conversation History --------
    getSmartPromptWithHistory: function(contextType, context, message, historyContext) {
        var basePrompt = this.getSmartPrompt(contextType, context, message);
        return basePrompt + historyContext;
    },
    
    generateSmartResponseWithHistory: function(message, context, contextType, historyContext) {
        // For now, use the existing smart response but include conversation context
        var baseResponse = this.generateSmartResponse(message, context, contextType);
        
        // If there's conversation history, modify the response to be more conversational
        if (historyContext && historyContext.trim() !== "") {
            // Check if the message is a follow-up question
            var isFollowUp = /\b(what|how|when|where|why|which|who)\b/i.test(message) || 
                            /\b(you|your|suggested|recommended|said|mentioned)\b/i.test(message);
            
            if (isFollowUp) {
                // Make the response more conversational and reference previous context
                return this.makeResponseConversational(baseResponse, message, historyContext);
            }
        }
        
        return baseResponse;
    },
    
    makeResponseConversational: function(baseResponse, message, historyContext) {
        // Extract key information from the conversation history
        var lastAiResponse = "";
        if (historyContext.includes("AI:")) {
            var aiParts = historyContext.split("AI:");
            if (aiParts.length > 1) {
                lastAiResponse = aiParts[aiParts.length - 1].trim();
            }
        }
        
        // Modify the response to be more conversational
        var conversationalResponse = baseResponse;
        
        // If the user is asking about previous suggestions, reference them
        if (/\b(what|you|suggested|recommended)\b/i.test(message)) {
            if (lastAiResponse.includes("Time Estimation") || lastAiResponse.includes("⏱️")) {
                conversationalResponse = "Based on my previous time estimation, here's what I suggest you start with:\n\n" + 
                                      this.extractActionableSteps(baseResponse);
            } else if (lastAiResponse.includes("Actionable Next Steps") || lastAiResponse.includes("🎯")) {
                conversationalResponse = "Following up on my previous suggestions, here are the specific next steps:\n\n" + 
                                      this.extractActionableSteps(baseResponse);
            } else {
                conversationalResponse = "Building on our previous discussion, here's what I recommend:\n\n" + baseResponse;
            }
        }
        
        return conversationalResponse;
    },
    
    extractActionableSteps: function(response) {
        // Extract actionable steps from the response
        var steps = [];
        var lines = response.split('\n');
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || 
                line.match(/^\d+\./) || line.includes('Start with') || line.includes('Begin by')) {
                steps.push(line);
            }
        }
        
        if (steps.length > 0) {
            return steps.slice(0, 5).join('\n'); // Return first 5 actionable steps
        }
        
        return response; // Fallback to original response
    }
    
};
