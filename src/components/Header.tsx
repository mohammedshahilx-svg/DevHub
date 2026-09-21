'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  User as UserIcon, 
  LogIn, 
  Sparkles, 
  Layers, 
  Check, 
  RefreshCw,
  ExternalLink,
  ChevronDown,
  History,
  Bookmark,
  LogOut
} from 'lucide-react';
import { User, NotificationItem } from '@/lib/types';

interface HeaderProps {
  user: User | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAuth: () => void;
  onOpenChat: () => void;
  onLogout: () => void;
  notifications: NotificationItem[];
  unreadNotifsCount: number;
  onMarkNotifRead: (id?: string) => void;
  onSimulateUpdate: () => void;
  onSelectPack: (toolIds: string[]) => void;
}

export default function Header({
  user,
  searchQuery,
  onSearchChange,
  onOpenAuth,
  onOpenChat,
  onLogout,
  notifications,
  unreadNotifsCount,
  onMarkNotifRead,
  onSimulateUpdate,
  onSelectPack,
}: HeaderProps) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => onSearchChange('')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white">DevHub</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium leading-none">AI & Developer Software Directory</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-lg relative hidden md:block">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search AI software, compilers (e.g. GCC, Rust, Python, Ollama)..."
              className="w-full bg-zinc-900/90 text-sm text-zinc-100 placeholder-zinc-500 pl-10 pr-12 py-2 rounded-xl border border-zinc-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all shadow-inner"
            />
            {searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 text-xs text-zinc-400 hover:text-zinc-200 px-1.5 py-0.5 rounded bg-zinc-800"
              >
                Clear
              </button>
            ) : (
              <span className="absolute right-3 text-[10px] font-mono font-medium text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/60">
                /
              </span>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* AI Stack Advisor Trigger */}
          <button
            onClick={onOpenChat}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-blue-900/40 border border-purple-600/30 text-purple-200 hover:text-white hover:border-purple-500/60 transition-all shadow-sm hover:shadow-purple-500/10 group"
          >
            <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">AI Stack Advisor</span>
          </button>

          {/* Notifications Center */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2.5 rounded-xl text-zinc-400 hover:text-zinc-100 bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800/90 transition-all"
              title="Software Updates & Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-zinc-950 animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Drawer */}
            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3.5 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">Software Updates</span>
                    {unreadNotifsCount > 0 && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">
                        {unreadNotifsCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onMarkNotifRead()}
                      className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      Mark all read
                    </button>
                  </div>
                </div>

                {/* Notifications list */}
                <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-zinc-400">
                      No updates yet. You are up to date!
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => onMarkNotifRead(n.id)}
                        className={`p-3.5 hover:bg-zinc-800/40 cursor-pointer transition-colors ${
                          !n.read ? 'bg-blue-950/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-semibold text-xs text-zinc-100 flex items-center gap-1.5">
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                            {n.softwareName}
                          </span>
                          <span className="text-[10px] font-mono text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-900/40">
                            v{n.version}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 mb-1">{n.message}</p>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(n.date).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Simulator Bar */}
                <div className="p-2.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 text-[11px]">Testing updates?</span>
                  <button
                    onClick={onSimulateUpdate}
                    className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/60 px-2 py-1 rounded border border-indigo-800/40 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Simulate New Release
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Auth Button */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 text-zinc-200 text-xs font-semibold transition-all"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[90px] truncate hidden sm:inline">{user.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50">
                  <div className="px-3 py-2 border-b border-zinc-800/80 mb-2">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                  </div>

                  {/* Saved Stacks Quick Links */}
                  <div className="mb-2">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
                      <Bookmark className="w-3 h-3" />
                      Saved Stacks ({user.savedPacks?.length || 0})
                    </div>
                    {user.savedPacks && user.savedPacks.length > 0 ? (
                      user.savedPacks.slice(0, 3).map((pack) => (
                        <button
                          key={pack.id}
                          onClick={() => {
                            onSelectPack(pack.toolIds);
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/60 rounded-lg flex items-center justify-between transition-colors"
                        >
                          <span className="truncate">{pack.name}</span>
                          <span className="text-[10px] text-zinc-500">{pack.toolIds.length} tools</span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-1 text-[11px] text-zinc-500 italic">No saved stacks yet</p>
                    )}
                  </div>

                  {/* Download History Indicator */}
                  <div className="mb-2 border-t border-zinc-800/60 pt-2">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
                      <History className="w-3 h-3" />
                      Recent Downloads ({user.downloadHistory?.length || 0})
                    </div>
                    {user.downloadHistory && user.downloadHistory.length > 0 ? (
                      <div className="px-3 py-1 text-xs text-zinc-300 truncate">
                        Last: {user.downloadHistory[0].softwareNames.join(', ')}
                      </div>
                    ) : null}
                  </div>

                  <div className="border-t border-zinc-800/80 pt-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
