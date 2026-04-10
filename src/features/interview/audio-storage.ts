import { initializeApp, getApps } from 'firebase/app';
import {
  getStorage,
  ref,
  uploadBytes,
  getBytes,
  deleteObject,
  getDownloadURL,
} from 'firebase/storage';

// Initialize Firebase (uses environment variables)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only once
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const storage = getStorage();

export interface AudioMetadata {
  audioUrl: string;
  duration: number;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  expiresAt: Date;
}

export interface AudioUploadOptions {
  userId: string;
  sessionId: string;
  questionId: string;
  audioBlob: Blob;
  duration: number;
  onProgress?: (progress: number) => void;
}

/**
 * Upload audio file to Firebase Storage
 */
export async function uploadAudio(options: AudioUploadOptions): Promise<AudioMetadata> {
  const { userId, sessionId, questionId, audioBlob, duration, onProgress } = options;

  try {
    // Create storage path: interviews/{userId}/{sessionId}/{questionId}/audio.webm
    const timestamp = Date.now();
    const storagePath = `interviews/${userId}/${sessionId}/${questionId}/${timestamp}.webm`;
    const storageRef = ref(storage, storagePath);

    // Upload with metadata
    const metadata = {
      contentType: audioBlob.type || 'audio/webm',
      customMetadata: {
        userId,
        sessionId,
        questionId,
        duration: duration.toString(),
        uploadedAt: new Date().toISOString(),
      },
    };

    // Upload file
    const snapshot = await uploadBytes(storageRef, audioBlob, metadata);

    // Get download URL
    const audioUrl = await getDownloadURL(snapshot.ref);

    // Calculate expiration (90 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    const audioMetadata: AudioMetadata = {
      audioUrl,
      duration,
      fileSize: audioBlob.size,
      mimeType: audioBlob.type || 'audio/webm',
      uploadedAt: new Date(),
      expiresAt,
    };

    onProgress?.(100);
    return audioMetadata;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Failed to upload audio');
    console.error('Audio upload error:', err);
    throw err;
  }
}

/**
 * Get audio file from Firebase Storage
 */
export async function getAudioFile(storagePath: string): Promise<Blob> {
  try {
    const storageRef = ref(storage, storagePath);
    const bytes = await getBytes(storageRef);
    return new Blob([bytes], { type: 'audio/webm' });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Failed to get audio file');
    console.error('Get audio error:', err);
    throw err;
  }
}

/**
 * Delete audio file from Firebase Storage
 */
export async function deleteAudio(storagePath: string): Promise<void> {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Failed to delete audio');
    console.error('Delete audio error:', err);
    throw err;
  }
}

/**
 * Generate signed URL for audio file (for secure access)
 * Note: Firebase Storage URLs are already signed by default
 */
export async function getSignedAudioUrl(storagePath: string): Promise<string> {
  try {
    const storageRef = ref(storage, storagePath);
    return await getDownloadURL(storageRef);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Failed to get signed URL');
    console.error('Get signed URL error:', err);
    throw err;
  }
}

/**
 * Validate audio blob before upload
 */
export function validateAudioBlob(blob: Blob, maxSizeMB: number = 50): { valid: boolean; error?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (blob.size === 0) {
    return { valid: false, error: 'Audio file is empty' };
  }

  if (blob.size > maxSizeBytes) {
    return { valid: false, error: `Audio file exceeds ${maxSizeMB}MB limit` };
  }

  const validMimeTypes = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
  if (!validMimeTypes.includes(blob.type)) {
    return { valid: false, error: `Invalid audio format: ${blob.type}` };
  }

  return { valid: true };
}

/**
 * Convert audio blob to different format (if needed)
 * This is a placeholder for future enhancement
 */
export async function convertAudioFormat(
  blob: Blob,
  targetFormat: 'webm' | 'mp3' | 'wav'
): Promise<Blob> {
  // For now, just return the original blob
  // In production, you might use ffmpeg.js or a backend service
  console.warn(`Audio format conversion to ${targetFormat} not yet implemented`);
  return blob;
}
