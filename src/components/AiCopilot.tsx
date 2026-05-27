import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { TranscriptSegment, StudyHighlight } from '../types';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  HelpCircle, 
  Loader2, 
  Plus, 
  Eye, 
  AlertCircle, 
  Clock, 
  BookOpen, 
  HeartHandshake,
  MessageSquare,
  BookmarkPlus
} from 'lucide-react';

interface AiCopilotProps {
  segments: TranscriptSegment[];
  highlights: Record<string, StudyHighlight>;
  onSegmentClick: (seconds: number) => void;
  onAddHighlight: (segmentId: string, color: 'yellow' | 'green' | 'blue' | 'purple', note?: string) => void;
  videoTitle: string;
  isDarkMode?: boolean;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

interface GeneratedNote {
  segmentId: string;
  timestamp: string;
  color: 'yellow' | 'green' | 'blue' | 'purple';
  concept: string;
  note: string;
}

export default function AiCopilot({
  segments,
  highlights,
  onSegmentClick,
  onAddHighlight,
  videoTitle,
  isDarkMode = false
}: AiCopilotProps) {
  const [panelMode, setPanelMode] = useState<'chat' | 'generator'>('chat');

  // CHAT STATE
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: "Hello! I am your AI Study Copilot. I have analyzed this lesson's transcript. You can ask me any doubt about the contents, requests for summaries, or specific technical terms discussed in the video!",
      timestamp: Date.now()
    }
  ]);
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // NOTE GENERATOR STATE
  const [notesTopic, setNotesTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState<GeneratedNote[]>([]);
  const [generatorError, setGeneratorError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAsking]);

  // Starter suggestion triggers
  const chatSuggestions = [
    "What are the 3 most important takeaways from this video?",
    "Explain the core technical concept or thesis.",
    "Can you outline an interactive FAQ mapping the key moments?"
  ];

  const handleAskSuggestion = (suggestion: string) => {
    if (isAsking) return;
    submitQuestion(suggestion);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isAsking) return;
    submitQuestion(question);
  };

  const submitQuestion = async (userText: string) => {
    setQuestion('');
    setChatError(null);
    setIsAsking(true);

    const newUserMessage: ChatMessage = {
      role: 'user',
      text: userText,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, newUserMessage]);

    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptSegments: segments,
          question: userText,
          chatHistory: chatHistory.slice(-6).map(m => ({ role: m.role, text: m.text })),
          videoTitle: videoTitle
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An unexpected system error occurred.");
      }

      setChatHistory(prev => [...prev, {
        role: 'model',
        text: data.answer,
        timestamp: Date.now()
      }]);
    } catch (err: any) {
      console.error(err);
      setChatError(err.message || "Failed to request study assistance.");
    } finally {
      setIsAsking(false);
    }
  };

  // Generate Notes
  const handleGenerateNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return;

    setIsGenerating(true);
    setGeneratorError(null);
    setGeneratedNotes([]);

    try {
      const response = await fetch('/api/ai/generate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptSegments: segments,
          focusTopic: notesTopic.trim() || undefined,
          videoTitle: videoTitle
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not outline highlights with Gemini at this moment.");
      }

      setGeneratedNotes(data.notes || []);
    } catch (err: any) {
      console.error(err);
      setGeneratorError(err.message || "Error communicating with study note generators.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper to convert raw timestamps to formatted markdown links [MM:SS](seek:seconds)
  const convertTimestampsToMarkdownLinks = (text: string): string => {
    // Matches formats like [MM:SS], [HH:MM:SS], [M:SS], or pure timestamps without brackets 12:34
    // Regexp targets optional bracket followed by digits, colon, digits, optional colon and digits, optional bracket
    const regex = /(?:\[)?\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b(?:\])?/g;
    return text.replace(regex, (match, p1, p2, p3) => {
      const part1 = parseInt(p1, 10);
      const part2 = parseInt(p2, 10);
      const part3 = p3 ? parseInt(p3, 10) : null;

      let seconds = 0;
      if (part3 !== null) {
        // HH:MM:SS format
        seconds = part1 * 3600 + part2 * 60 + part3;
      } else {
        // MM:SS format
        seconds = part1 * 60 + part2;
      }

      const cleanLabel = part3 !== null 
        ? `${String(part1).padStart(2, '0')}:${String(part2).padStart(2, '0')}:${String(part3).padStart(2, '0')}`
        : `${String(part1).padStart(2, '0')}:${String(part2).padStart(2, '0')}`;

      return `[${cleanLabel}](seek:${seconds})`;
    });
  };

  // Check if a segmentId already has a Highlight in notebook
  const isSegmentAnnotated = (segmentId: string) => {
    return !!highlights[segmentId];
  };

  // Convert timeline timestamp string (e.g. "01:23") to seconds for timeline note click action
  const timestampToSeconds = (timestampStr: string) => {
    const parts = timestampStr.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  const getBorderColor = (color: string) => {
    switch (color) {
      case 'yellow': return 'border-amber-450';
      case 'green': return 'border-emerald-400';
      case 'blue': return 'border-blue-400';
      case 'purple': return 'border-purple-400';
      default: return 'border-neutral-300';
    }
  };

  const getTagBgColor = (color: string) => {
    switch (color) {
      case 'yellow': return 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300';
      case 'green': return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';
      case 'blue': return 'bg-blue-100 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300';
      case 'purple': return 'bg-purple-100 text-purple-900 dark:bg-purple-950/40 dark:text-purple-300';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <div id="ai-study-copilot" className={`rounded-2xl border transition-colors duration-200 p-5 h-full flex flex-col justify-between ${
      isDarkMode 
        ? 'bg-[#1c1c1e] border-neutral-800/85' 
        : 'bg-white border-neutral-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.01)]'
    }`}>
      {/* Sub-Header panel switcher */}
      <div className="space-y-4 flex-1 flex flex-col min-h-0">
        <div className={`flex items-center justify-between border-b pb-3.5 transition-colors ${
          isDarkMode ? 'border-neutral-800' : 'border-neutral-100'
        }`}>
          <div className="space-y-1">
            <h3 className={`text-sm font-sans font-semibold flex items-center gap-1.5 ${
              isDarkMode ? 'text-white' : 'text-neutral-900'
            }`}>
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> Study Copilot
            </h3>
            <p className="text-[11px] font-sans text-neutral-400">Ask doubts or auto-compile notebook modules</p>
          </div>

          <div className={`flex p-0.5 rounded-lg border text-[10px] font-sans font-medium transition-all ${
            isDarkMode ? 'bg-[#141415] border-neutral-800' : 'bg-neutral-50 border-neutral-200'
          }`}>
            <button
              onClick={() => setPanelMode('chat')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                panelMode === 'chat'
                  ? isDarkMode ? 'bg-[#2a2a2c] text-white shadow-xs' : 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-505 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Ask Insights
            </button>
            <button
              onClick={() => setPanelMode('generator')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                panelMode === 'generator'
                  ? isDarkMode ? 'bg-[#2a2a2c] text-white shadow-xs' : 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-505 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Note Generator
            </button>
          </div>
        </div>

        {/* Panel Content Block */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-0">
          
          {panelMode === 'chat' ? (
            /* DUAL-COLUMN LAYOUT: CHAT CHANNEL */
            <div className="space-y-4 h-full flex flex-col justify-between">
              
              {/* Chat bubbles list */}
              <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[310px] md:max-h-[350px] pr-1 scrollbar-thin">
                {chatHistory.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex flex-col space-y-1 ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <span className="text-[9px] font-mono text-neutral-405">
                      {msg.role === 'user' ? 'Student' : 'Assistant Copilot'}
                    </span>
                    <div className={`px-3.5 py-2.5 rounded-xl text-xs leading-relaxed max-w-[85%] font-sans ${
                      msg.role === 'user'
                        ? isDarkMode 
                          ? 'bg-[#2a2a2c] text-neutral-100' 
                          : 'bg-neutral-950 text-white shadow-sm'
                        : isDarkMode
                          ? 'bg-[#151516]/80 text-neutral-300 border border-neutral-805/40' 
                          : 'bg-neutral-50 border border-neutral-105/60 text-neutral-800'
                    }`}>
                      {msg.role === 'model' ? (
                        <div className="markdown-body text-xs leading-relaxed space-y-1">
                          <ReactMarkdown
                            components={{
                              a: ({ href, children }) => {
                                if (href?.startsWith('seek:')) {
                                  const seconds = parseInt(href.split(':')[1], 10);
                                  return (
                                    <button
                                      onClick={() => onSegmentClick(seconds)}
                                      className={`inline-flex items-center gap-0.5 mx-0.5 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none hover:underline cursor-pointer transition-colors ${
                                        isDarkMode 
                                          ? 'bg-amber-950/40 border-amber-900/60 text-amber-300 hover:bg-amber-900/40' 
                                          : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                                      }`}
                                      title="Seek video to timestamp"
                                    >
                                      <Clock className="w-2.5 h-2.5" />
                                      {children}
                                    </button>
                                  );
                                }
                                return (
                                  <a 
                                    href={href} 
                                    className={`underline font-medium ${
                                      isDarkMode ? 'text-amber-400' : 'text-neutral-900'
                                    }`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                  >
                                    {children}
                                  </a>
                                );
                              },
                              h1: ({ children }) => <h1 className="text-xs font-bold mt-2 mb-1 text-inherit">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-xs font-bold mt-2 mb-1 text-inherit">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-[11px] font-bold mt-1.5 mb-1 text-inherit">{children}</h3>,
                              p: ({ children }) => <p className="mb-1 leading-relaxed text-inherit">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5 text-inherit">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5 text-inherit">{children}</ol>,
                              li: ({ children }) => <li className="text-inherit">{children}</li>,
                              blockquote: ({ children }) => (
                                <blockquote className={`border-l-2 pl-2 italic my-1 ${
                                  isDarkMode ? 'border-neutral-700 text-neutral-400' : 'border-neutral-300 text-neutral-600'
                                }`}>
                                  {children}
                                </blockquote>
                              ),
                              code: ({ children }) => (
                                <code className={`px-1 py-0.5 rounded font-mono text-[10px] ${
                                  isDarkMode ? 'bg-[#202022] text-neutral-200' : 'bg-neutral-100/80 text-neutral-800 border'
                                }`}>
                                  {children}
                                </code>
                              ),
                            }}
                          >
                            {convertTimestampsToMarkdownLinks(msg.text)}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                ))}

                {isAsking && (
                  <div className="flex flex-col space-y-1 items-start">
                    <span className="text-[9px] font-mono text-neutral-405">Assistant Copilot</span>
                    <div className={`inline-flex items-center gap-2 px-3.5 py-4 rounded-xl text-xs font-sans ${
                      isDarkMode ? 'bg-[#151516] text-neutral-400' : 'bg-neutral-50 text-neutral-550'
                    }`}>
                      <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                      <span>Synthesizing video segment insights...</span>
                    </div>
                  </div>
                )}

                {chatError && (
                  <div className={`p-3 rounded-xl border flex items-start gap-2 text-xs font-sans ${
                    isDarkMode ? 'bg-red-950/10 border-red-900/30 text-red-400' : 'bg-red-50 border-red-200/50'
                  }`}>
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Analysis Failed</span>
                      <p className="text-[11px] leading-relaxed opacity-90">{chatError}</p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick suggestion bubbles (Shown only if thread has <= 2 messages and not loading) */}
              {chatHistory.length <= 2 && !isAsking && (
                <div className="space-y-2 pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                  <span className="text-[9px] font-sans font-semibold tracking-wide text-neutral-400 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" /> Starter doubts
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {chatSuggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => handleAskSuggestion(sug)}
                        className={`text-[10px] font-sans text-left px-2.5 py-1.5 rounded-lg border hover:opacity-95 text-ellipsis line-clamp-1 block shrink-0 max-w-full cursor-pointer transition-all ${
                          isDarkMode 
                            ? 'bg-[#131314]/80 text-neutral-300 border-neutral-805 hover:bg-[#202022]' 
                            : 'bg-neutral-50/50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* NOTE EXTRAS GENERATOR PANEL */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-sans font-semibold text-neutral-450 uppercase tracking-wider block">AI Structured Notes</span>
                <p className="text-[11px] font-sans text-neutral-500 leading-normal">
                  Generate milestone annotations chronologically directly mapped onto transcript markers. Filter by focus area or tap generic guidelines.
                </p>
              </div>

              {/* Note parameter drafting form */}
              <form onSubmit={handleGenerateNotes} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Focus topic, e.g. 'Recursion', 'Styling' (optional)..."
                    value={notesTopic}
                    onChange={(e) => setNotesTopic(e.target.value)}
                    disabled={isGenerating}
                    className={`flex-1 px-3 py-1.5 text-xs rounded-xl border font-sans focus:outline-none transition-colors ${
                      isDarkMode
                        ? 'bg-[#141415] border-neutral-800 text-white focus:border-amber-450'
                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-neutral-500'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className={`px-3.5 py-1.5 text-xs font-sans font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all ${
                      isDarkMode
                        ? 'bg-amber-500 hover:bg-amber-600 text-neutral-950'
                        : 'bg-neutral-950 hover:bg-neutral-800 text-white'
                    }`}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Outline</span>
                  </button>
                </div>
              </form>

              {generatorError && (
                <div className={`p-3 rounded-xl border flex items-start gap-2 text-xs font-sans ${
                  isDarkMode ? 'bg-red-950/10 border-red-900/30 text-red-400' : 'bg-red-50 border-red-200/50'
                }`}>
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Drafting Interrupted</span>
                    <p className="text-[11px] leading-relaxed opacity-90">{generatorError}</p>
                  </div>
                </div>
              )}

              {/* Loading Placeholder */}
              {isGenerating && (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 rounded-full border border-neutral-300 dark:border-neutral-700 border-t-amber-500 dark:border-t-amber-500 animate-spin mx-auto"></div>
                  <div className="space-y-1">
                    <p className={`text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>Weaving Conceptual Notebook...</p>
                    <p className="text-[10px] font-sans text-neutral-500 max-w-[240px] mx-auto">Gemini is locating learning moments and mapping highlights to timeline nodes.</p>
                  </div>
                </div>
              )}

              {/* Concept Notebook empty state */}
              {generatedNotes.length === 0 && !isGenerating && (
                <div className={`text-center py-12 border border-dashed rounded-xl ${
                  isDarkMode ? 'border-neutral-800' : 'border-neutral-200'
                }`}>
                  <BookOpen className="w-6 h-6 text-neutral-450 mx-auto mb-2" />
                  <p className="text-xs font-sans text-neutral-500 leading-normal max-w-[200px] mx-auto">
                    Click "Outline" to let Gemini extract structural notebook concepts!
                  </p>
                </div>
              )}

              {/* Rendered Notes List */}
              {generatedNotes.length > 0 && !isGenerating && (
                <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
                  {generatedNotes.map((note, index) => {
                    const isAdded = isSegmentAnnotated(note.segmentId);
                    
                    return (
                      <div
                        key={index}
                        className={`p-3.5 border-l-3 rounded-xl border transition-all text-xs space-y-2 relative group flex flex-col justify-between ${
                          isDarkMode 
                            ? 'bg-[#151516]/80 border-neutral-[#242426]' 
                            : 'bg-neutral-50/50 border-neutral-200/60'
                        } ${getBorderColor(note.color)}`}
                      >
                        <div className="space-y-1.5">
                          {/* Top badge line */}
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded ${getTagBgColor(note.color)}`}>
                              {note.color.toUpperCase()} / {note.concept}
                            </span>

                            <span className="text-[10px] font-mono font-semibold text-neutral-400">
                              {note.timestamp}
                            </span>
                          </div>

                          {/* Concept annotation detailed block */}
                          <p className={`font-sans leading-relaxed text-[11px] ${
                            isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
                          }`}>
                            {note.note}
                          </p>
                        </div>

                        {/* Interactive footer click buttons */}
                        <div className="flex gap-2 font-sans pt-1.5 border-t border-dashed border-neutral-250 dark:border-neutral-800/60">
                          <button
                            onClick={() => onSegmentClick(timestampToSeconds(note.timestamp))}
                            className={`flex-1 py-1 rounded-md text-[10px] font-medium inline-flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                              isDarkMode 
                                ? 'bg-[#212123] text-neutral-300 hover:bg-[#2a2a2c] hover:text-white' 
                                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                            }`}
                          >
                            <Eye className="w-3 h-3" /> Preview Time
                          </button>

                          <button
                            onClick={() => {
                              if (!isAdded) {
                                onAddHighlight(note.segmentId, note.color, note.note);
                              }
                            }}
                            disabled={isAdded}
                            className={`flex-1 py-1 rounded-md text-[10px] font-semibold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                              isAdded
                                ? 'bg-emerald-950/25 text-emerald-400 border border-emerald-900/40 cursor-default'
                                : isDarkMode
                                  ? 'bg-amber-500 hover:bg-amber-600 text-neutral-950'
                                  : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Saved
                              </>
                            ) : (
                              <>
                                <BookmarkPlus className="w-3 h-3" /> Add Highlight
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

        </div>
      </div>

      {/* Interactive Chat Form footer */}
      {panelMode === 'chat' && (
        <form onSubmit={handleChatSubmit} className="flex gap-2 pt-3 border-t border-neutral-150/50 dark:border-neutral-850">
          <input
            type="text"
            placeholder="Ask anything about the video..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isAsking}
            className={`flex-1 px-3.5 py-2 text-xs rounded-xl border font-sans focus:outline-none transition-colors ${
              isDarkMode
                ? 'bg-[#141415] border-neutral-800 text-white focus:border-amber-450'
                : 'bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-400'
            }`}
          />
          <button
            type="submit"
            disabled={!question.trim() || isAsking}
            className={`px-3 py-2 rounded-xl border text-xs cursor-pointer hover:opacity-90 disabled:opacity-40 transition-all ${
              isDarkMode
                ? 'bg-amber-500 border-amber-500 text-neutral-950 hover:bg-amber-600'
                : 'bg-neutral-900 border-neutral-900 text-white hover:bg-neutral-850'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
}
