import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
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
        description: {
            type: String,
            default: '',
        },
        category: {
            type: String,
            enum: ['Work', 'Study', 'Personal'],
            default: 'Personal',
        },
        status: {
            type: String,
            enum: ['todo', 'in-progress', 'completed'],
            default: 'todo',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
        },
        dueDate: {
            type: Date,
        },
        dueTime: {
            type: String, // Format: "HH:MM"
            default: '',
        },
        subtasks: [
            {
                title: {
                    type: String,
                    required: true,
                },
                completed: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
        reminder: {
            enabled: {
                type: Boolean,
                default: false,
            },
            minutesBefore: {
                type: Number,
                enum: [15, 30, 60, 1440], // 15min, 30min, 1hr, 1day
                default: 30,
            },
        },
        // AI-generated fields
        aiPriorityScore: {
            impact: {
                type: String,
                enum: ['low', 'medium', 'high'],
            },
            effort: {
                type: String,
                enum: ['low', 'medium', 'high'],
            },
            urgency: {
                type: String,
                enum: ['low', 'medium', 'high'],
            },
            reasoning: String,
        },
        aiFocusMode: {
            steps: [String],
            motivationTip: String,
            estimatedEffort: String,
        },
        completed: {
            type: Boolean,
            default: false,
        },
        completedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Update completedAt when task is marked as completed
taskSchema.pre('save', function (next) {
    if (this.isModified('completed') && this.completed) {
        this.completedAt = new Date();
        this.status = 'completed';
    }
    next();
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
