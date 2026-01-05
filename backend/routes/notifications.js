import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/notifications
// @desc    Get all notifications for user
// @access  Private
router.get('/', async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            user: req.user._id,
            read: false,
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.patch('/:id/read', async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        notification.read = true;
        await notification.save();

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PATCH /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.patch('/mark-all-read', async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, read: false },
            { read: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/notifications/clear-all
// @desc    Clear all notifications
// @access  Private
// NOTE: This route must be defined BEFORE /:id to avoid 'clear-all' being matched as an id
router.delete('/clear-all', async (req, res) => {
    try {
        await Notification.deleteMany({ user: req.user._id });
        res.json({ message: 'All notifications cleared' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await notification.deleteOne();
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Helper function to create notifications (exported for use in other routes)
export const createNotification = async (userId, type, title, message, relatedEntity = null) => {
    try {
        const notification = await Notification.create({
            user: userId,
            type,
            title,
            message,
            relatedEntity,
        });
        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error.message);
        return null;
    }
};

export default router;
