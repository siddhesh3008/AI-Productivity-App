import React, { useState, useEffect } from 'react';
import {
    Plus, TrendingUp, CheckCircle2, StickyNote, Target,
    Calendar, X, Clock, FileText, Sparkles, ArrowRight,
    ListTodo, BookOpen, Wand2, Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [recentNotes, setRecentNotes] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Calendar state
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addType, setAddType] = useState('task');
    const [newItemTitle, setNewItemTitle] = useState('');
    const [newItemContent, setNewItemContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // AI Scheduling state
    const [aiInput, setAiInput] = useState('');
    const [isAiProcessing, setIsAiProcessing] = useState(false);

    // Quick create modal (for Note/Task buttons)
    const [showQuickCreate, setShowQuickCreate] = useState(false);
    const [quickCreateType, setQuickCreateType] = useState('task'); // 'task' or 'note'
    const [quickAiMode, setQuickAiMode] = useState(false);
    const [aiResult, setAiResult] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [notesRes, tasksRes, statsRes] = await Promise.all([
                api.get('/notes?limit=3'),
                api.get('/tasks?completed=false&limit=5'),
                api.get('/tasks/stats'),
            ]);

            setRecentNotes(notesRes.data.slice(0, 3));
            setTasks(tasksRes.data.slice(0, 5));
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Generate calendar days for current month
    const generateCalendarDays = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setShowCalendar(false);
        setShowAddModal(true);
        setSuccessMessage('');
    };

    const handleAddItem = async () => {
        if (!newItemTitle.trim()) return;

        setIsSubmitting(true);
        setSuccessMessage('');

        try {
            if (addType === 'task') {
                await api.post('/tasks', {
                    title: newItemTitle,
                    description: newItemContent || '',
                    dueDate: selectedDate ? selectedDate.toISOString() : null,
                    priority: 'medium',
                    category: 'Personal'
                });
                setSuccessMessage('✓ Task created successfully!');
            } else {
                await api.post('/notes', {
                    title: newItemTitle,
                    content: newItemContent || `Note created for ${selectedDate?.toLocaleDateString() || 'today'}`
                });
                setSuccessMessage('✓ Note created successfully!');
            }

            // Refresh data
            await fetchDashboardData();

            // Reset form but keep modal open to show success
            setNewItemTitle('');
            setNewItemContent('');

            // Auto close after showing success
            setTimeout(() => {
                setShowAddModal(false);
                setSelectedDate(null);
                setSuccessMessage('');
            }, 1500);

        } catch (error) {
            console.error('Error adding item:', error);
            setSuccessMessage('✗ Failed to create. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // AI Scheduling - Parse natural language input
    const parseAiInput = (input) => {
        const text = input.toLowerCase();
        let title = input;
        let dueDate = new Date();
        let isNote = false;

        // Detect if it's a note
        if (text.includes('note') || text.includes('remember') || text.includes('write down')) {
            isNote = true;
        }

        // Parse time expressions
        const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
        if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
            const isPM = timeMatch[3].toLowerCase() === 'pm';
            if (isPM && hours !== 12) hours += 12;
            if (!isPM && hours === 12) hours = 0;
            dueDate.setHours(hours, minutes, 0, 0);
        }

        // Parse day expressions
        if (text.includes('today')) {
            // Keep current date
        } else if (text.includes('tomorrow')) {
            dueDate.setDate(dueDate.getDate() + 1);
        } else if (text.includes('monday')) {
            dueDate = getNextDayOfWeek(1);
        } else if (text.includes('tuesday')) {
            dueDate = getNextDayOfWeek(2);
        } else if (text.includes('wednesday')) {
            dueDate = getNextDayOfWeek(3);
        } else if (text.includes('thursday')) {
            dueDate = getNextDayOfWeek(4);
        } else if (text.includes('friday')) {
            dueDate = getNextDayOfWeek(5);
        } else if (text.includes('saturday')) {
            dueDate = getNextDayOfWeek(6);
        } else if (text.includes('sunday')) {
            dueDate = getNextDayOfWeek(0);
        } else if (text.includes('next week')) {
            dueDate.setDate(dueDate.getDate() + 7);
        }

        // Clean up the title - remove time/date references
        title = title
            .replace(/\b(remind me to|remind me|schedule|add task|add note|create|note to self)\b/gi, '')
            .replace(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week)\b/gi, '')
            .replace(/\b(at|on|by)\s+\d{1,2}(:\d{2})?\s*(am|pm)\b/gi, '')
            .replace(/\b\d{1,2}(:\d{2})?\s*(am|pm)\b/gi, '')
            .trim();

        // Capitalize first letter
        title = title.charAt(0).toUpperCase() + title.slice(1);

        return { title, dueDate, isNote };
    };

    const getNextDayOfWeek = (dayIndex) => {
        const today = new Date();
        const currentDay = today.getDay();
        let daysUntilNext = dayIndex - currentDay;
        if (daysUntilNext <= 0) daysUntilNext += 7;
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() + daysUntilNext);
        return nextDay;
    };

    const handleAiSchedule = async () => {
        if (!aiInput.trim()) return;

        setIsAiProcessing(true);
        setAiResult(null);

        try {
            const parsed = parseAiInput(aiInput);

            if (parsed.isNote) {
                await api.post('/notes', {
                    title: parsed.title,
                    content: `AI-scheduled note: ${aiInput}`
                });
                setAiResult({ success: true, message: `✓ Note created: "${parsed.title}"` });
            } else {
                await api.post('/tasks', {
                    title: parsed.title,
                    description: `AI-scheduled: ${aiInput}`,
                    dueDate: parsed.dueDate.toISOString(),
                    priority: 'medium',
                    category: 'Personal'
                });
                setAiResult({
                    success: true,
                    message: `✓ Task scheduled: "${parsed.title}" for ${parsed.dueDate.toLocaleDateString()} ${parsed.dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                });
            }

            await fetchDashboardData();
            setAiInput('');

            setTimeout(() => setAiResult(null), 4000);

        } catch (error) {
            console.error('Error with AI scheduling:', error);
            setAiResult({ success: false, message: '✗ Failed to create. Please try again.' });
        } finally {
            setIsAiProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const statsCards = [
        {
            title: 'Total Tasks',
            value: stats?.total || 0,
            icon: Target,
            gradient: 'from-blue-500 to-blue-600',
            bgGradient: 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30',
            iconBg: 'bg-blue-500',
        },
        {
            title: 'Completed',
            value: stats?.completed || 0,
            icon: CheckCircle2,
            gradient: 'from-emerald-500 to-emerald-600',
            bgGradient: 'from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30',
            iconBg: 'bg-emerald-500',
        },
        {
            title: 'In Progress',
            value: stats?.pending || 0,
            icon: TrendingUp,
            gradient: 'from-amber-500 to-orange-500',
            bgGradient: 'from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-800/30',
            iconBg: 'bg-amber-500',
        },
        {
            title: 'Total Notes',
            value: recentNotes.length,
            icon: StickyNote,
            gradient: 'from-purple-500 to-violet-600',
            bgGradient: 'from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-800/30',
            iconBg: 'bg-purple-500',
        },
    ];

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const today = new Date();

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                        <Sparkles className="w-7 h-7 text-primary-500" />
                        Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Welcome back! Here's your productivity overview.
                    </p>
                </div>
                <div className="flex gap-2 sm:gap-3 flex-wrap">
                    <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                    >
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Schedule</span>
                    </button>
                    <button
                        onClick={() => {
                            setQuickCreateType('note');
                            setShowQuickCreate(true);
                            setNewItemTitle('');
                            setNewItemContent('');
                            setQuickAiMode(false);
                        }}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm sm:text-base"
                        title="New Note"
                    >
                        <StickyNote className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                        <span>Create Note</span>
                    </button>
                    <button
                        onClick={() => {
                            setQuickCreateType('task');
                            setShowQuickCreate(true);
                            setNewItemTitle('');
                            setNewItemContent('');
                            setQuickAiMode(false);
                        }}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm sm:text-base"
                        title="New Task"
                    >
                        <ListTodo className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                        <span>Create Task</span>
                    </button>
                </div>
            </div>

            {/* AI Quick Schedule */}
            <div className="card p-4 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border border-primary-200 dark:border-primary-800">
                <div className="flex items-center gap-2 mb-3">
                    <Wand2 className="w-5 h-5 text-primary-500" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">AI Quick Schedule</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                        • Try: "Remind me to submit report Friday at 4 PM"
                    </span>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAiSchedule()}
                        placeholder="Type naturally: 'Call mom tomorrow at 3 PM' or 'Note: Meeting summary'"
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                    <button
                        onClick={handleAiSchedule}
                        disabled={!aiInput.trim() || isAiProcessing}
                        className="px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isAiProcessing ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4" />}
                        <span className="hidden sm:inline">Create</span>
                    </button>
                </div>
                {aiResult && (
                    <p className={`mt-2 text-sm ${aiResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {aiResult.message}
                    </p>
                )}
            </div>

            {/* Calendar Popup */}
            {showCalendar && (
                <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowCalendar(false)}>
                    <div
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary-500" />
                                {monthNames[today.getMonth()]} {today.getFullYear()}
                            </h3>
                            <button
                                onClick={() => setShowCalendar(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {generateCalendarDays().map((date, index) => (
                                <button
                                    key={index}
                                    onClick={() => date && handleDateSelect(date)}
                                    disabled={!date}
                                    className={`
                                        aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                                        ${!date ? 'invisible' : 'cursor-pointer'}
                                        ${date?.toDateString() === today.toDateString()
                                            ? 'bg-primary-500 text-white'
                                            : 'hover:bg-primary-100 dark:hover:bg-primary-900/30 text-gray-700 dark:text-gray-300'}
                                    `}
                                >
                                    {date?.getDate()}
                                </button>
                            ))}
                        </div>

                        <p className="text-center text-sm text-gray-500 mt-4">
                            Click a date to add a task or note
                        </p>
                    </div>
                </div>
            )}

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                    <div
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary-500" />
                                Add for {selectedDate?.toLocaleDateString()}
                            </h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {successMessage && (
                            <div className={`mb-4 p-3 rounded-lg text-center font-medium ${successMessage.startsWith('✓')
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                }`}>
                                {successMessage}
                            </div>
                        )}

                        {/* Type Toggle */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setAddType('task')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${addType === 'task'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                <ListTodo className="w-5 h-5" />
                                Task
                            </button>
                            <button
                                onClick={() => setAddType('note')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${addType === 'note'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                <BookOpen className="w-5 h-5" />
                                Note
                            </button>
                        </div>

                        {/* Form */}
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder={addType === 'task' ? 'Task title...' : 'Note title...'}
                                value={newItemTitle}
                                onChange={(e) => setNewItemTitle(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                autoFocus
                            />
                            <textarea
                                placeholder={addType === 'task' ? 'Description (optional)...' : 'Note content...'}
                                value={newItemContent}
                                onChange={(e) => setNewItemContent(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                            />
                            <button
                                onClick={handleAddItem}
                                disabled={!newItemTitle.trim() || isSubmitting}
                                className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <LoadingSpinner size="sm" />
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        Add {addType === 'task' ? 'Task' : 'Note'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Create Modal (for Note/Task buttons) */}
            {showQuickCreate && (
                <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowQuickCreate(false)}>
                    <div
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                {quickCreateType === 'note' ? (
                                    <><StickyNote className="w-5 h-5 text-purple-500" /> Create Note</>
                                ) : (
                                    <><ListTodo className="w-5 h-5 text-blue-500" /> Create Task</>
                                )}
                            </h3>
                            <button
                                onClick={() => setShowQuickCreate(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {successMessage && (
                            <div className={`mb-4 p-3 rounded-lg text-center font-medium ${successMessage.startsWith('✓')
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                }`}>
                                {successMessage}
                            </div>
                        )}

                        {/* Manual vs AI Toggle */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setQuickAiMode(false)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all text-sm ${!quickAiMode
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                <Plus className="w-4 h-4" />
                                Manual
                            </button>
                            <button
                                onClick={() => setQuickAiMode(true)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all text-sm ${quickAiMode
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                <Wand2 className="w-4 h-4" />
                                With AI
                            </button>
                        </div>

                        {/* Form */}
                        <div className="space-y-4">
                            {quickAiMode ? (
                                <>
                                    <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            <Sparkles className="w-4 h-4 inline mr-1 text-purple-500" />
                                            Describe what you want in natural language:
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                            {quickCreateType === 'task'
                                                ? 'Example: "Call mom tomorrow at 3 PM" or "Submit report by Friday"'
                                                : 'Example: "Meeting notes from today" or "Ideas for project launch"'
                                            }
                                        </p>
                                    </div>
                                    <textarea
                                        placeholder={quickCreateType === 'task'
                                            ? 'Describe your task...'
                                            : 'Describe your note...'}
                                        value={newItemContent}
                                        onChange={(e) => setNewItemContent(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                        autoFocus
                                    />
                                    <button
                                        onClick={async () => {
                                            if (!newItemContent.trim()) return;
                                            setIsSubmitting(true);
                                            setSuccessMessage('');
                                            try {
                                                const parsed = parseAiInput(newItemContent);
                                                if (quickCreateType === 'task') {
                                                    await api.post('/tasks', {
                                                        title: parsed.title || newItemContent.slice(0, 50),
                                                        description: newItemContent,
                                                        dueDate: parsed.dueDate.toISOString(),
                                                        priority: 'medium',
                                                        category: 'Personal'
                                                    });
                                                    setSuccessMessage(`✓ Task created: "${parsed.title}"`);
                                                } else {
                                                    await api.post('/notes', {
                                                        title: parsed.title || newItemContent.slice(0, 50),
                                                        content: newItemContent
                                                    });
                                                    setSuccessMessage(`✓ Note created: "${parsed.title}"`);
                                                }
                                                await fetchDashboardData();
                                                setNewItemContent('');
                                                setTimeout(() => {
                                                    setShowQuickCreate(false);
                                                    setSuccessMessage('');
                                                }, 1500);
                                            } catch (error) {
                                                console.error('Error:', error);
                                                setSuccessMessage('✗ Failed. Please try again.');
                                            } finally {
                                                setIsSubmitting(false);
                                            }
                                        }}
                                        disabled={!newItemContent.trim() || isSubmitting}
                                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <LoadingSpinner size="sm" />
                                        ) : (
                                            <>
                                                <Wand2 className="w-5 h-5" />
                                                Create with AI
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        placeholder={quickCreateType === 'task' ? 'Task title...' : 'Note title...'}
                                        value={newItemTitle}
                                        onChange={(e) => setNewItemTitle(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        autoFocus
                                    />
                                    <textarea
                                        placeholder={quickCreateType === 'task' ? 'Description (optional)...' : 'Note content...'}
                                        value={newItemContent}
                                        onChange={(e) => setNewItemContent(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                    />
                                    <button
                                        onClick={async () => {
                                            if (!newItemTitle.trim()) return;
                                            setIsSubmitting(true);
                                            setSuccessMessage('');
                                            try {
                                                if (quickCreateType === 'task') {
                                                    await api.post('/tasks', {
                                                        title: newItemTitle,
                                                        description: newItemContent || '',
                                                        priority: 'medium',
                                                        category: 'Personal'
                                                    });
                                                    setSuccessMessage('✓ Task created successfully!');
                                                } else {
                                                    await api.post('/notes', {
                                                        title: newItemTitle,
                                                        content: newItemContent || 'No content'
                                                    });
                                                    setSuccessMessage('✓ Note created successfully!');
                                                }
                                                await fetchDashboardData();
                                                setNewItemTitle('');
                                                setNewItemContent('');
                                                setTimeout(() => {
                                                    setShowQuickCreate(false);
                                                    setSuccessMessage('');
                                                }, 1500);
                                            } catch (error) {
                                                console.error('Error:', error);
                                                setSuccessMessage('✗ Failed. Please try again.');
                                            } finally {
                                                setIsSubmitting(false);
                                            }
                                        }}
                                        disabled={!newItemTitle.trim() || isSubmitting}
                                        className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <LoadingSpinner size="sm" />
                                        ) : (
                                            <>
                                                <Plus className="w-5 h-5" />
                                                Create {quickCreateType === 'task' ? 'Task' : 'Note'}
                                            </>
                                        )}
                                    </button>
                                </>
                            )}

                            {/* Go to full page link */}
                            <button
                                onClick={() => {
                                    setShowQuickCreate(false);
                                    navigate(quickCreateType === 'task' ? '/tasks' : '/notes');
                                }}
                                className="w-full text-center text-sm text-gray-500 hover:text-primary-500 transition-colors py-2"
                            >
                                Go to {quickCreateType === 'task' ? 'Tasks' : 'Notes'} page →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid - Smaller Square Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {statsCards.map((stat, index) => (
                    <div
                        key={index}
                        className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${stat.bgGradient} p-3 sm:p-4 flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5`}
                        style={{ minHeight: '120px' }}
                    >
                        {/* Icon */}
                        <div className={`${stat.iconBg} w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center shadow-md`}>
                            <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>

                        {/* Content */}
                        <div className="mt-2">
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                                {stat.value}
                            </p>
                            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                                {stat.title}
                            </p>
                        </div>

                        {/* Decorative circle */}
                        <div className={`absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-gradient-to-br ${stat.gradient} opacity-15`}></div>
                    </div>
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Recent Notes */}
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-500" />
                            Recent Notes
                        </h2>
                        <button
                            onClick={() => navigate('/notes')}
                            className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 font-medium"
                        >
                            View all
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {recentNotes.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                            <StickyNote className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No notes yet. Create your first note!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentNotes.map((note) => (
                                <div
                                    key={note._id}
                                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-gray-100 dark:border-gray-600"
                                    onClick={() => navigate('/notes')}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                                            <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                                {note.title}
                                            </h3>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                                                {note.aiSummary || note.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Upcoming Tasks */}
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <ListTodo className="w-5 h-5 text-blue-500" />
                            Upcoming Tasks
                        </h2>
                        <button
                            onClick={() => navigate('/tasks')}
                            className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 font-medium"
                        >
                            View all
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {tasks.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No pending tasks. Great job!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {tasks.map((task) => (
                                <div
                                    key={task._id}
                                    className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-gray-100 dark:border-gray-600"
                                    onClick={() => navigate('/tasks')}
                                >
                                    <div className={`p-1.5 rounded-md ${task.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                                        task.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30' :
                                            'bg-green-100 dark:bg-green-900/30'
                                        }`}>
                                        <Target className={`w-3.5 h-3.5 ${task.priority === 'high' ? 'text-red-500' :
                                            task.priority === 'medium' ? 'text-amber-500' :
                                                'text-green-500'
                                            }`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                            {task.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {task.category}
                                            </span>
                                            {task.dueDate && (
                                                <>
                                                    <span className="text-xs text-gray-400">•</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(task.dueDate).toLocaleDateString()}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* AI Assistant CTA */}
            <div className="card p-5 bg-gradient-to-r from-primary-500 to-accent-500 text-white overflow-hidden relative">
                <div className="flex items-center justify-between relative z-10">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold mb-2 flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            Need help staying organized?
                        </h2>
                        <p className="opacity-90 mb-3 text-sm">
                            Chat with your AI Assistant for personalized productivity insights.
                        </p>
                        <button
                            onClick={() => navigate('/assistant')}
                            className="bg-white text-primary-600 px-5 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm"
                        >
                            Open AI Assistant
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="hidden md:block">
                        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                            <Sparkles className="w-12 h-12 opacity-50" />
                        </div>
                    </div>
                </div>
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full"></div>
                <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full"></div>
            </div>
        </div>
    );
};

export default Dashboard;
