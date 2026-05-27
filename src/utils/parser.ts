import { TranscriptSegment } from '../types';

/**
 * Converts formatted time strings like "01:23:45" or "12:34" or "3:45" to total seconds
 */
export function parseTimeToSeconds(timeStr: string): number {
  // Remove outer parentheses or brackets if present
  const cleaned = timeStr.replace(/[\[\(\]\)]/g, '').trim();
  const parts = cleaned.split(':').map(Number);
  
  if (parts.some(isNaN)) return 0;
  
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }
  
  return 0;
}

/**
 * Formats seconds into a human-readable duration like HH:MM:SS or MM:SS
 */
export function formatSecondsToTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  const paddedMinutes = minutes.toString().padStart(2, '0');
  const paddedSeconds = seconds.toString().padStart(2, '0');
  
  if (hours > 0) {
    const paddedHours = hours.toString().padStart(2, '0');
    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  }
  return `${paddedMinutes}:${paddedSeconds}`;
}

/**
 * Parses a variety of raw transcript formats into structured segments
 */
export function parseTranscript(rawText: string): TranscriptSegment[] {
  if (!rawText || !rawText.trim()) return [];

  const segments: TranscriptSegment[] = [];
  const lines = rawText.split('\n');
  
  // Regex to detect timestamps such as (12:34), [1:23:45], 02:15, 12:34:56.
  // Match hours optionally: \d{1,2}:
  // Match minutes: \d{2}
  // Match seconds: :\d{2}
  const timestampRegex = /(?:[\[\(])?(\d{1,2}:\d{2}(?::\d{2})?)(?:[\]\)])?/;
  
  let currentSegment: Partial<TranscriptSegment> | null = null;
  let segmentIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if line contains or starts with a timestamp
    const match = line.match(timestampRegex);
    
    if (match) {
      const fullTimestampWithBrackets = match[0];
      const timeStr = match[1];
      const startSeconds = parseTimeToSeconds(timeStr);
      
      // Extract text after or before the timestamp on the same line
      let text = line.replace(fullTimestampWithBrackets, '').trim();
      // Remove leading speaker markers like ">>" or "Speaker 1:"
      text = text.replace(/^>>\s*/, '').replace(/^[A-Za-z0-9\s]+:\s*/, '').trim();
      
      // Save the previous segment if complete
      if (currentSegment && currentSegment.text) {
        segments.push(currentSegment as TranscriptSegment);
      }
      
      currentSegment = {
        id: `seg_${segmentIndex++}`,
        timestamp: `(${timeStr})`,
        startSeconds,
        text,
      };
    } else {
      // Line does not have a timestamp. Append text to the current segment if it exists
      if (currentSegment) {
        const cleanedLine = line.replace(/^>>\s*/, '').replace(/^[A-Za-z0-9\s]+:\s*/, '').trim();
        if (cleanedLine) {
          currentSegment.text = currentSegment.text 
            ? `${currentSegment.text} ${cleanedLine}` 
            : cleanedLine;
        }
      } else {
        // Edge case: Text starts before any timestamp. Create a segment starting at 0s
        const cleanedLine = line.replace(/^>>\s*/, '').replace(/^[A-Za-z0-9\s]+:\s*/, '').trim();
        if (cleanedLine) {
          currentSegment = {
            id: `seg_${segmentIndex++}`,
            timestamp: '(00:00)',
            startSeconds: 0,
            text: cleanedLine,
          };
        }
      }
    }
  }

  // Add the final active segment
  if (currentSegment && currentSegment.text) {
    segments.push(currentSegment as TranscriptSegment);
  }

  return segments;
}

/**
 * Extracts a YouTube ID from any YouTube URL (standard, shortened, share, embed, etc.)
 */
export function getYoutubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}
