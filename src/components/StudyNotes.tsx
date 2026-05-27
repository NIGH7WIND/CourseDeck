import React, { useMemo } from 'react';
import { TranscriptSegment, StudyHighlight } from '../types';
import { Download, FileText, CheckCircle2, Bookmark, Clock, Trash2, ArrowRight } from 'lucide-react';

interface StudyNotesProps {
  segments: TranscriptSegment[];
  highlights: Record<string, StudyHighlight>;
  onSegmentClick: (seconds: number) => void;
  onRemoveHighlight: (segmentId: string) => void;
  sessionTitle: string;
  isDarkMode?: boolean;
}

export default function StudyNotes({
  segments,
  highlights,
  onSegmentClick,
  onRemoveHighlight,
  sessionTitle,
  isDarkMode = false
}: StudyNotesProps) {
  
  // Combine segments and highlights for chronologically ordered list
  const annotatedNotes = useMemo(() => {
    return segments
      .filter(seg => highlights[seg.id])
      .map(seg => ({
        segment: seg,
        highlight: highlights[seg.id]
      }));
  }, [segments, highlights]);

  // Download Study Guide as Markdown
  const downloadMarkdownGuide = () => {
    if (annotatedNotes.length === 0) return;

    let mdContent = `# Study Companion Guide: ${sessionTitle}\n`;
    mdContent += `Generated on ${new Date().toLocaleDateString()} via Reading-First YouTube Study Wrapper\n\n`;
    mdContent += `## 📚 Core Study Annotations & Highlights\n\n`;

    annotatedNotes.forEach(({ segment, highlight }, index) => {
      mdContent += `### ${index + 1}. Segment ${segment.timestamp}\n`;
      mdContent += `**Transcript Moment:**\n> ${segment.text}\n\n`;
      
      if (highlight.note) {
        mdContent += `**My Custom Explanations / Thoughts:**\n* ${highlight.note}\n`;
      }
      mdContent += `*Color Tag:* ${highlight.color.toUpperCase()}\n\n`;
      mdContent += `---\n\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${sessionTitle.replace(/[^A-Za-z0-9]/g, '_')}_study_guide.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate study metrics
  const progressPercent = useMemo(() => {
    if (segments.length === 0) return 0;
    const percentage = Math.min(100, Math.round((annotatedNotes.length / segments.length) * 100));
    return percentage;
  }, [segments.length, annotatedNotes.length]);

  return (
    <div id="study-notes-dashboard" className={`rounded-2xl border transition-colors duration-200 p-6 space-y-6 h-full flex flex-col justify-between ${
      isDarkMode ? 'bg-[#1c1c1e] border-neutral-800/85' : 'bg-white border-neutral-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.01)]'
    }`}>
      <div className="space-y-6">
        {/* Header summary info */}
        <div className={`flex items-center justify-between border-b pb-4 transition-colors ${
          isDarkMode ? 'border-neutral-800' : 'border-neutral-100'
        }`}>
          <div className="space-y-1">
            <h3 className={`text-sm font-sans font-semibold flex items-center gap-1.5 ${
              isDarkMode ? 'text-white' : 'text-neutral-900'
            }`}>
              <Bookmark className="w-4 h-4 text-neutral-500" /> Lesson Notebook
            </h3>
            <p className="text-[11px] font-sans text-neutral-500">Collects summaries and highlights chronologically</p>
          </div>

          {annotatedNotes.length > 0 && (
            <button
              id="btn-export-markdown"
              onClick={downloadMarkdownGuide}
              className={`text-xs font-sans font-medium hover:opacity-90 border rounded-lg px-2.5 py-1.5 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isDarkMode 
                  ? 'text-neutral-200 bg-[#242426] border-neutral-805 hover:bg-[#2c2c2e]' 
                  : 'text-neutral-600 bg-neutral-50 hover:bg-neutral-100 border-neutral-200 hover:text-neutral-900'
              }`}
              title="Download Markdown summary guide"
            >
              <Download className="w-3.5 h-3.5" /> Export .MD
            </button>
          )}
        </div>

        {/* Study metrics card */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className={`p-3.5 rounded-xl border flex flex-col gap-1 transition-colors ${
            isDarkMode ? 'bg-[#131314] border-neutral-805/40' : 'bg-neutral-50 border-neutral-100'
          }`}>
            <span className="text-[10px] font-sans font-medium text-neutral-505 uppercase tracking-widest">Highlights</span>
            <span className={`text-xl font-mono font-bold ${isDarkMode ? 'text-white' : 'text-neutral-800'}`}>{annotatedNotes.length}</span>
            <span className="text-[9px] font-sans text-neutral-400">interactive points</span>
          </div>
          <div className={`p-3.5 rounded-xl border flex flex-col gap-1 transition-colors ${
            isDarkMode ? 'bg-[#131314] border-neutral-805/40' : 'bg-neutral-50 border-neutral-100'
          }`}>
            <span className="text-[10px] font-sans font-medium text-neutral-505 uppercase tracking-widest">Study Coverage</span>
            <span className={`text-xl font-mono font-bold ${isDarkMode ? 'text-white' : 'text-neutral-800'}`}>{progressPercent}%</span>
            <span className="text-[9px] font-sans text-neutral-400">coverage coefficient</span>
          </div>
        </div>

        {/* Notes Line list */}
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {annotatedNotes.length === 0 ? (
            <div className={`text-center py-10 space-y-2 border border-dashed rounded-xl ${
              isDarkMode ? 'border-neutral-800' : 'border-neutral-200'
            }`}>
              <FileText className="w-5 h-5 text-neutral-450 mx-auto" />
              <p className="text-xs font-sans text-neutral-500 leading-normal max-w-[200px] mx-auto">
                No active highlights yet. Hover segments to apply highlighters and draft summaries!
              </p>
            </div>
          ) : (
            annotatedNotes.map(({ segment, highlight }) => {
              const borderColors = isDarkMode ? {
                yellow: 'border-amber-900 bg-amber-950/15',
                green: 'border-emerald-900 bg-emerald-950/15',
                blue: 'border-blue-900 bg-blue-950/15',
                purple: 'border-purple-900 bg-purple-950/15'
              } : {
                yellow: 'border-amber-300 bg-amber-50/10',
                green: 'border-emerald-300 bg-emerald-50/10',
                blue: 'border-blue-300 bg-blue-50/10',
                purple: 'border-purple-300 bg-purple-50/10'
              };

              return (
                <div
                  key={segment.id}
                  className={`p-3.5 border rounded-xl hover:border-neutral-400/50 transition-all text-xs space-y-2 relative group ${borderColors[highlight.color]}`}
                >
                  {/* Jump time trigger */}
                  <div className="flex items-center justify-between font-sans">
                    <button
                      onClick={() => onSegmentClick(segment.startSeconds)}
                      className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold hover:underline px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        isDarkMode 
                          ? 'text-neutral-200 bg-[#242426] hover:bg-neutral-800' 
                          : 'text-neutral-800 bg-neutral-100 hover:bg-neutral-200/80'
                      }`}
                    >
                      <Clock className="w-3 h-3" /> Jump to {segment.timestamp.replace(/[\(\)]/g, '')}
                    </button>

                    <button
                      onClick={() => onRemoveHighlight(segment.id)}
                      className="p-1 text-neutral-400 hover:text-red-500 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove from notebook"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Highlight text preview snippet */}
                  <p className={`font-sans leading-relaxed border-l pl-2 line-clamp-2 ${
                    isDarkMode ? 'text-neutral-300 border-neutral-700' : 'text-neutral-700 border-neutral-300'
                  }`}>
                    "{segment.text}"
                  </p>

                  {/* Custom typed note if any */}
                  {highlight.note && (
                    <div className={`mt-1 font-sans font-medium p-2 rounded-lg border text-[11px] ${
                      isDarkMode 
                        ? 'text-neutral-100 bg-[#0e0e0f]/80 border-neutral-850' 
                        : 'text-neutral-900 bg-white/75 border-neutral-200/50'
                    }`}>
                      <span className="text-[9px] font-sans font-semibold tracking-wide text-neutral-450 block uppercase mb-0.5">My Annotations</span>
                      {highlight.note}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Motivational study footer */}
      {annotatedNotes.length > 0 && (
        <div className="border-t border-neutral-100 dark:border-neutral-800/80 pt-4 text-[10px] font-sans text-neutral-400 text-center">
          Interactive notes are saved natively in this browser's cache.
        </div>
      )}
    </div>
  );
}
