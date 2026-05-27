import React, { useState, useEffect } from 'react';
import { VideoStudySession, ReadingSettings, StudyHighlight } from './types';
import TranscriptImporter from './components/TranscriptImporter';
import VideoPlayer from './components/VideoPlayer';
import TranscriptViewer from './components/TranscriptViewer';
import StudyNotes from './components/StudyNotes';
import { BookOpen, ChevronLeft, Award, RefreshCw, Calendar, Trash2, Sun, Moon } from 'lucide-react';

export default function App() {
  // Dark mode state with LocalStorage checking
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('study_dark_mode') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Saved sessions in LocalStorage
  const [savedSessions, setSavedSessions] = useState<VideoStudySession[]>(() => {
    try {
      const stored = localStorage.getItem('yt_study_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Current active study workshop state
  const [activeSession, setActiveSession] = useState<VideoStudySession | null>(() => {
    try {
      const activeId = localStorage.getItem('yt_active_session_id');
      if (activeId) {
        const stored = localStorage.getItem('yt_study_sessions');
        if (stored) {
          const sessions: VideoStudySession[] = JSON.parse(stored);
          const active = sessions.find(s => s.id === activeId);
          if (active) return active;
        }
      }
    } catch (e) {}
    return null;
  });

  // Target seek seconds to send command to Iframe Player
  const [seekToSeconds, setSeekToSeconds] = useState<number | null>(null);
  
  // Real-time spoken timestamp reported by Youtube video ticking
  const [currentSeconds, setCurrentSeconds] = useState(0);

  // Playback speeds selected by student
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Reading layout configurations
  const [settings, setSettings] = useState<ReadingSettings>({
    fontSize: 'md',
    fontFamily: 'serif', // books default
    lineHeight: 'relaxed',
    autoScroll: true
  });

  // Tab control in the right-hand companion panel (Video vs. Notebook)
  const [rightPanelTab, setRightPanelTab] = useState<'video' | 'notes'>('video');

  // Sync dark mode configuration with body elements and LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('study_dark_mode', String(isDarkMode));
    } catch (e) {}
  }, [isDarkMode]);

  // Persist sessions array to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('yt_study_sessions', JSON.stringify(savedSessions));
    } catch (e) {
      console.error("Failed to save sessions to localStorage", e);
    }
  }, [savedSessions]);

  // Persist active session focus-token
  useEffect(() => {
    try {
      if (activeSession) {
        localStorage.setItem('yt_active_session_id', activeSession.id);
      } else {
        localStorage.removeItem('yt_active_session_id');
      }
    } catch (e) {}
  }, [activeSession]);

  // Command-handlers for studying session lifecycle
  const handleImportSession = (newSession: VideoStudySession) => {
    setSavedSessions(prev => [newSession, ...prev]);
    setActiveSession(newSession);
    setCurrentSeconds(0);
    setSeekToSeconds(null);
    setRightPanelTab('video');
  };

  const handleLoadSession = (session: VideoStudySession) => {
    setActiveSession(session);
    setCurrentSeconds(0);
    setSeekToSeconds(null);
    setRightPanelTab('video');
  };

  const handleDeleteSession = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setSavedSessions(prev => prev.filter(s => s.id !== id));
    if (activeSession && activeSession.id === id) {
      setActiveSession(null);
    }
  };

  const handleUpdateActiveSession = (updated: VideoStudySession) => {
    setActiveSession(updated);
    setSavedSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  // Click handler to seek video to timestamp
  const handleSegmentClick = (seconds: number) => {
    // Setting this state alerts the VideoPlayer useEffect to seek
    setSeekToSeconds(seconds);
    // Immediately clear so subsequent clicks on same segment continue triggering seeks
    setTimeout(() => setSeekToSeconds(null), 50);
  };

  // Add highlight or custom typed annotation note
  const handleAddHighlight = (
    segmentId: string, 
    color: 'yellow' | 'green' | 'blue' | 'purple', 
    note?: string
  ) => {
    if (!activeSession) return;

    const highlight: StudyHighlight = {
      segmentId,
      color,
      note,
      createdAt: Date.now()
    };

    const updatedHighlights = {
      ...activeSession.highlights,
      [segmentId]: highlight
    };

    const updatedSession: VideoStudySession = {
      ...activeSession,
      highlights: updatedHighlights
    };

    handleUpdateActiveSession(updatedSession);
  };

  // Clear specific highlight/note
  const handleRemoveHighlight = (segmentId: string) => {
    if (!activeSession) return;

    const updatedHighlights = { ...activeSession.highlights };
    delete updatedHighlights[segmentId];

    const updatedSession: VideoStudySession = {
      ...activeSession,
      highlights: updatedHighlights
    };

    handleUpdateActiveSession(updatedSession);
  };

  return (
    <div className={`flex flex-col antialiased transition-colors duration-200 ${
      activeSession ? 'h-screen overflow-hidden' : 'min-h-screen'
    } ${
      isDarkMode ? 'bg-[#121212] text-neutral-200' : 'bg-[#fbfbf9] text-neutral-900'
    }`}>
      
      {/* Universal Workspace Header bar */}
      <header className={`h-14 border-b sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-[#18181a] border-neutral-800/80 text-white shadow-none' 
          : 'bg-white border-neutral-200/80 text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.01)]'
      }`}>
        <div className="flex items-center gap-3">
          {activeSession ? (
            <button
              id="header-back-button"
              onClick={() => setActiveSession(null)}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-sans font-medium cursor-pointer ${
                isDarkMode 
                  ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' 
                  : 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-neutral-950 text-white rounded-lg dark:bg-white dark:text-neutral-950">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className={`font-sans font-bold text-sm tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                CourseDeck
              </span>
            </div>
          )}

          {activeSession && (
            <div className={`h-4 w-[1px] hidden sm:block ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-200'}`}></div>
          )}

          {activeSession && (
            <h2 id="header-active-session-title" className={`font-sans text-xs font-semibold line-clamp-1 max-w-[200px] sm:max-w-xs md:max-w-md hidden sm:block ${
              isDarkMode ? 'text-neutral-300' : 'text-neutral-800'
            }`}>
              {activeSession.title}
            </h2>
          )}
        </div>

        {/* Global actions/progress banner & Dark mode control */}
        <div className="flex items-center gap-3">
          {activeSession && (
            <div className={`hidden md:flex items-center gap-1 text-[10px] px-2.5 py-1 border rounded-full font-mono font-medium ${
              isDarkMode 
                ? 'bg-amber-950/20 text-amber-300 border-amber-900/60' 
                : 'bg-amber-50 text-amber-900 border-amber-200/50'
            }`}>
              <Award className="w-3 h-3 text-amber-500" /> ACTIVE STUDY HOUR
            </div>
          )}

          {/* Theme Switcher Toggle button */}
          <button
            id="theme-switcher-toggle"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg transition-all border cursor-pointer ${
              isDarkMode 
                ? 'bg-[#242426] border-neutral-700 text-amber-400 hover:bg-[#2c2c2e]' 
                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-905'
            }`}
            title={isDarkMode ? "Switch to light reading paper mode" : "Switch to late-night eye-safe companion layout"}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <span className="text-xs text-neutral-400 font-mono hidden sm:inline">2026 Sandbox Ed.</span>
        </div>
      </header>

      {/* Main workspace element switcher */}
      <main className={`flex-1 flex flex-col ${activeSession ? 'overflow-hidden' : ''}`}>
        {!activeSession ? (
          /* Landing page & onboarding */
          <div className="flex-1 flex flex-col justify-center py-6 sm:py-12">
            <TranscriptImporter
              onImport={handleImportSession}
              savedSessions={savedSessions}
              onLoadSession={handleLoadSession}
              onDeleteSession={handleDeleteSession}
              isDarkMode={isDarkMode}
            />
          </div>
        ) : (
          /* Active split study layout */
          <div className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 flex flex-col lg:grid lg:grid-cols-5 gap-4 lg:gap-6 h-[calc(100vh-3.5rem)] overflow-hidden">
            
            {/* Primary Study Column: Detailed transcript (prioritizing reading) */}
            <div className="order-2 lg:order-1 lg:col-span-3 flex-1 lg:h-full overflow-hidden flex flex-col min-w-0 h-0">
              <div className="flex-1 h-full min-h-0">
                <TranscriptViewer
                  segments={activeSession.segments}
                  currentSeconds={currentSeconds}
                  onSegmentClick={handleSegmentClick}
                  highlights={activeSession.highlights}
                  onAddHighlight={handleAddHighlight}
                  onRemoveHighlight={handleRemoveHighlight}
                  settings={settings}
                  onUpdateSettings={setSettings}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>

            {/* Companion column split panel (sticky player and side notes notebook) */}
            <div className="order-1 lg:order-2 lg:col-span-2 flex flex-col gap-3 lg:gap-4 h-auto lg:h-full overflow-hidden min-w-0 shrink-0">
              
              {/* Tab Selector buttons */}
              <div className={`flex p-1 rounded-xl border transition-all ${
                isDarkMode ? 'bg-[#18181a] border-[#2c2c2e]' : 'bg-neutral-100 border-neutral-200'
              }`}>
                <button
                  id="tab-companion-video"
                  onClick={() => setRightPanelTab('video')}
                  className={`flex-1 py-1.5 text-xs font-sans font-medium rounded-lg cursor-pointer transition-all ${
                    rightPanelTab === 'video'
                      ? isDarkMode 
                        ? 'bg-[#2a2a2c] text-white shadow-xs' 
                        : 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-850 dark:hover:text-neutral-300'
                  }`}
                >
                  Video Companion
                </button>
                <button
                  id="tab-companion-notes"
                  onClick={() => setRightPanelTab('notes')}
                  className={`flex-1 py-1.5 text-xs font-sans font-medium rounded-lg cursor-pointer transition-all ${
                    rightPanelTab === 'notes'
                      ? isDarkMode 
                        ? 'bg-[#2a2a2c] text-white shadow-xs' 
                        : 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-850 dark:hover:text-neutral-300'
                  }`}
                >
                  Notebook Summary ({Object.keys(activeSession.highlights).length})
                </button>
              </div>

              {/* Collateral visual rendering components */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {rightPanelTab === 'video' ? (
                  <VideoPlayer
                    videoId={activeSession.youtubeId}
                    seekToSeconds={seekToSeconds}
                    onTimeUpdate={setCurrentSeconds}
                    playbackSpeed={playbackSpeed}
                    onSpeedChange={setPlaybackSpeed}
                    isDarkMode={isDarkMode}
                  />
                ) : (
                  <StudyNotes
                    segments={activeSession.segments}
                    highlights={activeSession.highlights}
                    onSegmentClick={handleSegmentClick}
                    onRemoveHighlight={handleRemoveHighlight}
                    sessionTitle={activeSession.title}
                    isDarkMode={isDarkMode}
                  />
                )}
              </div>

            </div>

          </div>
        )}
      </main>

    </div>
  );
}
