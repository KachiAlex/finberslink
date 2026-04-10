'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Pause, Play } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => Promise<void>;
  onError: (error: Error) => void;
  maxDuration?: number; // seconds
  disabled?: boolean;
}

interface RecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
}

export function AudioRecorder({
  onRecordingComplete,
  onError,
  maxDuration = 300, // 5 minutes default
  disabled = false,
}: AudioRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    isUploading: false,
    uploadProgress: 0,
    error: null,
  });

  // Request microphone permission and start recording
  const startRecording = async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        const error = new Error(`Recording error: ${event.error}`);
        onError(error);
        setState((prev) => ({ ...prev, error: error.message }));
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      setState((prev) => ({ ...prev, isRecording: true, isPaused: false, duration: 0 }));

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setState((prev) => {
          const newDuration = prev.duration + 1;

          // Stop if max duration reached
          if (newDuration >= maxDuration) {
            stopRecording();
            return prev;
          }

          return { ...prev, duration: newDuration };
        });
      }, 1000);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start recording');
      onError(err);
      setState((prev) => ({ ...prev, error: err.message }));
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.pause();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setState((prev) => ({ ...prev, isPaused: true }));
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && state.isPaused) {
      mediaRecorderRef.current.resume();
      setState((prev) => ({ ...prev, isPaused: false }));

      // Restart timer
      timerIntervalRef.current = setInterval(() => {
        setState((prev) => {
          const newDuration = prev.duration + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            return prev;
          }
          return { ...prev, duration: newDuration };
        });
      }, 1000);
    }
  };

  // Stop recording and prepare for upload
  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    return new Promise<void>((resolve) => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = async () => {
          // Clear timer
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }

          // Stop all tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
          }

          // Create blob from chunks
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

          setState((prev) => ({ ...prev, isRecording: false, isPaused: false, isUploading: true }));

          try {
            await onRecordingComplete(audioBlob, state.duration);
            setState((prev) => ({ ...prev, isUploading: false, duration: 0 }));
          } catch (error) {
            const err = error instanceof Error ? error : new Error('Upload failed');
            onError(err);
            setState((prev) => ({ ...prev, error: err.message, isUploading: false }));
          }

          resolve();
        };

        mediaRecorderRef.current.stop();
      }
    });
  };

  // Cancel recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    audioChunksRef.current = [];
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      isUploading: false,
      uploadProgress: 0,
      error: null,
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timeRemaining = maxDuration - state.duration;
  const isNearLimit = timeRemaining < 30;

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {state.error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Recording Error</p>
          <p>{state.error}</p>
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-6">
        {/* Timer Display */}
        <div className="flex-1">
          <div className="text-center">
            <div className={`text-4xl font-mono font-bold ${isNearLimit ? 'text-red-600' : 'text-slate-900'}`}>
              {formatTime(state.duration)}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {state.isRecording ? (
                <>
                  {isNearLimit ? (
                    <span className="text-red-600 font-medium">
                      {formatTime(timeRemaining)} remaining
                    </span>
                  ) : (
                    <span>{formatTime(timeRemaining)} remaining</span>
                  )}
                </>
              ) : (
                <span>Ready to record</span>
              )}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!state.isRecording ? (
            <button
              onClick={startRecording}
              disabled={disabled || state.isUploading}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Start recording"
            >
              <Mic className="h-5 w-5" />
              <span>Record</span>
            </button>
          ) : (
            <>
              {!state.isPaused ? (
                <button
                  onClick={pauseRecording}
                  className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-6 py-3 text-white hover:bg-yellow-700 transition-colors"
                  aria-label="Pause recording"
                >
                  <Pause className="h-5 w-5" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={resumeRecording}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors"
                  aria-label="Resume recording"
                >
                  <Play className="h-5 w-5" />
                  <span>Resume</span>
                </button>
              )}

              <button
                onClick={() => stopRecording()}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700 transition-colors"
                aria-label="Stop recording"
              >
                <Square className="h-5 w-5" />
                <span>Done</span>
              </button>

              <button
                onClick={cancelRecording}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-600 px-6 py-3 text-white hover:bg-slate-700 transition-colors"
                aria-label="Cancel recording"
              >
                <span>Cancel</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {state.isUploading && (
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-blue-200 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${state.uploadProgress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-blue-700">{state.uploadProgress}%</span>
          </div>
          <p className="mt-2 text-sm text-blue-700">Uploading audio...</p>
        </div>
      )}

      {/* Info Text */}
      <p className="text-sm text-slate-600">
        Maximum recording time: {formatTime(maxDuration)}. Your response will be transcribed and analyzed by AI.
      </p>
    </div>
  );
}
