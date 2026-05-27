import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TranscriptSegment, StudyHighlight, ReadingSettings } from '../types';
import { Search, Type, Highlighter, MessageSquare, Copy, Check, Sliders, ChevronDown, AlignLeft, HelpCircle } from 'lucide-react';
import { formatSecondsToTime } from '../utils/parser';

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  currentSeconds: number;
  onSegmentClick: (seconds: number) => void;
  highlights: Record<string, StudyHighlight>;
  onAddHighlight: (segmentId: string, color: 'yellow' | 'green' | 'blue' | 'purple', note?: string) => void;
  onRemoveHighlight: (segmentId: string) => void;
  settings: ReadingSettings;
  onUpdateSettings: (settings: ReadingSettings) => void;
  isDarkMode?: boolean;
}

export default function TranscriptViewer({
  segments,
  currentSeconds,
  onSegmentClick,
  highlights,
  onAddHighlight,
  onRemoveHighlight,
  settings,
  onUpdateSettings,
  isDarkMode = false
}: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');
  const [copiedSegmentId, setCopiedSegmentId] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

  const activeSegmentRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Math to identify active segment based on current video playhead
  const activeSegmentId = useMemo(() => {
    if (segments.length === 0) return null;
    
    // Find highest timestamp that is <= currentSeconds
    let active = segments[0].id;
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].startSeconds <= currentSeconds + 0.5) {
        active = segments[i].id;
      } else {
        break;
      }
    }
    return active;
  }, [segments, currentSeconds]);

  // Handle Autoscrolling to currently spoken segment
  useEffect(() => {
    if (settings.autoScroll && activeSegmentId && activeSegmentRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeEl = activeSegmentRef.current;
      
      const activeOffsetTop = activeEl.offsetTop;
      const activeHeight = activeEl.offsetHeight;
      const containerHeight = container.clientHeight;
      
      // We want to center the active element in the container
      const targetScrollTop = activeOffsetTop - (containerHeight / 2) + (activeHeight / 2);
      
      container.scrollTo({
        top: targetScrollTop >= 0 ? targetScrollTop : 0,
        behavior: 'smooth'
      });
    }
  }, [activeSegmentId, settings.autoScroll]);

  // Filter segments based on text query
  const filteredSegments = useMemo(() => {
    if (!searchQuery.trim()) return segments;
    const lowerQuery = searchQuery.toLowerCase();
    return segments.filter(seg => seg.text.toLowerCase().includes(lowerQuery));
  }, [segments, searchQuery]);

  // Utility to count highlights
  const highlightCounts = useMemo(() => {
    const counts = { total: 0, yellow: 0, green: 0, blue: 0, purple: 0 };
    Object.values(highlights).forEach(h => {
      counts.total++;
      counts[h.color]++;
    });
    return counts;
  }, [highlights]);

  // Highlight color helper mappings
  const colorClasses = {
    yellow: {
      bg: isDarkMode 
        ? 'bg-amber-950/40 text-amber-200 font-medium px-1.5 rounded border-b border-amber-800' 
        : 'bg-amber-100/90 text-amber-950 font-medium px-1 rounded-sm border-b border-amber-300',
      tag: isDarkMode 
        ? 'bg-amber-950/45 hover:bg-amber-900/60 text-amber-300 border-amber-905/40 border' 
        : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-200',
      badge: 'bg-amber-500 shadow-xs',
      noteBg: isDarkMode 
        ? 'bg-amber-950/20 border-amber-900/30 text-amber-100' 
        : 'bg-amber-50/50 border-amber-100 text-amber-900',
    },
    green: {
      bg: isDarkMode 
        ? 'bg-emerald-950/40 text-emerald-200 font-medium px-1.5 rounded border-b border-emerald-800' 
        : 'bg-emerald-100/90 text-emerald-950 font-medium px-1 rounded-sm border-b border-emerald-300',
      tag: isDarkMode 
        ? 'bg-emerald-950/45 hover:bg-emerald-900/60 text-emerald-300 border-emerald-905/40 border' 
        : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-200',
      badge: 'bg-emerald-500 shadow-xs',
      noteBg: isDarkMode 
        ? 'bg-emerald-950/20 border-emerald-900/30 text-neutral-200' 
        : 'bg-emerald-50/50 border-emerald-100 text-[#0f5132]',
    },
    blue: {
      bg: isDarkMode 
        ? 'bg-blue-950/40 text-blue-200 font-medium px-1.5 rounded border-b border-blue-800' 
        : 'bg-blue-100/90 text-blue-950 font-medium px-1 rounded-sm border-b border-blue-300',
      tag: isDarkMode 
        ? 'bg-blue-950/45 hover:bg-blue-900/60 text-blue-300 border-blue-905/40 border' 
        : 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200',
      badge: 'bg-blue-500 shadow-xs',
      noteBg: isDarkMode 
        ? 'bg-blue-950/20 border-blue-900/30 text-neutral-200' 
        : 'bg-blue-50/50 border-blue-100 text-blue-900',
    },
    purple: {
      bg: isDarkMode 
        ? 'bg-purple-950/40 text-purple-200 font-medium px-1.5 rounded border-b border-purple-800' 
        : 'bg-purple-100/90 text-purple-950 font-medium px-1 rounded-sm border-b border-purple-300',
      tag: isDarkMode 
        ? 'bg-purple-950/45 hover:bg-purple-900/60 text-purple-300 border-purple-905/40 border' 
        : 'bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-200',
      badge: 'bg-purple-500 shadow-xs',
      noteBg: isDarkMode 
        ? 'bg-purple-950/20 border-purple-900/30 text-neutral-200' 
        : 'bg-purple-50/50 border-purple-100 text-purple-950',
    },
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSegmentId(id);
    setTimeout(() => setCopiedSegmentId(null), 2000);
  };

  const handleStartEditingNote = (segmentId: string, currentNote = '') => {
    setEditingSegmentId(segmentId);
    setTempNoteText(currentNote);
  };

  const handleSaveNote = (segmentId: string) => {
    const existing = highlights[segmentId];
    // Default to yellow highlighter if adding a note from scratch
    const color = existing ? existing.color : 'yellow';
    onAddHighlight(segmentId, color, tempNoteText.trim());
    setEditingSegmentId(null);
    setTempNoteText('');
  };

  const textFontFamilyClass = () => {
    switch (settings.fontFamily) {
      case 'serif': return 'font-serif tracking-normal';
      case 'mono': return 'font-mono tracking-tight';
      default: return 'font-sans tracking-tight';
    }
  };

  const textFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'sm': return 'text-sm';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      case '2xl': return 'text-2xl';
      default: return 'text-base'; // md
    }
  };

  const textLineHeightClass = () => {
    switch (settings.lineHeight) {
      case 'tight': return 'leading-tight';
      case 'relaxed': return 'leading-relaxed';
      case 'loose': return 'leading-loose';
      default: return 'leading-normal';
    }
  };

  // Helper function to render text with search queries highlighted
  const renderTextWithHighlights = (text: string) => {
    if (!searchQuery.trim()) return text;
    
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark key={i} className={`px-0.5 rounded-sm border-b ${
              isDarkMode 
                ? 'bg-amber-950/50 text-amber-205 border-amber-800' 
                : 'bg-amber-200 text-neutral-900 border-amber-400'
            }`}>
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div id="transcript-workspace" className={`flex flex-col h-full rounded-2xl border transition-colors duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.01)] overflow-hidden ${
      isDarkMode ? 'bg-[#1c1c1e] border-neutral-800/85' : 'bg-white border-neutral-200/80'
    }`}>
      
      {/* Top Bar Workspace Toolbar */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b transition-colors duration-200 ${
        isDarkMode ? 'border-neutral-800 bg-[#161618]' : 'border-neutral-100 bg-neutral-50/50'
      }`}>
        
        {/* Left Side: Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" id="search-icon" />
          <input
            id="transcript-search-input"
            type="text"
            placeholder="Search words in lecture transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg focus:outline-none transition-all font-sans shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] ${
              isDarkMode 
                ? 'bg-[#101011] border-neutral-800 text-neutral-105 focus:border-neutral-700 placeholder:text-neutral-500' 
                : 'bg-white border-neutral-200 focus:border-neutral-400 text-neutral-800 placeholder:text-neutral-400'
            }`}
          />
        </div>

        {/* Right Side: Setting toggles */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          
          {/* Autoscroll checkbox */}
          <button
            id="btn-toggle-autoscroll"
            onClick={() => onUpdateSettings({ ...settings, autoScroll: !settings.autoScroll })}
            className={`px-3 py-1.5 rounded-lg border font-sans text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
              settings.autoScroll
                ? isDarkMode 
                  ? 'bg-white text-neutral-950 border-white'
                  : 'bg-neutral-900 text-white border-neutral-900'
                : isDarkMode
                  ? 'bg-[#242426] hover:bg-[#2c2c2e] text-neutral-300 border-neutral-750'
                  : 'bg-white hover:bg-neutral-50 text-neutral-600 border-neutral-200'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            Auto-Sync
          </button>

          {/* Typography Settings Gear Toggle */}
          <div className="relative">
            <button
              id="btn-toggle-typography-panel"
              onClick={() => setShowConfig(!showConfig)}
              className={`p-1.5 rounded-lg border cursor-pointer transition-all flex items-center justify-center gap-1 text-xs font-sans font-medium ${
                showConfig 
                  ? isDarkMode
                    ? 'bg-[#2c2c2e] text-white border-neutral-600'
                    : 'bg-neutral-100 text-neutral-900 border-neutral-300' 
                  : isDarkMode
                    ? 'bg-[#242426] hover:bg-[#2c2c2e] text-neutral-300 border-neutral-750'
                    : 'bg-white hover:bg-neutral-50 text-neutral-600 border-neutral-200'
              }`}
            >
              <Type className="w-4 h-4 text-neutral-500" />
              <span>Reader Mode</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showConfig ? 'rotate-180' : ''}`} />
            </button>

            {/* Float Config Dropdown */}
            {showConfig && (
              <div id="typography-dropdown" className={`absolute right-0 top-full mt-2 w-72 rounded-xl p-4 shadow-xl z-20 space-y-4 border ${
                isDarkMode ? 'bg-[#1e1e20] border-neutral-800' : 'bg-white border-neutral-200'
              }`}>
                <div className={`flex justify-between items-center border-b pb-2 ${
                  isDarkMode ? 'border-neutral-800' : 'border-neutral-100'
                }`}>
                  <h4 className={`text-xs font-sans font-semibold ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>Format Typography</h4>
                  <button onClick={() => setShowConfig(false)} className="text-[10px] text-neutral-400 hover:text-neutral-600">Close</button>
                </div>
                
                {/* Font Family selection */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-sans font-medium text-neutral-500">FONT FACE</div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['sans', 'serif', 'mono'] as const).map((font) => (
                      <button
                        key={font}
                        id={`btn-font-${font}`}
                        onClick={() => onUpdateSettings({ ...settings, fontFamily: font })}
                        className={`py-1 text-[11px] font-sans rounded border cursor-pointer transition-all capitalize ${
                          settings.fontFamily === font
                            ? isDarkMode
                              ? 'bg-white text-neutral-950 border-white'
                              : 'bg-neutral-950 text-white border-neutral-950'
                            : isDarkMode
                              ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-800'
                              : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-neutral-200'
                        }`}
                      >
                        {font}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size selection */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-sans font-medium text-neutral-500">TEXT SIZE</div>
                  <div className="grid grid-cols-5 gap-1">
                    {(['sm', 'md', 'lg', 'xl', '2xl'] as const).map((size) => (
                      <button
                        key={size}
                        id={`btn-size-${size}`}
                        onClick={() => onUpdateSettings({ ...settings, fontSize: size })}
                        className={`py-1 text-[10px] font-mono rounded border cursor-pointer transition-all uppercase ${
                          settings.fontSize === size
                            ? isDarkMode
                              ? 'bg-white text-neutral-950 border-white'
                              : 'bg-neutral-950 text-white border-neutral-950'
                            : isDarkMode
                              ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-800'
                              : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-neutral-200'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Line Spacing */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-sans font-medium text-neutral-500">LINE SPACING</div>
                  <div className="grid grid-cols-4 gap-1">
                    {(['tight', 'normal', 'relaxed', 'loose'] as const).map((lh) => (
                      <button
                        key={lh}
                        id={`btn-lh-${lh}`}
                        onClick={() => onUpdateSettings({ ...settings, lineHeight: lh })}
                        className={`py-1 text-[11px] font-sans rounded border cursor-pointer transition-all capitalize ${
                          settings.lineHeight === lh
                            ? isDarkMode
                              ? 'bg-white text-neutral-955 border-white'
                              : 'bg-neutral-950 text-white border-neutral-950'
                            : isDarkMode
                              ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-800'
                              : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-neutral-200'
                        }`}
                      >
                        {lh}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Highlighter Summary Badge ribbon */}
      {highlightCounts.total > 0 && (
        <div className={`px-4 py-2 border-b text-[11px] flex items-center justify-between transition-colors duration-200 ${
          isDarkMode ? 'bg-[#121213] border-neutral-800 text-neutral-400' : 'bg-neutral-50 border-neutral-100 text-neutral-500'
        }`}>
          <span className="font-sans flex items-center gap-1.5">
            <Highlighter className="w-3.5 h-3.5 text-neutral-400" />
            Active Notebook: <strong>{highlightCounts.total} segments annotated</strong>
          </span>
          <div className="flex items-center gap-2">
            {highlightCounts.yellow > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>{highlightCounts.yellow}
              </span>
            )}
            {highlightCounts.green > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>{highlightCounts.green}
              </span>
            )}
            {highlightCounts.blue > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>{highlightCounts.blue}
              </span>
            )}
            {highlightCounts.purple > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>{highlightCounts.purple}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Core Reading Canvas Area */}
      <div 
        id="reading-canvas"
        ref={containerRef}
        className={`relative flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 scroll-smooth transition-colors duration-200 ${
          isDarkMode ? 'bg-[#151516]' : 'bg-[#fdfdfb]'
        }`}
      >
        {filteredSegments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
            <p className="text-sm font-sans text-neutral-500">No matching text segments found.</p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className={`text-xs font-sans underline cursor-pointer hover:opacity-80 ${
                  isDarkMode ? 'text-white' : 'text-neutral-900'
                }`}
              >
                Clear text search
              </button>
            )}
          </div>
        ) : (
          filteredSegments.map((segment) => {
            const isSpokenNow = segment.id === activeSegmentId;
            const highlight = highlights[segment.id];
            const isPaletteOpen = activeHighlightId === segment.id;

            return (
              <div
                key={segment.id}
                ref={isSpokenNow ? activeSegmentRef : null}
                className={`group relative pl-4 transition-all border-l-2 rounded-r-lg py-2.5 px-3.5 ${
                  isSpokenNow 
                    ? isDarkMode
                      ? 'border-white bg-[#222224] text-white shadow-none'
                      : 'border-neutral-900 bg-neutral-100/50 shadow-[0_1px_3px_rgba(0,0,0,0.01)]' 
                    : highlight 
                      ? isDarkMode ? 'border-[#303032]' : 'border-neutral-200/60'
                      : isDarkMode
                        ? 'border-transparent hover:border-neutral-800 hover:bg-[#1a1a1c]'
                        : 'border-transparent hover:border-neutral-200 hover:bg-neutral-50/50'
                }`}
              >
                
                {/* Floating Actions Strip (Top corner of hover segment) */}
                <div className={`absolute right-3.5 top-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all flex items-center gap-1.5 border rounded-lg p-1 shadow-sm z-10 ${
                  isDarkMode ? 'bg-[#242426] border-neutral-800 shadow-none' : 'bg-white border-neutral-200 shadow-sm'
                }`}>
                  
                  {/* Jump sync */}
                  <button
                    onClick={() => onSegmentClick(segment.startSeconds)}
                    className={`p-1 rounded text-[11px] font-sans flex items-center gap-1 cursor-pointer transition-colors ${
                      isDarkMode ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900'
                    }`}
                    title="Seek video here"
                  >
                    <span className="font-mono text-[10px] text-neutral-500">{segment.timestamp}</span>
                  </button>

                  <div className={`h-3 w-[1px] ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-200'}`}></div>

                  {/* Highlighter triggers */}
                  <button
                    onClick={() => setActiveHighlightId(isPaletteOpen ? null : segment.id)}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' 
                        : 'hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900'
                    } ${isPaletteOpen ? (isDarkMode ? 'bg-neutral-850' : 'bg-neutral-100') : ''}`}
                    title="Highlight segment"
                  >
                    <Highlighter className="w-3.5 h-3.5" />
                  </button>

                  {/* Study notes creator click */}
                  <button
                    onClick={() => handleStartEditingNote(segment.id, highlight?.note || '')}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      isDarkMode ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900'
                    }`}
                    title="Annotate thoughts"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>

                  {/* Copy clipboard */}
                  <button
                    onClick={() => copyToClipboard(segment.text, segment.id)}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      isDarkMode ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900'
                    }`}
                    title="Copy text block"
                  >
                    {copiedSegmentId === segment.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Highlighter Inline Palette */}
                {isPaletteOpen && (
                  <div className={`absolute right-3.5 top-9 border rounded-xl p-2.5 shadow-lg flex items-center gap-1.5 z-20 transition-colors ${
                    isDarkMode ? 'bg-[#202022] border-neutral-800' : 'bg-white border-neutral-200'
                  }`}>
                    <span className="text-[10px] font-sans text-neutral-400 uppercase tracking-widest mr-1 font-semibold">Highlight:</span>
                    {(['yellow', 'green', 'blue', 'purple'] as const).map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          onAddHighlight(segment.id, color, highlight?.note);
                          setActiveHighlightId(null);
                        }}
                        className={`w-4 h-4 rounded-full cursor-pointer hover:scale-110 active:scale-95 transition-transform ${
                          color === 'yellow' ? 'bg-amber-300' :
                          color === 'green' ? 'bg-emerald-300' :
                          color === 'blue' ? 'bg-blue-300' : 'bg-purple-300'
                        }`}
                      />
                    ))}
                    {highlight && (
                      <>
                        <div className={`h-4 w-[1px] mx-1 ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-200'}`}></div>
                        <button
                          onClick={() => {
                            onRemoveHighlight(segment.id);
                            setActiveHighlightId(null);
                          }}
                          className={`text-[10px] font-sans px-1.5 py-0.5 rounded cursor-pointer ${
                            isDarkMode ? 'text-red-400 hover:bg-neutral-800' : 'text-red-650 hover:bg-red-50'
                          }`}
                        >
                          Clear
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Inner Paragraph Content */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    
                    {/* Tiny responsive line timestamp badge */}
                    <button
                      onClick={() => onSegmentClick(segment.startSeconds)}
                      className={`font-mono text-xs font-semibold cursor-pointer select-none rounded hover:underline mr-1 mt-0.5 whitespace-nowrap px-1 py-0.5 transition-colors ${
                        isSpokenNow 
                          ? isDarkMode
                            ? 'bg-white text-neutral-950 font-bold'
                            : 'bg-neutral-950 text-white' 
                          : isDarkMode
                            ? 'text-neutral-500 hover:bg-[#202022] hover:text-white_90'
                            : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                      title="Seek to exact moment"
                    >
                      {segment.timestamp.replace(/[\(\)]/g, '')}
                    </button>

                    {/* Styled Transcript Text block */}
                    <p 
                      id={`text-${segment.id}`}
                      onDoubleClick={() => onSegmentClick(segment.startSeconds)}
                      title="Double-click text to jump to this moment in video"
                      className={`font-sans antialiased select-text cursor-pointer transition-colors duration-150 ${textFontFamilyClass()} ${textFontSizeClass()} ${textLineHeightClass()} ${
                        isSpokenNow 
                          ? isDarkMode ? 'text-white font-medium' : 'text-neutral-950 font-medium' 
                          : highlight 
                            ? colorClasses[highlight.color].bg
                            : isDarkMode ? 'text-[#c5c5c5] hover:text-white' : 'text-neutral-800 hover:text-neutral-950'
                      }`}
                    >
                      {renderTextWithHighlights(segment.text)}
                    </p>
                  </div>

                  {/* Highlighting Study Note Display right directly beneath the block */}
                  {highlight && highlight.note && editingSegmentId !== segment.id && (
                    <div className={`mt-2.5 p-3 rounded-lg border flex items-start gap-2.5 text-xs transition-colors ${colorClasses[highlight.color].noteBg}`}>
                      <span className={`font-sans font-semibold border-r pr-2 uppercase text-[10px] tracking-wider ${
                        isDarkMode ? 'border-neutral-800 text-neutral-450' : 'border-amber-100 text-neutral-500'
                      }`}>Note</span>
                      <p className={`flex-1 font-sans italic leading-relaxed break-words ${
                        isDarkMode ? 'text-[#e0e0e0]' : 'text-neutral-800'
                      }`}>{highlight.note}</p>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEditingNote(segment.id, highlight.note)}
                          className={`text-[10px] hover:underline cursor-pointer ${
                            isDarkMode ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-neutral-950'
                          }`}
                        >
                          Edit
                        </button>
                        <span className="text-neutral-300">•</span>
                        <button
                          onClick={() => onAddHighlight(segment.id, highlight.color, undefined)}
                          className={`text-[10px] hover:underline cursor-pointer ${
                            isDarkMode ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-neutral-950'
                          }`}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Active Inline Editor for the specific Study Note */}
                  {editingSegmentId === segment.id && (
                    <div className={`mt-3.5 border rounded-xl p-4 space-y-3.5 transition-colors ${
                      isDarkMode ? 'bg-[#131314] border-neutral-800/80 shadow-none' : 'bg-neutral-50 border-neutral-200'
                    }`}>
                      <div className="flex items-center justify-between text-[11px] font-sans font-medium text-neutral-500">
                        <span>ANNOTATE TIMESTAMPS: {segment.timestamp}</span>
                        <span className="text-[10px] italic">Will save automatically offline</span>
                      </div>
                      
                      <textarea
                        rows={2}
                        placeholder="Type study note summaries, definitions, equations, or doubts for self-study referencing..."
                        value={tempNoteText}
                        onChange={(e) => setTempNoteText(e.target.value)}
                        className={`w-full text-xs rounded-lg p-2.5 focus:outline-none focus:border-neutral-400 font-sans leading-normal shadow-inner ${
                          isDarkMode 
                            ? 'bg-[#1c1c1e] border-neutral-800 text-[#f0f0f0] placeholder:text-neutral-500 focus:border-neutral-700' 
                            : 'bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400'
                        }`}
                      />

                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          onClick={() => setEditingSegmentId(null)}
                          className={`px-3 py-1 font-sans rounded-lg transition-colors cursor-pointer ${
                            isDarkMode ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveNote(segment.id)}
                          className={`px-3.5 py-1 font-sans rounded-lg transition-colors cursor-pointer ${
                            isDarkMode 
                              ? 'bg-white hover:bg-neutral-200 text-neutral-950 font-semibold' 
                              : 'bg-neutral-950 hover:bg-neutral-800 text-white'
                          }`}
                        >
                          Save Annotation
                        </button>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
