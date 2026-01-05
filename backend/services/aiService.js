import openai from '../config/openai.js';

class AIService {
    /**
     * Parse user message to detect CRUD commands
     * Returns structured command object if CRUD operation detected
     */
    async parseCommand(message) {
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `You are a command parser for a productivity app. Analyze the user's message and determine if they want to perform any of these actions:
- create_task: Create a new task
- create_note: Create a new note
- update_task: Update an existing task
- update_note: Update an existing note
- delete_task: Delete a task
- delete_note: Delete a note
- complete_task: Mark a task as completed
- list_tasks: Show all tasks
- list_notes: Show all notes

If a CRUD action is detected, respond with ONLY a valid JSON object in this exact format (no markdown, no explanation):
{
  "isCommand": true,
  "action": "action_name",
  "data": {
    "title": "extracted title if any",
    "content": "extracted content/description if any",
    "category": "Work|Study|Personal if mentioned",
    "priority": "low|medium|high if mentioned",
    "dueDate": "ISO date string if mentioned, null otherwise",
    "searchQuery": "search term if looking for specific item"
  }
}

For date parsing:
- "today" = today's date
- "tomorrow" = tomorrow's date
- "next week" = 7 days from now
- Use ISO format: YYYY-MM-DD

If the message is NOT a command (just a question or chat), respond with:
{"isCommand": false}

Examples:
- "Create a task called Buy groceries for tomorrow" → create_task with title and dueDate
- "Add a note about meeting notes" → create_note with title
- "Delete my task Buy groceries" → delete_task with searchQuery
- "Mark finish report as done" → complete_task with searchQuery
- "Show all my tasks" → list_tasks
- "How can I be more productive?" → not a command`
                    },
                    {
                        role: 'user',
                        content: message,
                    },
                ],
                temperature: 0.3,
                max_tokens: 300,
            });

            const result = response.choices[0].message.content.trim();

            // Try to parse as JSON
            try {
                // Remove any markdown code blocks if present
                let cleanedResult = result;
                if (result.includes('```')) {
                    cleanedResult = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
                }
                const parsed = JSON.parse(cleanedResult);
                return parsed;
            } catch (parseError) {
                console.log('Failed to parse AI response as JSON:', result);
                return { isCommand: false };
            }
        } catch (error) {
            console.error('AI Parse Command Error:', error.message);
            return { isCommand: false };
        }
    }

    /**
     * Generate a summary for a note
     */
    async generateNoteSummary(content) {
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are a helpful assistant that creates concise summaries and extracts action items from notes.',
                    },
                    {
                        role: 'user',
                        content: `Please provide:\n1. A brief summary (2-3 sentences)\n2. Key action items (bullet points)\n3. Suggested tags (comma-separated)\n\nNote content:\n${content}`,
                    },
                ],
                temperature: 0.7,
                max_tokens: 300,
            });

            const result = response.choices[0].message.content;
            return this.parseNoteSummaryResponse(result);
        } catch (error) {
            console.error('AI Summary Error:', error.message);
            return {
                summary: 'Summary unavailable',
                actionItems: [],
                tags: [],
            };
        }
    }

    /**
     * Parse the AI response for note summary
     */
    parseNoteSummaryResponse(response) {
        const lines = response.split('\n').filter((line) => line.trim());
        let summary = '';
        let actionItems = [];
        let tags = [];

        let currentSection = '';

        for (const line of lines) {
            if (line.toLowerCase().includes('summary')) {
                currentSection = 'summary';
                continue;
            } else if (line.toLowerCase().includes('action')) {
                currentSection = 'action';
                continue;
            } else if (line.toLowerCase().includes('tag')) {
                currentSection = 'tags';
                continue;
            }

            if (currentSection === 'summary' && !summary) {
                summary = line.replace(/^\d+\.\s*/, '').trim();
            } else if (currentSection === 'action' && line.trim().startsWith('-')) {
                actionItems.push(line.replace(/^-\s*/, '').trim());
            } else if (currentSection === 'tags') {
                tags = line
                    .replace(/^\d+\.\s*/, '')
                    .split(',')
                    .map((t) => t.trim().toLowerCase())
                    .filter((t) => t);
            }
        }

        return { summary, actionItems, tags };
    }

    /**
     * Generate AI tags for a note
     */
    async generateTags(content) {
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are a helpful assistant that generates relevant tags for notes. Return only comma-separated tags, nothing else.',
                    },
                    {
                        role: 'user',
                        content: `Generate 3-5 relevant tags for this note:\n\n${content}`,
                    },
                ],
                temperature: 0.5,
                max_tokens: 50,
            });

            const tags = response.choices[0].message.content
                .split(',')
                .map((t) => t.trim().toLowerCase())
                .filter((t) => t);

            return tags;
        } catch (error) {
            console.error('AI Tags Error:', error.message);
            return [];
        }
    }

    /**
     * Rewrite/improve note content
     */
    async rewriteNote(content, style) {
        const prompts = {
            polish:
                'Rewrite this note to be more professional and well-structured while keeping all the information:',
            bullets: 'Convert this note into clear, concise bullet points:',
            shorten:
                'Summarize this note in a shorter form while keeping the key information:',
        };

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful writing assistant.',
                    },
                    {
                        role: 'user',
                        content: `${prompts[style]}\n\n${content}`,
                    },
                ],
                temperature: 0.7,
                max_tokens: 500,
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('AI Rewrite Error:', error.message);
            return content;
        }
    }

    /**
     * Generate AI priority score for a task
     */
    async generatePriorityScore(taskTitle, taskDescription) {
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are a productivity expert. Analyze tasks and provide priority scores.',
                    },
                    {
                        role: 'user',
                        content: `Analyze this task and provide:\n1. Impact (low/medium/high)\n2. Effort (low/medium/high)\n3. Urgency (low/medium/high)\n4. Brief reasoning\n\nTask: ${taskTitle}\nDescription: ${taskDescription || 'No description'}`,
                    },
                ],
                temperature: 0.6,
                max_tokens: 150,
            });

            const result = response.choices[0].message.content;
            return this.parsePriorityResponse(result);
        } catch (error) {
            console.error('AI Priority Error:', error.message);
            return {
                impact: 'medium',
                effort: 'medium',
                urgency: 'medium',
                reasoning: 'Unable to analyze',
            };
        }
    }

    /**
     * Parse priority score response
     */
    parsePriorityResponse(response) {
        const lines = response.toLowerCase();
        const extractLevel = (keyword) => {
            if (lines.includes(`${keyword}: high`) || lines.includes(`${keyword} high`))
                return 'high';
            if (lines.includes(`${keyword}: low`) || lines.includes(`${keyword} low`))
                return 'low';
            return 'medium';
        };

        return {
            impact: extractLevel('impact'),
            effort: extractLevel('effort'),
            urgency: extractLevel('urgency'),
            reasoning: response,
        };
    }

    /**
     * Generate focus mode breakdown for a task
     */
    async generateFocusMode(taskTitle, taskDescription) {
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are a productivity coach. Break down tasks into actionable steps.',
                    },
                    {
                        role: 'user',
                        content: `Break down this task into:\n1. 3-5 actionable steps\n2. A short motivation tip\n3. Estimated time to complete\n\nTask: ${taskTitle}\nDescription: ${taskDescription || 'No description'}`,
                    },
                ],
                temperature: 0.7,
                max_tokens: 300,
            });

            const result = response.choices[0].message.content;
            return this.parseFocusModeResponse(result);
        } catch (error) {
            console.error('AI Focus Mode Error:', error.message);
            return {
                steps: ['Start working on the task'],
                motivationTip: 'You can do this!',
                estimatedEffort: '30 minutes',
            };
        }
    }

    /**
     * Parse focus mode response
     */
    parseFocusModeResponse(response) {
        const lines = response.split('\n').filter((line) => line.trim());
        const steps = [];
        let motivationTip = 'Stay focused and take breaks!';
        let estimatedEffort = '30-60 minutes';

        for (const line of lines) {
            if (
                line.match(/^\d+\./) ||
                line.trim().startsWith('-') ||
                line.trim().startsWith('•')
            ) {
                const step = line.replace(/^[\d\.\-•]\s*/, '').trim();
                if (step && !step.toLowerCase().includes('motivation')) {
                    steps.push(step);
                }
            }

            if (line.toLowerCase().includes('motivation') || line.toLowerCase().includes('tip:')) {
                motivationTip = line.replace(/.*?:/i, '').trim();
            }

            if (
                line.toLowerCase().includes('time') ||
                line.toLowerCase().includes('estimate')
            ) {
                const match = line.match(/(\d+[-–]\d+|\d+)\s*(min|hour)/i);
                if (match) {
                    estimatedEffort = match[0];
                }
            }
        }

        return {
            steps: steps.length > 0 ? steps : ['Start working on the task'],
            motivationTip,
            estimatedEffort,
        };
    }

    /**
     * AI Assistant chat
     */
    async chat(message, context = {}) {
        try {
            const systemPrompt = `You are a helpful productivity assistant. You help users manage their tasks and notes effectively. 
      
      Context:
      - User has ${context.notesCount || 0} notes
      - User has ${context.tasksCount || 0} tasks
      - ${context.completedTasksCount || 0} tasks completed
      - Recent notes: ${context.recentNotes?.map((n) => n.title).join(', ') || 'None'}
      
      Provide concise, actionable advice.`;

            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt,
                    },
                    {
                        role: 'user',
                        content: message,
                    },
                ],
                temperature: 0.8,
                max_tokens: 300,
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('AI Chat Error:', error.message);
            return "I'm having trouble connecting right now. Please try again.";
        }
    }

    /**
     * Generate weekly summary
     */
    async generateWeeklySummary(tasks, notes) {
        const completedTasks = tasks.filter((t) => t.completed);
        const pendingTasks = tasks.filter((t) => !t.completed);

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a productivity analyst providing weekly summaries.',
                    },
                    {
                        role: 'user',
                        content: `Generate a brief weekly productivity summary based on:
            - ${completedTasks.length} completed tasks
            - ${pendingTasks.length} pending tasks
            - ${notes.length} notes created
            - Task categories: ${tasks.map((t) => t.category).join(', ')}
            
            Provide encouragement and suggestions for next week.`,
                    },
                ],
                temperature: 0.8,
                max_tokens: 250,
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('AI Weekly Summary Error:', error.message);
            return `You completed ${completedTasks.length} tasks this week. Keep up the great work!`;
        }
    }

    /**
     * Suggest priorities
     */
    async suggestPriorities(tasks) {
        const pendingTasks = tasks.filter((t) => !t.completed);

        if (pendingTasks.length === 0) {
            return 'Great job! You have no pending tasks. Time to add some new goals!';
        }

        try {
            const taskList = pendingTasks
                .map((t, i) => `${i + 1}. ${t.title} (${t.category}, due: ${t.dueDate || 'no date'})`)
                .join('\n');

            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are a productivity coach. Analyze tasks and suggest what to prioritize.',
                    },
                    {
                        role: 'user',
                        content: `Based on these pending tasks, suggest which ones to prioritize and why:\n\n${taskList}`,
                    },
                ],
                temperature: 0.7,
                max_tokens: 250,
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('AI Priority Suggestions Error:', error.message);
            return 'Focus on tasks with upcoming due dates first!';
        }
    }
}

export default new AIService();
