import React, { useState, useEffect } from 'react';
import { Plus, Search, LogOut, Copy, ExternalLink, Key, User, Trash2, Edit3, Eye, EyeOff, Check, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

interface VaultItem {
    id: string;
    account_name: string;
    url: string | null;
    login: string | null;
    created_at: string;
}

const Dashboard = () => {
    const [items, setItems] = useState<VaultItem[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<VaultItem & { password?: string }> | null>(null);
    const [revealedPassword, setRevealedPassword] = useState<{ [key: string]: string }>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const { user, logout } = useAuth();

    const fetchItems = async () => {
        try {
            const response = await api.get('/vault/', { params: { query: search } });
            setItems(response.data);
        } catch (err) {
            console.error('Failed to fetch items');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [search]);

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentItem?.id) {
                await api.put(`/vault/${currentItem.id}`, currentItem);
            } else {
                await api.post('/vault/', currentItem);
            }
            setIsModalOpen(false);
            fetchItems();
        } catch (err) {
            alert('Operation failed');
        }
    };

    const handleDelete = async () => {
        if (!currentItem?.id) return;
        try {
            await api.delete(`/vault/${currentItem.id}`);
            setIsDeleteModalOpen(false);
            fetchItems();
        } catch (err) {
            alert('Delete failed');
        }
    };

    const revealPassword = async (id: string) => {
        if (revealedPassword[id]) {
            const newRevealed = { ...revealedPassword };
            delete newRevealed[id];
            setRevealedPassword(newRevealed);
            return;
        }
        try {
            const response = await api.post(`/vault/${id}/reveal`);
            setRevealedPassword({ ...revealedPassword, [id]: response.data.password });
        } catch (err) {
            alert('Failed to reveal password');
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        const password = Array.from(crypto.getRandomValues(new Uint32Array(16)))
            .map((x) => chars[x % chars.length])
            .join('');
        setCurrentItem({ ...currentItem, password });
    };

    return (
        <div className="min-h-screen p-6 md:p-10 relative">
            {/* Header */}
            <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-glow to-accent bg-clip-text text-transparent">
                        Vault
                    </h1>
                    <p className="text-white/50 mt-1">Welcome back, <span className="text-white/80">{user?.username}</span></p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search accounts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-field pl-12 bg-white/5 border-white/5 group-focus-within:bg-white/10"
                        />
                    </div>
                    <button
                        onClick={logout}
                        className="w-12 h-12 flex items-center justify-center glass border-white/5 hover:bg-red-500/20 hover:border-red-500/30 transition-all"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5 text-white/70" />
                    </button>
                </div>
            </header>

            {/* Grid */}
            <main className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-40 glass border-dashed">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Key className="w-8 h-8 text-white/20" />
                        </div>
                        <p className="text-white/40">No entries found. Click the + button to add your first account.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((item) => (
                            <motion.div
                                layout
                                key={item.id}
                                className="glass-card p-6 flex flex-col group relative"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                                        <span className="text-xl font-bold text-primary-glow">
                                            {item.account_name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => { setCurrentItem(item); setIsModalOpen(true); }}
                                            className="p-2 hover:bg-white/5 rounded-lg text-white/50 hover:text-white"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => { setCurrentItem(item); setIsDeleteModalOpen(true); }}
                                            className="p-2 hover:bg-red-500/10 rounded-lg text-white/50 hover:text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-semibold truncate mb-1">{item.account_name}</h3>
                                <div className="text-white/40 text-sm truncate flex items-center gap-2 mb-6">
                                    <User className="w-3 h-3" /> {item.login || 'N/A'}
                                </div>

                                <div className="mt-auto space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-black/40 h-10 px-3 rounded-lg flex items-center justify-between text-sm font-mono border border-white/5 overflow-hidden">
                                            <span className="truncate">
                                                {revealedPassword[item.id] ? revealedPassword[item.id] : '••••••••••••'}
                                            </span>
                                            <button
                                                onClick={() => revealPassword(item.id)}
                                                className="ml-2 text-white/30 hover:text-white"
                                            >
                                                {revealedPassword[item.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                let pw = revealedPassword[item.id];
                                                if (!pw) {
                                                    const res = await api.post(`/vault/${item.id}/reveal`);
                                                    pw = res.data.password;
                                                }
                                                copyToClipboard(pw, item.id);
                                            }}
                                            className={`h-10 w-10 flex items-center justify-center rounded-lg border transition-all ${copiedId === item.id ? 'bg-green-500/20 border-green-500/50 text-green-500' : 'bg-primary/20 border-primary/30 text-primary-glow hover:bg-primary/30'
                                                }`}
                                        >
                                            {copiedId === item.id ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    {item.url && (
                                        <a
                                            href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-xs text-primary-glow/70 hover:text-primary-glow transition-colors"
                                        >
                                            <ExternalLink className="w-3 h-3" /> {item.url}
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* FAB */}
            <button
                onClick={() => { setCurrentItem({}); setIsModalOpen(true); }}
                className="fixed bottom-10 right-10 w-16 h-16 bg-primary text-white rounded-2xl shadow-neon-strong hover:shadow-[0_0_30px_rgba(147,51,234,1)] transition-all flex items-center justify-center active:scale-95 group"
            >
                <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass p-8 w-full max-w-lg shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold">{currentItem?.id ? 'Edit Account' : 'New Account'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-white/30 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateOrUpdate} className="space-y-6">
                                <div>
                                    <label className="text-sm font-medium text-white/50 mb-2 block">Account Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={currentItem?.account_name || ''}
                                        onChange={(e) => setCurrentItem({ ...currentItem, account_name: e.target.value })}
                                        className="input-field"
                                        placeholder="e.g. Google, Github..."
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-white/50 mb-2 block">Login / Email</label>
                                        <input
                                            type="text"
                                            value={currentItem?.login || ''}
                                            onChange={(e) => setCurrentItem({ ...currentItem, login: e.target.value })}
                                            className="input-field"
                                            placeholder="username"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-white/50 mb-2 block">Website URL (optional)</label>
                                        <input
                                            type="text"
                                            value={currentItem?.url || ''}
                                            onChange={(e) => setCurrentItem({ ...currentItem, url: e.target.value })}
                                            className="input-field"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-white/50 mb-2 block">Password</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="password"
                                            required={!currentItem?.id}
                                            value={currentItem?.password || ''}
                                            onChange={(e) => setCurrentItem({ ...currentItem, password: e.target.value })}
                                            className="input-field flex-1"
                                            placeholder={currentItem?.id ? "•••••••• (Leave blank to keep current)" : "••••••••"}
                                        />
                                        <button
                                            type="button"
                                            onClick={generatePassword}
                                            className="button-secondary px-4 py-0 flex items-center justify-center"
                                            title="Generate"
                                        >
                                            <Key className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="button-secondary flex-1">
                                        Cancel
                                    </button>
                                    <button type="submit" className="button-primary flex-1">
                                        {currentItem?.id ? 'Save Changes' : 'Create Entry'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass p-8 w-full max-w-sm shadow-2xl border-red-500/20"
                        >
                            <h2 className="text-xl font-bold mb-4">Delete Entry?</h2>
                            <p className="text-white/50 mb-8">Are you sure you want to delete <span className="text-white"> {currentItem?.account_name} </span>? This action cannot be undone.</p>
                            <div className="flex gap-4">
                                <button onClick={() => setIsDeleteModalOpen(false)} className="button-secondary flex-1">No, keep it</button>
                                <button onClick={handleDelete} className="button-primary !bg-red-500 hover:!bg-red-600 !shadow-none flex-1">Delete</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toast logic for "Copied" could be added here for better feel */}
        </div>
    );
};

export default Dashboard;
