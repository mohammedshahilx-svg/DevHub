'use client';

import React, { useState } from 'react';
import { 
  Archive, 
  Download, 
  Bookmark, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  Sparkles,
  CheckCircle2,
  Loader2,
  Layers,
  ArrowDownToLine
} from 'lucide-react';
import { SoftwareItem, User } from '@/lib/types';

interface DownloadDrawerProps {
  selectedItems: SoftwareItem[];
  user: User | null;
  onClearAll: () => void;
  onRemoveItem: (id: string) => void;
  onSaveStack: (name: string) => void;
  onDownloadZip: (packName: string) => Promise<void>;
  onDownloadAllBrowser: () => void;
  isDownloading: boolean;
}

export default function DownloadDrawer({
  selectedItems,
  user,
  onClearAll,
  onRemoveItem,
  onSaveStack,
  onDownloadZip,
  onDownloadAllBrowser,
  isDownloading,
}: DownloadDrawerProps) {
  const [packName, setPackName] = useState('My Developer Pack');
  const [expanded, setExpanded] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (selectedItems.length === 0) return null;

  const handleSave = () => {
    if (!packName.trim()) return;
    onSaveStack(packName.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setSaveModalOpen(false);
    }, 1500);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-blue-500/40 rounded-2xl shadow-2xl shadow-blue-500/10 p-3 sm:p-4 text-white">
        
        {/* Expanded Items Preview Tray */}
        {expanded && (
          <div className="mb-3 pb-3 border-b border-zinc-800 animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Selected Software Pack ({selectedItems.length} items)
              </span>
              <button
                onClick={onClearAll}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {selectedItems.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-zinc-800 border border-zinc-700 text-zinc-200"
                >
                  <span className="font-semibold">{item.name}</span>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-zinc-500 hover:text-zinc-200 ml-1 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Main Bar Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Left: Summary and expand toggle */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div className="cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white">
                  {selectedItems.length} {selectedItems.length === 1 ? 'tool' : 'tools'} in pack
                </span>
                <span className="text-zinc-400 hover:text-zinc-200">
                  {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 line-clamp-1">
                {selectedItems.map(i => i.name).join(', ')}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            
            {/* Save Stack Button */}
            <button
              onClick={() => setSaveModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all"
              title="Save this stack to your account"
            >
              <Bookmark className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Save Stack</span>
            </button>

            {/* Direct Browser Download of All Files */}
            <button
              onClick={onDownloadAllBrowser}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all"
              title="Download all selected installer files separately in browser"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Download All Files</span>
            </button>

            {/* Clear button */}
            <button
              onClick={onClearAll}
              className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-zinc-800/80 transition-colors"
              title="Clear selections"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Download Pack ZIP button */}
            <button
              disabled={isDownloading}
              onClick={() => onDownloadZip(packName)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Building ZIP...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Download Pack (.ZIP)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Save Stack Dialog */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Save Software Stack</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Name this custom collection so you can reload it anytime.
            </p>

            <input
              type="text"
              value={packName}
              onChange={(e) => setPackName(e.target.value)}
              placeholder="e.g. My AI & C++ Rig"
              className="w-full bg-zinc-950 text-sm text-zinc-100 px-3 py-2 rounded-xl border border-zinc-800 focus:outline-none focus:border-blue-500 mb-4"
              autoFocus
            />

            {savedSuccess ? (
              <div className="flex items-center justify-center gap-2 text-green-400 text-xs py-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Stack saved to your profile!</span>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setSaveModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
                >
                  Save Stack
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
