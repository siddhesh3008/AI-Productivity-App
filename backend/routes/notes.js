import express from 'express';
import Note from '../models/Note.js';
import { protect } from '../middleware/auth.js';
import aiService from '../services/aiService.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/notes
// @desc    Get all notes for user
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { search, tag } = req.query;
        let query = { user: req.user._id };

        // Text search
        if (search) {
            query.$text = { $search: search };
        }

        // Tag filter
        if (tag) {
            query.aiTags = tag;
        }

        const notes = await Note.find(query).sort({ updatedAt: -1 });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/notes/:id
// @desc    Get single note
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Make sure user owns note
        if (note.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.json(note);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/notes
// @desc    Create a note
// @access  Private
router.post('/', async (req, res) => {
    try {
        const { title, content, color } = req.body;

        // Generate AI summary and tags
        const aiResult = await aiService.generateNoteSummary(content);

        const note = await Note.create({
            user: req.user._id,
            title,
            content,
            color: color || '#ffffff',
            aiSummary: aiResult.summary,
            aiActionItems: aiResult.actionItems,
            aiTags: aiResult.tags,
        });

        res.status(201).json(note);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/notes/:id
// @desc    Update a note
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Make sure user owns note
        if (note.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const { title, content, color, isPinned } = req.body;

        // If content changed, regenerate AI summary
        let aiUpdate = {};
        if (content && content !== note.content) {
            const aiResult = await aiService.generateNoteSummary(content);
            aiUpdate = {
                aiSummary: aiResult.summary,
                aiActionItems: aiResult.actionItems,
                aiTags: aiResult.tags,
            };
        }

        const updatedNote = await Note.findByIdAndUpdate(
            req.params.id,
            {
                title: title || note.title,
                content: content || note.content,
                color: color !== undefined ? color : note.color,
                isPinned: isPinned !== undefined ? isPinned : note.isPinned,
                ...aiUpdate,
            },
            { new: true }
        );

        res.json(updatedNote);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/notes/:id
// @desc    Delete a note
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Make sure user owns note
        if (note.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await note.deleteOne();
        res.json({ message: 'Note removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/notes/:id/rewrite
// @desc    Rewrite note with AI
// @access  Private
router.post('/:id/rewrite', async (req, res) => {
    try {
        const { style } = req.body; // 'polish', 'bullets', 'shorten'
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Make sure user owns note
        if (note.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const rewrittenContent = await aiService.rewriteNote(note.content, style);
        res.json({ rewrittenContent });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/notes/:id/regenerate-tags
// @desc    Regenerate AI tags for a note
// @access  Private
router.post('/:id/regenerate-tags', async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Make sure user owns note
        if (note.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const tags = await aiService.generateTags(note.content);
        note.aiTags = tags;
        await note.save();

        res.json(note);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
