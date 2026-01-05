import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        type: {
            type: String,
            enum: ['task_due', 'task_overdue', 'task_created', 'note_created', 'ai_suggestion', 'welcome', 'task_completed'],
            default: 'ai_suggestion',
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        read: {
            type: Boolean,
            default: false,
        },
        relatedEntity: {
            entityType: {
                type: String,
                enum: ['task', 'note', null],
            },
            entityId: {
                type: mongoose.Schema.Types.ObjectId,
            },
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
