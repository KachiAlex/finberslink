"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Volume2, AlertCircle, Loader } from "lucide-react";

interface AudioPlaybackProps {
  responseId: string;
  sessionId: string;
  onError?: (error: string) => void;
}

export function AudioPlayback({
  responseId,
  sessionId,
  onError,
}: AudioPlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch signed URL and load audio
  useEffect(() => {
    const loadAudio = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/interview-sessions/${sessionId}/responses/${responseId}/audio`,
        );

        if (!response.ok) {
          throw new Error("Failed to load audio");
        }

        const data = await response.json();

        if (audioRef.current) {
          audioRef.current.src = data.signedUrl;
          audioRef.current.load();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load audio";
        setError(message);
        onError?.(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadAudio();
  }, [responseId, sessionId, onError]);

  // Handle play/pause
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle rewind
  const rewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle audio events
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleError = () => {
    const message = "Failed to play audio";
    setError(message);
    onError?.(message);
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = percent * duration;
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="font-semibold text-slate-900">Playback</h3>
        <p className="text-sm text-slate-600">
          Listen to your recorded response
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-50 p-4">
          <Loader className="h-4 w-4 animate-spin text-slate-600" />
          <span className="text-sm text-slate-600">Loading audio...</span>
        </div>
      )}

      {/* Audio Element (hidden) */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
        crossOrigin="anonymous"
      />

      {/* Player Controls */}
      {!isLoading && !error && (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div
              onClick={handleProgressClick}
              className="h-2 w-full cursor-pointer overflow-hidden rounded-full bg-slate-200 hover:h-3"
            >
              <div
                className="h-full bg-blue-500 transition-all"
                style={{
                  width: duration ? `${(currentTime / duration) * 100}%` : "0%",
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={togglePlayPause}
              disabled={isLoading || error !== null}
              size="sm"
              variant="outline"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <Button
              onClick={rewind}
              disabled={isLoading || error !== null}
              size="sm"
              variant="outline"
              title="Rewind 5 seconds"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            {/* Volume Control */}
            <div className="ml-auto flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-slate-600" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="h-2 w-24 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
