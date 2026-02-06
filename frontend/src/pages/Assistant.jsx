import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Lightbulb, TrendingUp, Plus, ListTodo, FileText, CheckCircle, Trash2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useNotifications } from '../contexts/NotificationContext';

const Assistant = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);
    const { fetchNotifications } = useNotifications();

    const presetQuestions = [
        { text: 'Summarize my week', icon: TrendingUp },
        { text: 'Suggest priorities', icon: Lightbulb },
        { text: 'How can I be more productive?', icon: Sparkles },
    ];

    const quickActions = [
        { text: 'Create a task called ', icon: Plus, placeholder: 'Create a task called [name] for [date]' },
        { text: 'Add a note about ', icon: FileText, placeholder: 'Add a note about [topic]' },
        { text: 'Show all my tasks', icon: ListTodo, placeholder: null },
        { text: 'Show all my notes', icon: FileText, placeholder: null },
    ];

    // Scroll to top of page when component mounts
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        // Welcome message
        setMessages([
            {
                role: 'assistant',
                content: `👋 Hi! I'm your AI productivity assistant. I can help you:

📝 **Manage Notes** - "Add a note about meeting ideas", "Show my notes"
✅ **Manage Tasks** - "Create a task called Buy groceries for tomorrow", "Mark task as done"
📊 **Get Insights** - "Summarize my week", "Suggest priorities"

Just type a command or ask me anything!`,
                timestamp: new Date(),
            },
        ]);
        // Mark initial load as complete after welcome message
        setIsInitialLoad(false);
    }, []);

    useEffect(() => {
        // Only scroll to bottom for new messages, not on initial load
        if (!isInitialLoad && messages.length > 1) {
            scrollToBottom();
        }
    }, [messages, isInitialLoad]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async (question = input) => {
        if (!question.trim()) return;

        const userMessage = {
            role: 'user',
            content: question,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Check if it's a preset question
            let response;
            let isAction = false;

            if (question.toLowerCase().includes('summarize') && question.toLowerCase().includes('week')) {
                const { data } = await api.get('/assistant/weekly-summary');
                response = data.summary;
            } else if (question.toLowerCase().includes('priorities') && !question.toLowerCase().includes('create') && !question.toLowerCase().includes('add')) {
                const { data } = await api.get('/assistant/suggest-priorities');
                response = data.suggestions;
            } else {
                const { data } = await api.post('/assistant/chat', { message: question });
                response = data.response;
                isAction = data.action !== undefined;

                // If an action was performed successfully, refresh notifications
                if (data.success && data.action) {
                    fetchNotifications();

                    // Show toast for successful actions
                    if (data.action.includes('create')) {
                        toast.success('Created successfully via AI!');
                    } else if (data.action.includes('delete')) {
                        toast.success('Deleted successfully!');
                    } else if (data.action === 'complete_task') {
                        toast.success('Task completed! 🎉');
                    }
                }
            }

            const assistantMessage = {
                role: 'assistant',
                content: response,
                timestamp: new Date(),
                isAction,
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            toast.error('Failed to get AI response');
            const errorMessage = {
                role: 'assistant',
                content: "❌ Sorry, I encountered an error. Please try again.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handlePresetClick = (question) => {
        handleSubmit(question);
    };

    const handleQuickAction = (action) => {
        if (action.placeholder) {
            setInput(action.text);
        } else {
            handleSubmit(action.text);
        }
    };

    // Render message content with markdown-like formatting
    const renderMessageContent = (content) => {
        // Split by newlines and process each line
        const lines = content.split('\n');

        return lines.map((line, index) => {
            // Bold text
            let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            // Check for bullet points
            if (line.trim().startsWith('- ') || line.trim().match(/^\d+\./)) {
                return (
                    <div key={index} className="ml-2" dangerouslySetInnerHTML={{ __html: processed }} />
                );
            }

            return (
                <span key={index}>
                    <span dangerouslySetInnerHTML={{ __html: processed }} />
                    {index < lines.length - 1 && <br />}
                </span>
            );
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="text-center">
                <div className="inline-block p-3 bg-gradient-to-r from-accent-500 to-primary-500 rounded-full mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    AI Assistant
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Create tasks, notes, and get productivity insights using natural language
                </p>
            </div>

            {/* Quick Actions - 2x2 grid on mobile, 4 cols on desktop */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-2">
                {quickActions.map((action, i) => (
                    <button
                        key={i}
                        onClick={() => handleQuickAction(action)}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:border-primary-500 hover:text-primary-500 dark:hover:text-primary-400 transition-all text-sm disabled:opacity-50 shadow-sm"
                    >
                        <action.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{action.placeholder ? action.text.replace(' ', '...') : action.text}</span>
                    </button>
                ))}
            </div>

            {/* Chat Container */}
            <div className="card p-0 flex flex-col" style={{ height: 'calc(100vh - 380px)', minHeight: '300px', maxHeight: '500px' }}>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar" style={{ overflowY: 'auto', scrollBehavior: 'smooth' }}>
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                                    : message.isAction
                                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 text-gray-900 dark:text-gray-100'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                    }`}
                            >
                                <div className="text-sm whitespace-pre-wrap">
                                    {renderMessageContent(message.content)}
                                </div>
                                <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-primary-100' : 'text-gray-500'
                                    }`}>
                                    {message.timestamp.toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <LoadingSpinner size="sm" />
                                    <span className="text-sm text-gray-500">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    {/* Preset Questions */}
                    {messages.length <= 1 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                            {presetQuestions.map((preset, i) => (
                                <button
                                    key={i}
                                    onClick={() => handlePresetClick(preset.text)}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm disabled:opacity-50"
                                >
                                    <preset.icon className="w-4 h-4" />
                                    {preset.text}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Form */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit();
                        }}
                        className="flex gap-2"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Try: 'Create a task called...' or 'Show my notes'"
                            disabled={loading}
                            className="input-field flex-1"
                        />
                        <Button
                            type="submit"
                            disabled={loading || !input.trim()}
                            icon={Send}
                        >
                            Send
                        </Button>
                    </form>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4">
                    <Plus className="w-6 h-6 text-green-500 mb-2" />
                    <h3 className="font-semibold mb-1">Create Items</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        "Create a task called..." or "Add a note about..."
                    </p>
                </div>

                <div className="card p-4">
                    <CheckCircle className="w-6 h-6 text-blue-500 mb-2" />
                    <h3 className="font-semibold mb-1">Manage Tasks</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        "Mark task as done" or "Delete task..."
                    </p>
                </div>

                <div className="card p-4">
                    <Sparkles className="w-6 h-6 text-purple-500 mb-2" />
                    <h3 className="font-semibold mb-1">Get Insights</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        "Summarize my week" or "Suggest priorities"
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Assistant;
