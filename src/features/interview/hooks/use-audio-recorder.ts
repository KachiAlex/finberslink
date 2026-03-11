"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface AudioRecorderState {
  isRecording: boolean;
  error: string | null;
  playbackUrl: string | null;
  dataUrl: string | null;
  blob: Blob | null;
  durationMs: number;
}

export function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    error: null,
    playbackUrl: null,
    dataUrl: null,
    blob: null,
    durationMs: 0,
  });

  const cleanupTimer = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const updateDuration = useCallback(() => {
    const start = startTimeRef.current;
    if (!start) return;
    rafRef.current = requestAnimationFrame(() => {
      const startTimestamp = startTimeRef.current ?? start;
      const duration = Date.now() - startTimestamp;
      setState((prev) => ({ ...prev, durationMs: duration }));
      updateDuration();
    });
  }, []);

  const reset = useCallback(() => {
    cleanupTimer();
    chunksRef.current = [];
    startTimeRef.current = null;
    setState({ isRecording: false, error: null, playbackUrl: null, dataUrl: null, blob: null, durationMs: 0 });
  }, [cleanupTimer]);

  const startRecording = useCallback(async () => {
    try {
      reset();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        cleanupTimer();
        startTimeRef.current = null;
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const playbackUrl = URL.createObjectURL(blob);
        const reader = new FileReader();
        reader.onloadend = () => {
          setState((prev) => ({
            ...prev,
            isRecording: false,
            playbackUrl,
            dataUrl: typeof reader.result === "string" ? reader.result : null,
            blob,
          }));
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      startTimeRef.current = Date.now();
      updateDuration();
      setState({ isRecording: true, error: null, playbackUrl: null, dataUrl: null, blob: null, durationMs: 0 });
    } catch (error) {
      console.error("Audio recorder start error", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unable to start recorder",
        isRecording: false,
      }));
    }
  }, [cleanupTimer, reset, updateDuration]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
    recorder.stream.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    return () => {
      cleanupTimer();
      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
      if (state.playbackUrl) {
        URL.revokeObjectURL(state.playbackUrl);
      }
    };
  }, [cleanupTimer, state.playbackUrl]);

  return {
    ...state,
    startRecording,
    stopRecording,
    reset,
  };
}
