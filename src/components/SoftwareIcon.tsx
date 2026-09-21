'use client';

import React from 'react';
import {
  Bot,
  Sparkles,
  Wand2,
  Brain,
  LayoutGrid,
  Binary,
  Terminal,
  Cpu,
  Zap,
  CodeXml,
  Layers,
  ShieldAlert,
  Box,
  Coffee,
  FileCode2,
  Sparkle,
  Code,
  GitBranch,
  Container,
  Database,
  TerminalSquare,
  Package,
} from 'lucide-react';
import { SoftwareCategory } from '@/lib/types';

interface SoftwareIconProps {
  iconType: string;
  category: SoftwareCategory;
  className?: string;
  size?: number;
}

export default function SoftwareIcon({ iconType, category, className = 'w-6 h-6', size = 24 }: SoftwareIconProps) {
  // Category-based background color style
  const getBgClass = () => {
    switch (category) {
      case 'ai':
        return 'bg-purple-950/60 text-purple-400 border-purple-800/60';
      case 'compiler':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/60';
      case 'runtime':
        return 'bg-blue-950/60 text-blue-400 border-blue-800/60';
      case 'ide':
        return 'bg-pink-950/60 text-pink-400 border-pink-800/60';
      case 'tool':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
      default:
        return 'bg-zinc-900 text-zinc-400 border-zinc-800';
    }
  };

  const renderIcon = () => {
    switch (iconType) {
      case 'bot': return <Bot size={size} />;
      case 'sparkles': return <Sparkles size={size} />;
      case 'wand2': return <Wand2 size={size} />;
      case 'brain': return <Brain size={size} />;
      case 'layout-grid': return <LayoutGrid size={size} />;
      case 'binary': return <Binary size={size} />;
      case 'terminal': return <Terminal size={size} />;
      case 'cpu': return <Cpu size={size} />;
      case 'zap': return <Zap size={size} />;
      case 'code-xml': return <CodeXml size={size} />;
      case 'layers': return <Layers size={size} />;
      case 'shield-alert': return <ShieldAlert size={size} />;
      case 'box': return <Box size={size} />;
      case 'coffee': return <Coffee size={size} />;
      case 'file-code-2': return <FileCode2 size={size} />;
      case 'sparkle': return <Sparkle size={size} />;
      case 'code': return <Code size={size} />;
      case 'git-branch': return <GitBranch size={size} />;
      case 'container': return <Container size={size} />;
      case 'database': return <Database size={size} />;
      case 'terminal-square': return <TerminalSquare size={size} />;
      default: return <Package size={size} />;
    }
  };

  return (
    <div className={`flex items-center justify-center p-2.5 rounded-xl border transition-all ${getBgClass()} ${className}`}>
      {renderIcon()}
    </div>
  );
}
