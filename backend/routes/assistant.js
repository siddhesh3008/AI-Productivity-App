import express from 'express';
import { protect } from '../middleware/auth.js';
import aiService from '../services/aiService.js';
import Note from '../models/Note.js';
import Task from '../models/Task.js';
import { createNotification } from './notifications.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Helper function to find item by search query
const findTaskByQuery = async (userId, searchQuery) => {
    if (!searchQuery) return null;

    // Try exact title match first
    let task = await Task.findOne({
        user: userId,
        title: { $regex: searchQuery, $options: 'i' }
    });

    if (!task) {
        // Try partial match
        task = await Task.findOne({
            user: userId,
            $or: [
                { title: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } }
            ]
        });
    }

    return task;
};

const findNoteByQuery = async (userId, searchQuery) => {
    if (!searchQuery) return null;

    let note = await Note.findOne({
        user: userId,
        title: { $regex: searchQuery, $options: 'i' }
    });

    if (!note) {
        note = await Note.findOne({
            user: userId,
            $or: [
                { title: { $regex: searchQuery, $options: 'i' } },
                { content: { $regex: searchQuery, $options: 'i' } }
            ]
        });
    }

    return note;
};

// @route   POST /api/assistant/chat
// @desc    Chat with AI assistant (handles both chat and CRUD commands)
// @access  Private
router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;

        // First, check if this is a CRUD command
        const command = await aiService.parseCommand(message);

        if (command.isCommand) {
            // Execute CRUD operation
            const result = await executeCRUDCommand(command, req.user._id);
            return res.json({
                response: result.message,
                action: command.action,
                data: result.data,
                success: result.success
            });
        }

        // Not a command, proceed with regular chat
        const notes = await Note.find({ user: req.user._id }).limit(5).sort({ updatedAt: -1 });
        const tasks = await Task.find({ user: req.user._id });

        const context = {
            notesCount: await Note.countDocuments({ user: req.user._id }),
            tasksCount: tasks.length,
            completedTasksCount: tasks.filter(t => t.completed).length,
            recentNotes: notes,
        };

        const response = await aiService.chat(message, context);
        res.json({ response });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Execute CRUD commands
