'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User as UserIcon, 
  Check, 
  PlusCircle, 
  Loader2,
  Terminal,
  ArrowRight
} from 'lucide-react';
import { SoftwareItem } from '@/lib/types';
import SoftwareIcon from './SoftwareIcon';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendedTools?: SoftwareItem[];
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecommendedPack: (toolIds: string[]) => void;
  selectedToolIds: string[];
}

const QUICK_SUGGESTIONS = [
  'I want to run DeepSeek and local LLMs on my GPU',
  'What compilers & tools do I need for C++ game dev?',
  'Best stack for Python Machine Learning & AI',
  'I want to start Rust systems programming',
  'Modern Fullstack TypeScript & Web stack',
];

export default function AIChatModal({
  isOpen,
  onClose,
  onSelectRecommendedPack,
  selectedToolIds,
}: AIChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "👋 Hello! I'm your **DevHub Stack Advisor**. Tell me what programming language, technology, or AI project you're working on, and I'll find and bundle the exact compilers, tools, and runtimes you need.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const sendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error('Failed to get advice');

      const data = await res.json();
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        recommendedTools: data.recommendedTools,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I ran into an issue finding recommendations. Please try again or rephrase your request.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-purple-500/30 w-full max-w-2xl h-[85vh] max-h-[720px] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-4 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">DevHub Stack Advisor</h3>
                <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                  AI AGENT
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Trained on developer tools, compilers & local AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-zinc-950/80 border border-zinc-800/80 text-zinc-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Recommended Software Cards */}
                {m.recommendedTools && m.recommendedTools.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-300">
                        Recommended Stack ({m.recommendedTools.length} tools):
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {m.recommendedTools.map((tool) => {
                        const isSelected = selectedToolIds.includes(tool.id);
                        return (
                          <div
                            key={tool.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-blue-950/40 border-blue-500/50 text-white'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <SoftwareIcon iconType={tool.iconType} category={tool.category} size={16} className="w-7 h-7 p-1" />
                              <div className="truncate">
                                <span className="font-bold text-xs block truncate">{tool.name}</span>
                                <span className="text-[10px] text-zinc-400">{tool.version}</span>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-blue-400 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* 1-Click Button to Add Stack to Cart */}
                    <button
                      onClick={() => onSelectRecommendedPack(m.recommendedTools!.map(t => t.id))}
                      className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add All Recommended Tools to Pack</span>
                    </button>
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-zinc-400">
              <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 bg-zinc-950/80 px-3.5 py-2.5 rounded-2xl border border-zinc-800 text-zinc-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>Thinking & querying catalog...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-zinc-950/60 border-t border-zinc-800/60 overflow-x-auto flex gap-1.5 scrollbar-none">
          {QUICK_SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(s)}
              className="text-[11px] whitespace-nowrap bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg border border-zinc-700/60 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything (e.g. 'I need compilers for C++ and Rust on Windows')..."
            className="flex-1 bg-zinc-900 text-xs text-zinc-100 placeholder-zinc-500 px-3.5 py-2.5 rounded-xl border border-zinc-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white shadow-md shadow-purple-600/20 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
