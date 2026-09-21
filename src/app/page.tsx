'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import SoftwareCard from '@/components/SoftwareCard';
import DownloadDrawer from '@/components/DownloadDrawer';
import AIChatModal from '@/components/AIChatModal';
import AuthModal from '@/components/AuthModal';
import DownloadModal from '@/components/DownloadModal';
import { SoftwareItem, SoftwareCategory, User, NotificationItem } from '@/lib/types';
import { 
  Sparkles, 
  Layers, 
  Check, 
  Download, 
  CheckCircle2,
  Info,
  FolderLock
} from 'lucide-react';

const CATEGORIES: { label: string; value: 'all' | SoftwareCategory }[] = [
  { label: 'All Software', value: 'all' },
  { label: '🤖 AI & LLM Tools', value: 'ai' },
  { label: '⚡ Compilers & Assemblers', value: 'compiler' },
  { label: '📦 Runtimes & SDKs', value: 'runtime' },
  { label: '💻 IDEs & Code Editors', value: 'ide' },
  { label: '🛠️ Developer Utilities', value: 'tool' },
];

const PRESETS = [
  {
    title: '🤖 Local AI Stack',
    desc: 'Ollama, LM Studio, Cursor, Python',
    ids: ['ollama', 'lm-studio', 'cursor', 'python'],
  },
  {
    title: '⚡ C/C++ Toolchain',
    desc: 'GCC MinGW, Clang LLVM, VS Code, Git',
    ids: ['gcc-mingw', 'llvm-clang', 'vscode', 'git'],
  },
  {
    title: '🌐 Modern Web Dev',
    desc: 'Node.js, VS Code, Git, Beekeeper Studio',
    ids: ['nodejs', 'vscode', 'git', 'beekeeper-studio'],
  },
  {
    title: '🦀 Rust Systems Pack',
    desc: 'Rust & Cargo, Zed, Git, Terminal',
    ids: ['rust', 'zed', 'git', 'windows-terminal'],
  },
];