async function executeCRUDCommand(command, userId) {
    const { action, data } = command;

    try {
        switch (action) {
            case 'create_task': {
                const taskData = {
                    user: userId,
                    title: data.title || 'Untitled Task',
                    description: data.content || '',
                    category: data.category || 'Personal',
                    priority: data.priority || 'medium',
                    dueDate: data.dueDate || null,
                };

                const task = await Task.create(taskData);

                // Create notification
                await createNotification(
                    userId,
                    'task_created',
                    'Task Created',
                    `New task "${task.title}" has been created via AI Assistant`,
                    { entityType: 'task', entityId: task._id }
                );

                return {
                    success: true,
                    message: `✅ Task created successfully!\n\n**Title:** ${task.title}${task.dueDate ? `\n**Due:** ${new Date(task.dueDate).toLocaleDateString()}` : ''}${task.priority !== 'medium' ? `\n**Priority:** ${task.priority}` : ''}\n**Category:** ${task.category}`,
                    data: task
                };
            }

            case 'create_note': {
                const noteData = {
                    user: userId,
                    title: data.title || 'Untitled Note',
                    content: data.content || data.title || 'Note created via AI Assistant',
                };

                // Generate AI summary
                const aiResult = await aiService.generateNoteSummary(noteData.content);
                noteData.aiSummary = aiResult.summary;
                noteData.aiActionItems = aiResult.actionItems;
                noteData.aiTags = aiResult.tags;

                const note = await Note.create(noteData);

                // Create notification
                await createNotification(
                    userId,
                    'note_created',
                    'Note Created',
                    `New note "${note.title}" has been created via AI Assistant`,
                    { entityType: 'note', entityId: note._id }
                );

                return {
                    success: true,
                    message: `✅ Note created successfully!\n\n**Title:** ${note.title}${note.aiTags?.length ? `\n**Tags:** ${note.aiTags.join(', ')}` : ''}`,
                    data: note
                };
            }

            case 'complete_task': {
                const task = await findTaskByQuery(userId, data.searchQuery || data.title);

                if (!task) {
                    return {
                        success: false,
                        message: `❌ Could not find a task matching "${data.searchQuery || data.title}". Try being more specific or check your task list.`,
                        data: null
                    };
                }

                task.completed = true;
                task.status = 'completed';
                task.completedAt = new Date();
                await task.save();

                // Create notification
                await createNotification(
                    userId,
                    'task_completed',
                    'Task Completed',
                    `Great job! You completed "${task.title}"`,
                    { entityType: 'task', entityId: task._id }
                );

                return {
                    success: true,
                    message: `✅ Task "${task.title}" marked as completed! Great job! 🎉`,
                    data: task
                };
            }

            case 'delete_task': {
                const task = await findTaskByQuery(userId, data.searchQuery || data.title);

                if (!task) {
                    return {
                        success: false,
                        message: `❌ Could not find a task matching "${data.searchQuery || data.title}". Try being more specific.`,
                        data: null
                    };
                }

                const taskTitle = task.title;
                await task.deleteOne();

                return {
                    success: true,
                    message: `✅ Task "${taskTitle}" has been deleted.`,
                    data: { deletedTitle: taskTitle }
                };
            }

            case 'delete_note': {
                const note = await findNoteByQuery(userId, data.searchQuery || data.title);

                if (!note) {
                    return {
                        success: false,
                        message: `❌ Could not find a note matching "${data.searchQuery || data.title}". Try being more specific.`,
                        data: null
                    };
                }

                const noteTitle = note.title;
                await note.deleteOne();

                return {
                    success: true,
                    message: `✅ Note "${noteTitle}" has been deleted.`,
                    data: { deletedTitle: noteTitle }
                };
            }

            case 'update_task': {
                const task = await findTaskByQuery(userId, data.searchQuery || data.title);

                if (!task) {
                    return {
                        success: false,
                        message: `❌ Could not find a task to update. Try specifying the task name.`,
                        data: null
                    };
                }

                // Update fields if provided
                if (data.title && data.title !== task.title) task.title = data.title;
                if (data.content) task.description = data.content;
                if (data.priority) task.priority = data.priority;
                if (data.category) task.category = data.category;
                if (data.dueDate) task.dueDate = data.dueDate;

                await task.save();

                return {
                    success: true,
                    message: `✅ Task "${task.title}" has been updated.`,
                    data: task
                };
            }

            case 'update_note': {
                const note = await findNoteByQuery(userId, data.searchQuery || data.title);

                if (!note) {
                    return {
                        success: false,
                        message: `❌ Could not find a note to update. Try specifying the note name.`,
                        data: null
                    };
                }

                if (data.content) {
                    note.content = data.content;
                    const aiResult = await aiService.generateNoteSummary(data.content);
                    note.aiSummary = aiResult.summary;
                    note.aiActionItems = aiResult.actionItems;
                    note.aiTags = aiResult.tags;
                }
                if (data.title) note.title = data.title;

                await note.save();

                return {
                    success: true,
                    message: `✅ Note "${note.title}" has been updated.`,
                    data: note
                };
            }

            case 'list_tasks': {
                const tasks = await Task.find({ user: userId }).sort({ dueDate: 1, createdAt: -1 }).limit(10);

                if (tasks.length === 0) {
                    return {
                        success: true,
                        message: "📋 You don't have any tasks yet. Try saying 'Create a task called...' to add one!",
                        data: []
                    };
                }

                const taskList = tasks.map((t, i) => {
                    const status = t.completed ? '✅' : '⬜';
                    const priority = t.priority === 'high' ? '🔴' : t.priority === 'low' ? '🟢' : '🟡';
                    const due = t.dueDate ? ` (Due: ${new Date(t.dueDate).toLocaleDateString()})` : '';
                    return `${i + 1}. ${status} ${priority} ${t.title}${due}`;
                }).join('\n');

                const pendingCount = tasks.filter(t => !t.completed).length;
                const completedCount = tasks.filter(t => t.completed).length;

                return {
                    success: true,
                    message: `📋 **Your Tasks** (${pendingCount} pending, ${completedCount} completed)\n\n${taskList}`,
                    data: tasks
                };
            }

            case 'list_notes': {
                const notes = await Note.find({ user: userId }).sort({ updatedAt: -1 }).limit(10);

                if (notes.length === 0) {
                    return {
                        success: true,
                        message: "📝 You don't have any notes yet. Try saying 'Add a note about...' to create one!",
                        data: []
                    };
                }

                const noteList = notes.map((n, i) => {
                    const pinned = n.isPinned ? '📌 ' : '';
                    const tags = n.aiTags?.length ? ` [${n.aiTags.slice(0, 2).join(', ')}]` : '';
                    return `${i + 1}. ${pinned}${n.title}${tags}`;
                }).join('\n');

                return {
                    success: true,
                    message: `📝 **Your Notes** (${notes.length} total)\n\n${noteList}`,
                    data: notes
                };
            }

            default:
                return {
                    success: false,
                    message: "I didn't understand that command. Try something like 'Create a task called...' or 'Show my tasks'.",
                    data: null
                };
        }
    } catch (error) {
        console.error('CRUD Command Error:', error);
        return {
            success: false,
            message: `❌ An error occurred: ${error.message}`,
            data: null
        };
    }
}

// @route   GET /api/assistant/weekly-summary
// @desc    Get weekly productivity summary
// @access  Private
router.get('/weekly-summary', async (req, res) => {
    try {
        // Get tasks and notes from the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const tasks = await Task.find({
            user: req.user._id,
            updatedAt: { $gte: sevenDaysAgo },
        });

        const notes = await Note.find({
            user: req.user._id,
            createdAt: { $gte: sevenDaysAgo },
        });

        const summary = await aiService.generateWeeklySummary(tasks, notes);
        res.json({ summary });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/assistant/suggest-priorities
// @desc    Get AI priority suggestions
// @access  Private
router.get('/suggest-priorities', async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user._id });
        const suggestions = await aiService.suggestPriorities(tasks);
        res.json({ suggestions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
