"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Upload, AlertCircle, CheckCircle } from "lucide-react";

interface AudioRecorderProps {
  onUploadComplete?: (data: {
    storageUrl: string;
    signedUrl: string;
    duration: number;
    transcript: string;
  }) => void;
  onError?: (error: string) => void;
  responseId: string;
  sessionId: string;
}

export function AudioRecorder({
  onUploadComplete,
  onError,
  responseId,
  sessionId,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Request microphone permission and start recording
  const startRecording = async () => {
    try {
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          // Auto-stop after 10 minutes
          if (newTime >= 600) {
            stopRecording();
            return prev;
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to access microphone";
      setError(message);
      onError?.(message);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Upload audio
  const uploadAudio = async () => {
    if (!audioBlob) {
      setError("No audio recorded");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("audio", audioBlob, "interview-response.webm");
      formData.append("responseId", responseId);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Handle completion
      xhr.addEventListener("load", () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          onUploadComplete?.(response.audio);
          setAudioBlob(null);
          setRecordingTime(0);
        } else {
          const error = JSON.parse(xhr.responseText);
          throw new Error(error.error || "Upload failed");
        }
      });

      // Handle error
      xhr.addEventListener("error", () => {
        throw new Error("Upload failed");
      });

      xhr.open(
        "POST",
        `/api/interview-sessions/${sessionId}/responses/upload`,
      );
      xhr.send(formData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      onError?.(message);
      setIsUploading(false);
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="font-semibold text-slate-900">Record Your Response</h3>
        <p className="text-sm text-slate-600">
          Click the microphone button to start recording. You have up to 10 minutes.
        </p>
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="text-sm font-medium text-red-700">
            Recording: {formatTime(recordingTime)}
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Uploading...
            </span>
            <span className="text-sm text-slate-600">{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success Message */}
      {audioBlob && !isUploading && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700">
            Audio recorded ({(audioBlob.size / 1024 / 1024).toFixed(2)} MB)
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {!isRecording && !audioBlob && (
          <Button
            onClick={startRecording}
            disabled={isUploading}
            className="gap-2"
            size="lg"
          >
            <Mic className="h-4 w-4" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <Button
            onClick={stopRecording}
            variant="destructive"
            className="gap-2"
            size="lg"
          >
            <Square className="h-4 w-4" />
            Stop Recording
          </Button>
        )}

        {audioBlob && !isRecording && (
          <>
            <Button
              onClick={() => {
                setAudioBlob(null);
                setRecordingTime(0);
              }}
              variant="outline"
              disabled={isUploading}
              size="lg"
            >
              Re-record
            </Button>
            <Button
              onClick={uploadAudio}
              disabled={isUploading}
              className="gap-2"
              size="lg"
            >
              <Upload className="h-4 w-4" />
              Upload & Transcribe
            </Button>
          </>
        )}
      </div>

      {/* Recording Time Warning */}
      {isRecording && recordingTime > 480 && (
        <p className="text-sm text-amber-600">
          ⚠️ Recording will auto-stop in {formatTime(600 - recordingTime)}
        </p>
      )}
    </div>
  );
}
