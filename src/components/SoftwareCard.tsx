'use client';

import React, { useState } from 'react';
import { 
  Check, 
  Download, 
  ExternalLink, 
  Bell, 
  BellRing, 
  Info, 
  Terminal,
  Copy,
  Sparkles
} from 'lucide-react';
import { SoftwareItem } from '@/lib/types';
import SoftwareIcon from './SoftwareIcon';

interface SoftwareCardProps {
  item: SoftwareItem;
  isSelected: boolean;
  isFollowed: boolean;
  onToggleSelect: (id: string) => void;
  onToggleFollow: (id: string) => void;
  onDirectDownload: (id: string) => void;
}

export default function SoftwareCard({
  item,
  isSelected,
  isFollowed,
  onToggleSelect,
  onToggleFollow,
  onDirectDownload,
}: SoftwareCardProps) {
  const [copied, setCopied] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const copyWinget = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.wingetId) {
      navigator.clipboard.writeText(`winget install --id ${item.wingetId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getCategoryColor = () => {
    switch (item.category) {
      case 'ai': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'compiler': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'runtime': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'ide': return 'bg-pink-500/10 text-pink-400 border-pink-500/30';
      case 'tool': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default: return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div 
      className={`group relative rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
        isSelected
          ? 'bg-zinc-900/90 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/50'
          : 'bg-zinc-900/40 hover:bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700'
      }`}
    >
      {/* Top Header Card */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          
          {/* Icon & Title */}
          <div className="flex items-start gap-3">
            <SoftwareIcon iconType={item.iconType} category={item.category} size={26} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-zinc-100 group-hover:text-white tracking-tight">
                  {item.name}
                </h3>
                {item.featured && (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <Sparkles className="w-2.5 h-2.5" />
                    Top
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-400 font-medium line-clamp-1">{item.tagline}</p>
            </div>
          </div>

          {/* Multi-Select Checkbox */}
          <button
            type="button"
            onClick={() => onToggleSelect(item.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isSelected
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
            }`}
          >
            <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
              isSelected ? 'bg-white border-white text-blue-600' : 'border-zinc-500'
            }`}>
              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span>{isSelected ? 'Added' : 'Add to Pack'}</span>
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 mb-3">
          {item.description}
        </p>

        {/* Badges & Meta */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getCategoryColor()}`}>
            {item.category}
          </span>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded-md border border-zinc-700/50">
            v{item.version}
          </span>
          <span className="text-[10px] text-zinc-500 bg-zinc-800/40 px-2 py-0.5 rounded-md">
            ~{item.sizeEstimate}
          </span>
        </div>

        {/* Release notes preview toggle */}
        {showNotes && (
          <div className="mt-2 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-300 animate-in fade-in duration-150">
            <span className="font-semibold text-zinc-400 block mb-0.5">Release Notes:</span>
            {item.releaseNotes}
          </div>
        )}
      </div>

      {/* Bottom Footer Actions */}
      <div className="px-5 py-3 bg-zinc-950/40 border-t border-zinc-800/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Follow updates toggle */}
          <button
            onClick={() => onToggleFollow(item.id)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isFollowed
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                : 'bg-zinc-800/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title={isFollowed ? 'Tracking updates (click to unfollow)' : 'Notify me of new updates'}
          >
            {isFollowed ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
          </button>

          {/* Info / Release notes button */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              showNotes ? 'bg-zinc-700 text-white' : 'bg-zinc-800/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="View Release Notes"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          {/* Copy winget command */}
          {item.wingetId && (
            <button
              onClick={copyWinget}
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-800/40 text-zinc-400 hover:text-zinc-200 text-xs transition-colors relative"
              title="Copy Winget install command"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Terminal className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Official Website */}
          <a
            href={item.website}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-800/40 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
            title="Visit official website"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Direct Single Download */}
        <button
          onClick={() => onDirectDownload(item.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-zinc-400" />
          <span>Download</span>
        </button>
      </div>
    </div>
  );
}
