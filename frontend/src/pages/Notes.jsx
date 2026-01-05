import React, { useState, useEffect } from 'react';
import { Plus, Search, Sparkles, RefreshCw, Trash2, Edit, Pin, Palette } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import LoadingSpinner from '../components/common/LoadingSpinner';

const NOTE_COLORS = [
    { name: 'Default', value: '#ffffff', darkValue: '#1f2937' },
    { name: 'Red', value: '#fecaca', darkValue: '#7f1d1d' },
    { name: 'Orange', value: '#fed7aa', darkValue: '#7c2d12' },
    { name: 'Yellow', value: '#fef08a', darkValue: '#713f12' },
    { name: 'Green', value: '#bbf7d0', darkValue: '#14532d' },
    { name: 'Blue', value: '#bfdbfe', darkValue: '#1e3a8a' },
    { name: 'Purple', value: '#ddd6fe', darkValue: '#4c1d95' },
    { name: 'Pink', value: '#fbcfe8', darkValue: '#831843' },
];

const Notes = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: '', color: '#ffffff' });
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const { data } = await api.get('/notes');
            setNotes(data);
        } catch (error) {
            toast.error('Failed to fetch notes');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingNote) {
                const { data } = await api.put(`/notes/${editingNote._id}`, formData);
                setNotes(notes.map(n => n._id === editingNote._id ? data : n));
                toast.success('Note updated!');
            } else {
                const { data } = await api.post('/notes', formData);
                setNotes([data, ...notes]);
                toast.success('Note created with AI summary!');
            }
            closeModal();
        } catch (error) {
            toast.error('Failed to save note');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this note?')) return;
        try {
            await api.delete(`/notes/${id}`);
            setNotes(notes.filter(n => n._id !== id));
            toast.success('Note deleted');
        } catch (error) {
            toast.error('Failed to delete note');
        }
    };

    const handleRewrite = async (note, style) => {
        setAiLoading(true);
        try {
            const { data } = await api.post(`/notes/${note._id}/rewrite`, { style });
            setFormData({ title: note.title, content: data.rewrittenContent });
            setEditingNote(note);
            setIsModalOpen(true);
            toast.success(`Note rewritten in ${style} style!`);
        } catch (error) {
            toast.error('AI rewrite failed');
        } finally {
            setAiLoading(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingNote(null);
        setFormData({ title: '', content: '', color: '#ffffff' });
    };

    const openEditModal = (note) => {
        setEditingNote(note);
        setFormData({ title: note.title, content: note.content, color: note.color || '#ffffff' });
        setIsModalOpen(true);
    };

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <LoadingSpinner size="lg" className="mt-20" />;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Smart Notes
                    </h1>
                    <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
                        New Note
                    </Button>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                    AI-powered note-taking with automatic summaries and tags
                </p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10"
                />
            </div>

            {/* Notes Grid */}
            {filteredNotes.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No notes yet. Create your first AI-powered note!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredNotes.map((note) => (
                        <div
                            key={note._id}
                            className="card p-6 card-hover relative overflow-hidden"
                            style={{
                                borderLeft: note.color && note.color !== '#ffffff'
                                    ? `4px solid ${note.color}`
                                    : undefined,
                                backgroundColor: note.color && note.color !== '#ffffff'
                                    ? `${note.color}15`
                                    : undefined
                            }}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                    {note.title}
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditModal(note)}
                                        className="btn-icon text-gray-500 hover:text-primary-500"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(note._id)}
                                        className="btn-icon text-gray-500 hover:text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                                {note.content}
                            </p>

                            {note.aiSummary && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Sparkles className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                            AI Summary
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-700 dark:text-gray-300">
                                        {note.aiSummary}
                                    </p>
                                </div>
                            )}

                            {note.aiTags && note.aiTags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {note.aiTags.map((tag, i) => (
                                        <span key={i} className="badge badge-primary">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* AI Actions */}
                            <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => handleRewrite(note, 'polish')}
                                    disabled={aiLoading}
                                    className="flex-1 text-xs px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                                >
                                    Polish
                                </button>
                                <button
                                    onClick={() => handleRewrite(note, 'bullets')}
                                    disabled={aiLoading}
                                    className="flex-1 text-xs px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                >
                                    Bullets
                                </button>
                                <button
                                    onClick={() => handleRewrite(note, 'shorten')}
                                    disabled={aiLoading}
                                    className="flex-1 text-xs px-3 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                                >
                                    Shorten
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingNote ? 'Edit Note' : 'Create Note'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter note title..."
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Content
                        </label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Enter note content..."
                            rows={8}
                            className="input-field resize-none"
                            required
                        />
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            Note Color
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {NOTE_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color: color.value })}
                                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${formData.color === color.value
                                            ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                                            : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                            {editingNote ? 'Update' : 'Create'} Note
                        </Button>
                        <Button type="button" variant="secondary" onClick={closeModal}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Notes;
