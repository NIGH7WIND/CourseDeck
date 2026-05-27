import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, FastForward, Info } from 'lucide-react';
import { formatSecondsToTime } from '../utils/parser';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface VideoPlayerProps {
  videoId: string;
  seekToSeconds: number | null;
  onTimeUpdate: (seconds: number) => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  isDarkMode?: boolean;
}

export default function VideoPlayer({
  videoId,
  seekToSeconds,
  onTimeUpdate,
  playbackSpeed,
  onSpeedChange,
  isDarkMode = false
}: VideoPlayerProps) {
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const containerId = `yt-player-${videoId}`;
  const playerRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Load YouTube Player API script
  useEffect(() => {
    const loadApi = () => {
      if (window.YT && window.YT.Player) {
        initPlayer();
        return;
      }

      // If already appended, just bind to onYouTubeIframeAPIReady
      const existingScript = document.getElementById('youtube-iframe-api-script');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      // Save previous callback if exists
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
    };

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      // Ensure the container element is in DOM before construction
      try {
        if (playerRef.current) {
          playerRef.current.destroy();
        }

        playerRef.current = new window.YT.Player(containerId, {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            playsinline: 1,
            controls: 1, // Let user have full native controls
            modestbranding: 1,
            rel: 0,
            fs: 1,
          },
          events: {
            onReady: (event: any) => {
              setPlayerReady(true);
              setDuration(event.target.getDuration());
              event.target.setPlaybackRate(playbackSpeed);
            },
            onStateChange: (event: any) => {
              // YT.PlayerState: UNSTARTED = -1, ENDED = 0, PLAYING = 1, PAUSED = 2, BUFFERING = 3, CUED = 5
              const state = event.data;
              if (state === 1) {
                setIsPlaying(true);
                startTrackingTime();
              } else {
                setIsPlaying(false);
                stopTrackingTime();
              }
            }
          }
        });
      } catch (err) {
        console.error("Error creating YouTube player:", err);
      }
    };

    loadApi();

    return () => {
      stopTrackingTime();
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [videoId]);

  // Handle speed changes
  useEffect(() => {
    if (playerRef.current && playerReady) {
      playerRef.current.setPlaybackRate(playbackSpeed);
    }
  }, [playbackSpeed, playerReady]);

  // Handle programmatic seeking
  useEffect(() => {
    if (seekToSeconds !== null && playerRef.current && playerReady) {
      playerRef.current.seekTo(seekToSeconds, true);
      playerRef.current.playVideo();
    }
  }, [seekToSeconds, playerReady]);

  // Track playback current time
  const startTrackingTime = () => {
    stopTrackingTime();
    timerRef.current = setInterval(() => {
      if (playerRef.current && playerReady) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        onTimeUpdate(time);
      }
    }, 250); // Tick 4 times a second for snappy transcript updating
  };

  const stopTrackingTime = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const togglePlay = () => {
    if (!playerRef.current || !playerReady) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const skipSeconds = (amount: number) => {
    if (!playerRef.current || !playerReady) return;
    const current = playerRef.current.getCurrentTime();
    playerRef.current.seekTo(Math.max(0, Math.min(duration, current + amount)), true);
  };

  return (
    <div id="video-player-component-root" className="sticky top-6 space-y-4">
      {/* Decorative Title/Status Header */}
      <div className="flex items-center justify-between text-xs px-1">
        <span className="font-mono text-neutral-400 font-medium tracking-wider uppercase flex items-center gap-1.5 font-sans">
          <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300'}`}></span>
          Sync Video Companion
        </span>
        <span className="font-mono text-neutral-500">
          {formatSecondsToTime(currentTime)} / {formatSecondsToTime(duration)}
        </span>
      </div>

      {/* Video Container (Classic aspect-video) */}
      <div className={`relative aspect-video w-full bg-neutral-900 rounded-xl overflow-hidden border shadow-sm group transition-colors ${
        isDarkMode ? 'border-neutral-805' : 'border-neutral-200'
      }`}>
        <div id={containerId} className="w-full h-full" />
        
        {/* Loader Overlay before player API is ready */}
        {!playerReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-905 text-neutral-300 gap-3">
            <div className="w-6 h-6 border-2 border-neutral-600 border-t-white rounded-full animate-spin"></div>
            <p className="text-xs font-sans font-medium text-neutral-400">Loading YouTube stream player...</p>
          </div>
        )}
      </div>

      {/* Primary Study Integration Controls */}
      <div className={`border rounded-xl p-4 space-y-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-colors duration-200 ${
        isDarkMode ? 'bg-[#1c1c1e] border-neutral-800/85 text-neutral-100' : 'bg-white border-neutral-200/80'
      }`}>
        
        {/* Fast Action Study Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => skipSeconds(-10)}
              id="player-back-10"
              className={`p-2 rounded-lg transition-colors cursor-pointer border ${
                isDarkMode 
                  ? 'bg-[#242426] hover:bg-[#2c2c2e] text-neutral-300 border-neutral-800/80 hover:text-white' 
                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-transparent hover:text-neutral-900'
              }`}
              title="Skip back 10 seconds"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              id="player-play-toggle"
              className={`px-4 py-2 font-sans font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isDarkMode 
                  ? 'bg-white hover:bg-neutral-200 text-neutral-950 font-bold' 
                  : 'bg-neutral-950 hover:bg-neutral-800 text-white'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" /> Pause Video
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" /> Resume Video
                </>
              )}
            </button>
          </div>

          {/* Speed settings list */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-neutral-405 mr-1.5 hidden sm:inline">Pacing:</span>
            {[0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
              <button
                key={speed}
                id={`btn-speed-${speed}`}
                onClick={() => onSpeedChange(speed)}
                className={`px-2 py-1 text-[10px] font-mono font-medium rounded transition-colors cursor-pointer ${
                  playbackSpeed === speed
                    ? isDarkMode
                      ? 'bg-white text-neutral-950 font-bold'
                      : 'bg-neutral-950 text-white'
                    : isDarkMode
                      ? 'bg-[#242426] hover:bg-[#2c2c2e] text-neutral-300'
                      : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Quick Help Tip */}
        <div className={`flex items-start gap-2 text-[11px] p-2.5 rounded-lg leading-relaxed border transition-colors ${
          isDarkMode 
            ? 'bg-[#141415] border-neutral-850/60 text-neutral-400' 
            : 'bg-neutral-50/50 border-neutral-100 text-neutral-500'
        }`}>
          <Info className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 mt-0.5" />
          <p className="font-sans">
            Need clarity on a paragraph? Double-click any text block or single-click a timestamp badge to instantly snap the YouTube player to that moment.
          </p>
        </div>
      </div>
    </div>
  );
}