export default function HomePage() {
  const [items, setItems] = useState<SoftwareItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | SoftwareCategory>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'windows' | 'mac' | 'linux'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [downloadModalItem, setDownloadModalItem] = useState<SoftwareItem | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load initial data & check user session
  useEffect(() => {
    fetch('/api/software')
      .then(res => res.json())
      .then(data => setItems(data.items || []))
      .catch(err => console.error('Error fetching software:', err));

    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(err => console.error('Auth check error:', err));

    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => setNotifications(data.notifications || []))
      .catch(err => console.error('Notifications error:', err));
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedPlatform !== 'all' && !item.platforms.includes(selectedPlatform)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesTagline = item.tagline.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesTags = item.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesName && !matchesTagline && !matchesDesc && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [items, selectedCategory, selectedPlatform, searchQuery]);

  const selectedSoftwareItems = useMemo(() => {
    return items.filter(i => selectedToolIds.includes(i.id));
  }, [items, selectedToolIds]);

  // Toggle tool selection
  const handleToggleSelect = (id: string) => {
    setSelectedToolIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter(toolId => toolId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Toggle follow updates
  const handleToggleFollow = async (id: string) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/user/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ softwareId: id }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        showToast(data.following ? 'Subscribed to release notifications!' : 'Unsubscribed from notifications.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Safe direct single download: triggers download without navigating page away & opens modal
  const handleDirectDownload = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    // Trigger download safely in browser
    const link = document.createElement('a');
    link.href = item.downloadUrl;
    link.target = '_blank';
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Open clean helper modal
    setDownloadModalItem(item);
    showToast(`Starting download for ${item.name}!`);

    // Record in history
    if (user) {
      fetch(`/api/download/single?id=${id}`).catch(() => {});
    }
  };

  // Trigger sequential browser downloads for all selected items
  const handleDownloadAllBrowser = () => {
    if (selectedToolIds.length === 0) return;
    showToast(`Starting browser download for ${selectedToolIds.length} tools...`);
    
    selectedSoftwareItems.forEach((tool, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = tool.downloadUrl;
        link.target = '_blank';
        link.rel = 'noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 600); // 600ms stagger
    });
  };

  // Download ZIP bundle
  const handleDownloadZip = async (packName: string) => {
    if (selectedToolIds.length === 0) return;
    setIsDownloading(true);
    try {
      const res = await fetch('/api/download/zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolIds: selectedToolIds,
          packName: packName || 'DevHub Custom Software Pack',
        }),
      });

      if (!res.ok) throw new Error('ZIP generation failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${packName.toLowerCase().replace(/\s+/g, '-') || 'devhub-pack'}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast(`ZIP package with ${selectedToolIds.length} tools downloaded!`);

      if (user) {
        fetch('/api/auth/me')
          .then(r => r.json())
          .then(d => { if (d.user) setUser(d.user); });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate ZIP package. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Save custom stack
  const handleSaveStack = async (name: string) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/user/saved-packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, toolIds: selectedToolIds }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        showToast(`Stack "${name}" saved to user_data/saved_stacks/!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark notification as read
  const handleMarkNotifRead = async (id?: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id, markAllRead: !id }),
      });
      setNotifications(prev => prev.map(n => (!id || n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  // Simulate new release notification
  const handleSimulateUpdate = async () => {
    try {
      const randomSoftware = items[Math.floor(Math.random() * items.length)] || items[0];
      if (!randomSoftware) return;

      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          softwareId: randomSoftware.id,
          changeSummary: `New release with performance enhancements and bug fixes.`,
        }),
      });
      const data = await res.json();
      if (data.notification) {
        setNotifications(prev => [data.notification, ...prev]);
        showToast(`⚡ Update notification received for ${randomSoftware.name}!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    showToast('Logged out.');
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-blue-600 selection:text-white pb-36">
      
      {/* Navigation Header */}
      <Header
        user={user}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onLogout={handleLogout}
        notifications={notifications}
        unreadNotifsCount={unreadNotifsCount}
        onMarkNotifRead={handleMarkNotifRead}
        onSimulateUpdate={handleSimulateUpdate}
        onSelectPack={(ids) => setSelectedToolIds(ids)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-64 bg-gradient-to-tr from-blue-600/10 via-purple-600/10 to-emerald-600/5 blur-3xl pointer-events-none -z-10" />

        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 mb-5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Curated AI & Developer Software Portal</span>
            <span className="w-1 h-1 rounded-full bg-zinc-600" />
            <span className="text-blue-400 font-bold">Single or Bulk ZIP Downloads</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight sm:leading-tight mb-4">
            All the AI & Coding Software You Need,{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              One Click Away.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto mb-6">
            Discover verified AI runners, high-speed compilers, runtimes, and IDEs. Download any single tool immediately, or multi-select tools to bundle your entire developer stack into a single setup ZIP.
          </p>

          {/* User Data Location Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400 mb-6">
            <FolderLock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dedicated User Data Storage: <code className="text-zinc-200 font-mono">devhub/user_data/</code></span>
          </div>

          {/* Quick Preset Stacks */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 mr-1">
              Popular Packs:
            </span>
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedToolIds(preset.ids);
                  showToast(`Loaded ${preset.title}!`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm group"
              >
                <span>{preset.title}</span>
                <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400">({preset.ids.length})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog & Filter Navigation */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        
        {/* Controls Toolbar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Platform Pills & Counter */}
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            
            {/* Platform filter */}
            <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 text-xs">
              {(['all', 'windows', 'mac', 'linux'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPlatform(p)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors ${
                    selectedPlatform === p
                      ? 'bg-zinc-800 text-white font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Total Results Count */}
            <span className="text-xs text-zinc-400 font-medium">
              Showing <strong className="text-zinc-200">{filteredItems.length}</strong> items
            </span>
          </div>
        </div>

        {/* Software Cards Grid */}
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500 mb-3">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No software found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
              We couldn&apos;t find any items matching &quot;{searchQuery}&quot;. Try clearing filters or asking the AI Stack Advisor.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedPlatform('all');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-6">
            {filteredItems.map((item) => (
              <SoftwareCard
                key={item.id}
                item={item}
                isSelected={selectedToolIds.includes(item.id)}
                isFollowed={user ? user.followedSoftware.includes(item.id) : false}
                onToggleSelect={handleToggleSelect}
                onToggleFollow={handleToggleFollow}
                onDirectDownload={handleDirectDownload}
              />
            ))}
          </div>
        )}

      </main>

      {/* Floating Bottom Cart Bar for Multi-Downloads */}
      <DownloadDrawer
        selectedItems={selectedSoftwareItems}
        user={user}
        onClearAll={() => setSelectedToolIds([])}
        onRemoveItem={(id) => setSelectedToolIds(prev => prev.filter(t => t !== id))}
        onSaveStack={handleSaveStack}
        onDownloadZip={handleDownloadZip}
        onDownloadAllBrowser={handleDownloadAllBrowser}
        isDownloading={isDownloading}
      />

      {/* Single Item Safe Download Modal */}
      <DownloadModal
        item={downloadModalItem}
        isOpen={!!downloadModalItem}
        onClose={() => setDownloadModalItem(null)}
      />

      {/* Embedded AI Advisor Chat Modal */}
      <AIChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        selectedToolIds={selectedToolIds}
        onSelectRecommendedPack={(toolIds) => {
          setSelectedToolIds(prev => Array.from(new Set([...prev, ...toolIds])));
          showToast(`Added ${toolIds.length} recommended tools to pack!`);
          setIsChatOpen(false);
        }}
      />

      {/* Authentication / Profile Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          showToast(`Welcome back, ${loggedInUser.name}!`);
        }}
      />

    </div>
  );
}
