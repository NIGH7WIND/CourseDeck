/**
 * Types for the Reading-First YouTube Study Wrapper
 */

export interface TranscriptSegment {
  id: string;
  timestamp: string; // Original timestamp string, e.g. "(00:27)" or "01:23"
  startSeconds: number; // Start time in seconds for direct seeking
  text: string;
}

export interface StudyHighlight {
  segmentId: string;
  color: 'yellow' | 'green' | 'blue' | 'purple';
  note?: string;
  createdAt: number;
}

export interface VideoStudySession {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeId: string;
  transcriptRaw: string;
  segments: TranscriptSegment[];
  highlights: Record<string, StudyHighlight>; // Map of segmentId -> highlight
  createdAt: number;
  lastReadSegmentId?: string;
}

export interface ReadingSettings {
  fontSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fontFamily: 'sans' | 'serif' | 'mono';
  lineHeight: 'tight' | 'normal' | 'relaxed' | 'loose';
  autoScroll: boolean;
}
