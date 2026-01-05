import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        title: {
            type: String,
            required: [true, 'Please provide a title'],
            trim: true,
        },
        content: {
            type: String,
            required: [true, 'Please provide content'],
        },
        // AI-generated fields
        aiSummary: {
            type: String,
            default: '',
        },
        aiActionItems: [
            {
                type: String,
            },
        ],
        aiTags: [
            {
                type: String,
            },
        ],
        // Metadata
        isPinned: {
            type: Boolean,
            default: false,
        },
        color: {
            type: String,
            default: '#ffffff',
        },
    },
    {
        timestamps: true,
    }
);

// Index for text search
noteSchema.index({ title: 'text', content: 'text' });

const Note = mongoose.model('Note', noteSchema);

export default Note;
