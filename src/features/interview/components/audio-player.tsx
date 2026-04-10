'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  duration?: number;
  onError?: (error: Error) => void;
}

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  error: string | null;
  volume: number;
}

export function AudioPlayer({ audioUrl, duration: initialDuration, onError }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: initialDuration || 0,
    isLoading: true,
    error: null,
    volume: 1,
  });

  // Handle audio metadata loaded
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setState((prev) => ({
        ...prev,
        duration: audioRef.current?.duration || prev.duration,
        isLoading: false,
      }));
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setState((prev) => ({
        ...prev,
        currentTime: audioRef.current?.currentTime || 0,
      }));
    }
  };

  // Handle play
  const handlePlay = () => {
    setState((prev) => ({ ...prev, isPlaying: true }));
  };

  // Handle pause
  const handlePause = () => {
    setState((prev) => ({ ...prev, isPlaying: false }));
  };

  // Handle ended
  const handleEnded = () => {
    setState((prev) => ({ ...prev, isPlaying: false }));
  };

  // Handle error
  const handleError = () => {
    const error = new Error('Failed to load audio');
    onError?.(error);
    setState((prev) => ({ ...prev, error: error.message, isLoading: false }));
  };

  // Play/pause toggle
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (state.isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((err) => {
          const error = new Error(`Failed to play audio: ${err.message}`);
          onError?.(error);
          setState((prev) => ({ ...prev, error: error.message }));
        });
      }
    }
  };

  // Seek to position
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setState((prev) => ({ ...prev, currentTime: newTime }));
    }
  };

  // Change volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setState((prev) => ({ ...prev, volume: newVolume }));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && audioRef.current) {
        e.preventDefault();
        togglePlayPause();
      }
      if (e.code === 'ArrowRight' && audioRef.current) {
        audioRef.current.currentTime = Math.min(
          audioRef.current.currentTime + 5,
          state.duration
        );
      }
      if (e.code === 'ArrowLeft' && audioRef.current) {
        audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 5, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.duration]);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        crossOrigin="anonymous"
      />

      {/* Error Message */}
      {state.error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Playback Error</p>
          <p>{state.error}</p>
        </div>
      )}

      {/* Player Controls */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 space-y-4">
        {/* Play/Pause and Time Display */}
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlayPause}
            disabled={state.isLoading || !!state.error}
            className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            aria-label={state.isPlaying ? 'Pause' : 'Play'}
          >
            {state.isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : state.isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>

          <div className="flex-1 flex items-center gap-3">
            <span className="text-sm font-mono text-slate-600 w-12 text-right">
              {formatTime(state.currentTime)}
            </span>
            <div className="flex-1 h-2 rounded-full bg-slate-200 cursor-pointer group relative">
              <input
                type="range"
                min="0"
                max={state.duration || 0}
                value={state.currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Seek"
              />
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progressPercent}%`, transform: 'translate(-50%, -50%)' }}
              />
            </div>
            <span className="text-sm font-mono text-slate-600 w-12">
              {formatTime(state.duration)}
            </span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            {state.volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
            <span>Volume</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={state.volume}
            onChange={handleVolumeChange}
            className="flex-1 h-2 rounded-full bg-slate-200 cursor-pointer"
            aria-label="Volume"
          />
          <span className="text-sm text-slate-600 w-8 text-right">
            {Math.round(state.volume * 100)}%
          </span>
        </div>

        {/* Info */}
        <p className="text-xs text-slate-500">
          Keyboard shortcuts: Space to play/pause, ← → to seek ±5 seconds
        </p>
      </div>
    </div>
  );
}
