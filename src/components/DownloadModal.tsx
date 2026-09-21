'use client';

import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Check, 
  Terminal, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  ArrowDownCircle,
  FileCode2
} from 'lucide-react';
import { SoftwareItem } from '@/lib/types';
import SoftwareIcon from './SoftwareIcon';

interface DownloadModalProps {
  item: SoftwareItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DownloadModal({ item, isOpen, onClose }: DownloadModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !item) return null;

  const copyWinget = () => {
    if (item.wingetId) {
      navigator.clipboard.writeText(`winget install --id ${item.wingetId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="p-4 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SoftwareIcon iconType={item.iconType} category={item.category} size={20} className="w-8 h-8 p-1.5" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{item.name}</span>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                  v{item.version}
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">{item.tagline}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          
          {/* Status Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 flex items-start gap-3">
            <ArrowDownCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <p className="text-xs font-bold text-emerald-300 mb-0.5">Download Starting...</p>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Your browser should start downloading the official installer automatically.
              </p>
            </div>
          </div>

          {/* Direct Manual Download Button */}
          <div>
            <a
              href={item.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Direct Link: Download Installer (~{item.sizeEstimate})</span>
            </a>
            <p className="text-[10px] text-zinc-500 text-center mt-1.5">
              If download didn&apos;t start automatically, click the blue button above.
            </p>
          </div>

          {/* Winget One-Liner Option */}
          {item.wingetId && (
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  Install via Terminal (Winget)
                </span>
                <button
                  onClick={copyWinget}
                  className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/40"
                >
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : null}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="bg-zinc-900 p-2 rounded-lg font-mono text-xs text-green-400 truncate">
                winget install --id {item.wingetId}
              </div>
            </div>
          )}

          {/* Metadata & Links */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-[11px] text-zinc-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verified Official Source
            </span>
            <a
              href={item.website}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 hover:underline"
            >
              <span>Official Website</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}
