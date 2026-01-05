import express from 'express';
import Task from '../models/Task.js';
import { protect } from '../middleware/auth.js';
import aiService from '../services/aiService.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/tasks
// @desc    Get all tasks for user
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { category, status, completed } = req.query;
        let query = { user: req.user._id };

        // Filters
        if (category) query.category = category;
        if (status) query.status = status;
        if (completed !== undefined) query.completed = completed === 'true';

        const tasks = await Task.find(query).sort({ dueDate: 1, updatedAt: -1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/tasks/stats
// @desc    Get task statistics
// @access  Private
router.get('/stats', async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user._id });

        const stats = {
            total: tasks.length,
            completed: tasks.filter(t => t.completed).length,
            pending: tasks.filter(t => !t.completed).length,
            byCategory: {
                Work: tasks.filter(t => t.category === 'Work').length,
                Study: tasks.filter(t => t.category === 'Study').length,
                Personal: tasks.filter(t => t.category === 'Personal').length,
            },
            byPriority: {
                high: tasks.filter(t => t.priority === 'high').length,
                medium: tasks.filter(t => t.priority === 'medium').length,
                low: tasks.filter(t => t.priority === 'low').length,
            }
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Make sure user owns task
        if (task.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/tasks
// @desc    Create a task
// @access  Private
router.post('/', async (req, res) => {
    try {
        const { title, description, category, priority, dueDate, dueTime, subtasks, reminder } = req.body;

        const task = await Task.create({
            user: req.user._id,
            title,
            description,
            category: category || 'Personal',
            priority: priority || 'medium',
            dueDate,
            dueTime: dueTime || '',
            subtasks: subtasks || [],
            reminder: reminder || { enabled: false, minutesBefore: 30 },
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Make sure user owns task
        if (task.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Make sure user owns task
        if (task.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await task.deleteOne();
        res.json({ message: 'Task removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/tasks/:id/ai-priority
// @desc    Generate AI priority score for task
// @access  Private
router.post('/:id/ai-priority', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Make sure user owns task
        if (task.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const priorityScore = await aiService.generatePriorityScore(
            task.title,
            task.description
        );

        task.aiPriorityScore = priorityScore;
        await task.save();

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/tasks/:id/focus-mode
// @desc    Generate AI focus mode breakdown
// @access  Private
router.post('/:id/focus-mode', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Make sure user owns task
        if (task.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const focusMode = await aiService.generateFocusMode(
            task.title,
            task.description
        );

        task.aiFocusMode = focusMode;
        await task.save();

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PATCH /api/tasks/:id/toggle
// @desc    Toggle task completion
// @access  Private
router.patch('/:id/toggle', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Make sure user owns task
        if (task.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        task.completed = !task.completed;
        await task.save();

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PATCH /api/tasks/:id/subtasks/:subtaskId/toggle
// @desc    Toggle subtask completion
// @access  Private
router.patch('/:id/subtasks/:subtaskId/toggle', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Make sure user owns task
        if (task.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const subtask = task.subtasks.id(req.params.subtaskId);
        if (!subtask) {
            return res.status(404).json({ message: 'Subtask not found' });
        }

        subtask.completed = !subtask.completed;
        await task.save();

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
