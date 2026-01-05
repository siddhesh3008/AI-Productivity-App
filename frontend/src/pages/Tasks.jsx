import React, { useState, useEffect } from 'react';
import { Plus, Filter, CheckCircle, Circle, Sparkles, Zap, Trash2, Edit, Clock, Bell, X } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [focusTask, setFocusTask] = useState(null);
    const [newSubtask, setNewSubtask] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Personal',
        priority: 'medium',
        dueDate: '',
        dueTime: '',
        subtasks: [],
        reminder: { enabled: false, minutesBefore: 30 },
    });

    const categories = ['All', 'Work', 'Study', 'Personal'];

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const { data } = await api.get('/tasks');
            setTasks(data);
        } catch (error) {
            toast.error('Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTask) {
                const { data } = await api.put(`/tasks/${editingTask._id}`, formData);
                setTasks(tasks.map(t => t._id === editingTask._id ? data : t));
                toast.success('Task updated!');
            } else {
                const { data } = await api.post('/tasks', formData);
                setTasks([data, ...tasks]);
                toast.success('Task created!');
            }
            closeModal();
        } catch (error) {
            toast.error('Failed to save task');
        }
    };

    const handleToggle = async (task) => {
        try {
            const { data } = await api.patch(`/tasks/${task._id}/toggle`);
            setTasks(tasks.map(t => t._id === task._id ? data : t));
            toast.success(data.completed ? 'Task completed!' : 'Task reopened');
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await api.delete(`/tasks/${id}`);
            setTasks(tasks.filter(t => t._id !== id));
            toast.success('Task deleted');
        } catch (error) {
            toast.error('Failed to delete task');
        }
    };

    const handleAIPriority = async (task) => {
        try {
            const { data } = await api.post(`/tasks/${task._id}/ai-priority`);
            setTasks(tasks.map(t => t._id === task._id ? data : t));
            toast.success('AI priority score generated!');
        } catch (error) {
            toast.error('Failed to generate priority score');
        }
    };

    const handleFocusMode = async (task) => {
        try {
            const { data } = await api.post(`/tasks/${task._id}/focus-mode`);
            setFocusTask(data);
            setIsFocusModeOpen(true);
        } catch (error) {
            toast.error('Failed to generate focus mode');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
        setNewSubtask('');
        setFormData({
            title: '',
            description: '',
            category: 'Personal',
            priority: 'medium',
            dueDate: '',
            dueTime: '',
            subtasks: [],
            reminder: { enabled: false, minutesBefore: 30 },
        });
    };

    const openEditModal = (task) => {
        setEditingTask(task);
        setFormData({
            title: task.title,
            description: task.description || '',
            category: task.category,
            priority: task.priority,
            dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
            dueTime: task.dueTime || '',
            subtasks: task.subtasks || [],
            reminder: task.reminder || { enabled: false, minutesBefore: 30 },
        });
        setIsModalOpen(true);
    };

    const addSubtask = () => {
        if (!newSubtask.trim()) return;
        setFormData({
            ...formData,
            subtasks: [...formData.subtasks, { title: newSubtask.trim(), completed: false }],
        });
        setNewSubtask('');
    };

    const removeSubtask = (index) => {
        setFormData({
            ...formData,
            subtasks: formData.subtasks.filter((_, i) => i !== index),
        });
    };

    const toggleSubtaskInForm = (index) => {
        const updatedSubtasks = formData.subtasks.map((st, i) =>
            i === index ? { ...st, completed: !st.completed } : st
        );
        setFormData({ ...formData, subtasks: updatedSubtasks });
    };

    const handleSubtaskToggle = async (taskId, subtaskId) => {
        try {
            const { data } = await api.patch(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
            setTasks(tasks.map(t => t._id === taskId ? data : t));
        } catch (error) {
            toast.error('Failed to update subtask');
        }
    };

    const filteredTasks = activeCategory === 'All'
        ? tasks
        : tasks.filter(task => task.category === activeCategory);

    if (loading) {
        return <LoadingSpinner size="lg" className="mt-20" />;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Tasks
                    </h1>
                    <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
                        New Task
                    </Button>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage your tasks with AI-powered priority insights
                </p>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${activeCategory === cat
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Tasks List */}
            {filteredTasks.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No tasks in this category. Add one to get started!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTasks.map((task) => (
                        <div key={task._id} className="card p-5 hover:shadow-lg transition-shadow">
                            <div className="flex items-start gap-4">
                                {/* Checkbox */}
                                <button
                                    onClick={() => handleToggle(task)}
                                    className="mt-1 text-gray-400 hover:text-primary-500 transition-colors"
                                >
                                    {task.completed ? (
                                        <CheckCircle className="w-6 h-6 text-green-500" />
                                    ) : (
                                        <Circle className="w-6 h-6" />
                                    )}
                                </button>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className={`font-semibold text-lg ${task.completed
                                                ? 'line-through text-gray-400'
                                                : 'text-gray-900 dark:text-gray-100'
                                                }`}>
                                                {task.title}
                                            </h3>
                                            {task.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    {task.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEditModal(task)}
                                                className="btn-icon text-gray-500 hover:text-primary-500"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(task._id)}
                                                className="btn-icon text-gray-500 hover:text-red-500"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Meta */}
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <span className={`badge ${task.priority === 'high' ? 'badge-danger' :
                                            task.priority === 'medium' ? 'badge-warning' :
                                                'badge-success'
                                            }`}>
                                            {task.priority}
                                        </span>
                                        <span className="badge badge-primary">{task.category}</span>
                                        {task.dueDate && (
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(task.dueDate).toLocaleDateString()}
                                                {task.dueTime && ` at ${task.dueTime}`}
                                            </span>
                                        )}
                                        {task.reminder?.enabled && (
                                            <span className="text-xs text-blue-500 flex items-center gap-1">
                                                <Bell className="w-3 h-3" />
                                                Reminder
                                            </span>
                                        )}
                                    </div>

                                    {/* Subtasks Progress */}
                                    {task.subtasks && task.subtasks.length > 0 && (
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                    Subtasks: {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                                                </span>
                                                <div className="flex-1 ml-3 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-300"
                                                        style={{ width: `${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                {task.subtasks.map((subtask) => (
                                                    <div
                                                        key={subtask._id}
                                                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-1 rounded transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSubtaskToggle(task._id, subtask._id);
                                                        }}
                                                    >
                                                        {subtask.completed ? (
                                                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                        ) : (
                                                            <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                        )}
                                                        <span className={subtask.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}>
                                                            {subtask.title}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* AI Priority Score */}
                                    {task.aiPriorityScore && (
                                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg mb-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Sparkles className="w-4 h-4 text-purple-500" />
                                                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                                                    AI Priority Analysis
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                <div>Impact: <span className="font-semibold">{task.aiPriorityScore.impact}</span></div>
                                                <div>Effort: <span className="font-semibold">{task.aiPriorityScore.effort}</span></div>
                                                <div>Urgency: <span className="font-semibold">{task.aiPriorityScore.urgency}</span></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {!task.completed && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAIPriority(task)}
                                                className="flex-1 flex items-center justify-center gap-2 text-xs px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                                AI Priority
                                            </button>
                                            <button
                                                onClick={() => handleFocusMode(task)}
                                                className="flex-1 flex items-center justify-center gap-2 text-xs px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                            >
                                                <Zap className="w-4 h-4" />
                                                Focus Mode
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingTask ? 'Edit Task' : 'Create Task'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter task title..."
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Enter task description..."
                            rows={4}
                            className="input-field resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Category
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="input-field"
                            >
                                <option value="Work">Work</option>
                                <option value="Study">Study</option>
                                <option value="Personal">Personal</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Priority
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="input-field"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Due Date"
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        />
                        <Input
                            label="Due Time"
                            type="time"
                            value={formData.dueTime}
                            onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                        />
                    </div>

                    {/* Subtasks */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Subtasks
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={newSubtask}
                                onChange={(e) => setNewSubtask(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                                placeholder="Add a subtask..."
                                className="input-field flex-1"
                            />
                            <Button type="button" onClick={addSubtask} variant="secondary" icon={Plus}>
                                Add
                            </Button>
                        </div>
                        {formData.subtasks.length > 0 && (
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {formData.subtasks.map((subtask, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => toggleSubtaskInForm(index)}
                                            className="text-gray-400 hover:text-primary-500"
                                        >
                                            {subtask.completed ? (
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <Circle className="w-5 h-5" />
                                            )}
                                        </button>
                                        <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-gray-400' : ''}`}>
                                            {subtask.title}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeSubtask(index)}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Reminder */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg gap-3">
                        <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-primary-500" />
                            <span className="font-medium text-gray-700 dark:text-gray-300">Set Reminder</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={formData.reminder.minutesBefore}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    reminder: { ...formData.reminder, minutesBefore: parseInt(e.target.value) }
                                })}
                                disabled={!formData.reminder.enabled}
                                className="input-field py-1 px-2 text-sm w-full sm:w-32"
                            >
                                <option value={15}>15 min before</option>
                                <option value={30}>30 min before</option>
                                <option value={60}>1 hour before</option>
                                <option value={1440}>1 day before</option>
                            </select>
                            <button
                                type="button"
                                onClick={() => setFormData({
                                    ...formData,
                                    reminder: { ...formData.reminder, enabled: !formData.reminder.enabled }
                                })}
                                className={`w-12 h-6 rounded-full transition-colors ${formData.reminder.enabled
                                    ? 'bg-blue-500'
                                    : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.reminder.enabled ? 'translate-x-6' : 'translate-x-0.5'
                                    }`} />
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                            {editingTask ? 'Update' : 'Create'} Task
                        </Button>
                        <Button type="button" variant="secondary" onClick={closeModal}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Focus Mode Modal */}
            <Modal
                isOpen={isFocusModeOpen}
                onClose={() => setIsFocusModeOpen(false)}
                title="🎯 Focus Mode"
            >
                {focusTask?.aiFocusMode && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold mb-2">{focusTask.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {focusTask.description}
                            </p>
                        </div>

                        {/* Steps */}
                        <div>
                            <h4 className="font-semibold mb-3">Action Steps:</h4>
                            <div className="space-y-2">
                                {focusTask.aiFocusMode.steps.map((step, i) => (
                                    <div key={i} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-semibold">
                                            {i + 1}
                                        </span>
                                        <p className="text-sm">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Motivation */}
                        <div className="bg-gradient-to-r from-accent-500 to-primary-500 p-4 rounded-lg text-white">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="w-5 h-5" />
                                <span className="font-semibold">Motivation</span>
                            </div>
                            <p className="text-sm opacity-90">{focusTask.aiFocusMode.motivationTip}</p>
                        </div>

                        {/* Effort */}
                        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                            Estimated time: <span className="font-semibold">{focusTask.aiFocusMode.estimatedEffort}</span>
                        </div>

                        <Button
                            onClick={() => setIsFocusModeOpen(false)}
                            className="w-full"
                        >
                            Start Working!
                        </Button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Tasks;
