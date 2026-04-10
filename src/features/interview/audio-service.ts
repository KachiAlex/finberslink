import { initializeApp, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import * as fs from "fs";
import * as path from "path";
import { prisma } from "@/lib/prisma";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const bucket = getStorage().bucket();

/**
 * Upload audio file to Firebase Storage
 * @param options - Upload options with buffer, filename, and responseId
 * @returns Object with storage URL, signed URL, and duration
 */
export async function uploadAudioFile(options: {
  buffer: Buffer;
  filename: string;
  responseId: string;
  duration: number;
}): Promise<{
  storageUrl: string;
  signedUrl: string;
  duration: number;
}> {
  try {
    // Validate file size (max 25MB for Whisper API)
    const maxSize = 25 * 1024 * 1024;
    if (options.buffer.length > maxSize) {
      throw new Error(`File size exceeds maximum of 25MB`);
    }

    // Create storage path
    const timestamp = Date.now();
    const storagePath = `interview-audio/${options.responseId}/${timestamp}-${options.filename}`;

    // Upload to Firebase Storage
    const file = bucket.file(storagePath);
    await file.save(options.buffer, {
      metadata: {
        contentType: "audio/webm",
        metadata: {
          responseId: options.responseId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Generate signed URL (24 hours expiration)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const [signedUrl] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: expiresAt,
    });

    // Get public URL
    const storageUrl = `gs://${bucket.name}/${storagePath}`;

    // Save audio file metadata to database
    await prisma.audioFile.create({
      data: {
        responseId: options.responseId,
        storageUrl,
        signedUrl,
        fileSize: options.buffer.length,
        duration: options.duration,
        uploadedAt: new Date(),
        expiresAt,
      },
    });

    return {
      storageUrl,
      signedUrl,
      duration: options.duration,
    };
  } catch (error) {
    console.error("Audio upload failed:", error);
    throw new Error(`Failed to upload audio: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate a fresh signed URL for audio access
 * @param storageUrl - The storage URL of the audio file
 * @returns Fresh signed URL with 24-hour expiration
 */
export async function generateSignedUrl(storageUrl: string): Promise<string> {
  try {
    // Extract path from storage URL (gs://bucket/path)
    const pathMatch = storageUrl.match(/gs:\/\/[^/]+\/(.+)/);
    if (!pathMatch) {
      throw new Error("Invalid storage URL format");
    }

    const filePath = pathMatch[1];
    const file = bucket.file(filePath);

    // Generate new signed URL (24 hours expiration)
    const [signedUrl] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return signedUrl;
  } catch (error) {
    console.error("Failed to generate signed URL:", error);
    throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Delete audio file from Firebase Storage
 * @param storageUrl - The storage URL of the audio file to delete
 */
export async function deleteAudioFile(storageUrl: string): Promise<void> {
  try {
    // Extract path from storage URL
    const pathMatch = storageUrl.match(/gs:\/\/[^/]+\/(.+)/);
    if (!pathMatch) {
      throw new Error("Invalid storage URL format");
    }

    const filePath = pathMatch[1];
    const file = bucket.file(filePath);

    // Delete file
    await file.delete();
  } catch (error) {
    console.error("Failed to delete audio file:", error);
    // Don't throw - log and continue
  }
}

/**
 * Get audio duration from buffer
 * For now, this is a placeholder that returns the duration passed in
 * In production, you'd use a library like ffprobe to extract actual duration
 * @param buffer - Audio buffer
 * @returns Duration in seconds
 */
export async function getAudioDuration(buffer: Buffer): Promise<number> {
  try {
    // Placeholder: In production, use ffprobe or similar
    // For now, estimate based on file size and bitrate
    // Typical WebM audio: ~128kbps = 16KB/s
    const estimatedDuration = Math.ceil(buffer.length / 16000);
    return Math.max(estimatedDuration, 1); // Minimum 1 second
  } catch (error) {
    console.error("Failed to get audio duration:", error);
    return 0;
  }
}

/**
 * Cleanup expired audio files
 * Deletes audio files with expired signed URLs from storage and database
 * @returns Number of files deleted
 */
export async function cleanupExpiredAudioFiles(): Promise<number> {
  try {
    const now = new Date();

    // Find expired audio files
    const expiredFiles = await prisma.audioFile.findMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
      select: {
        id: true,
        storageUrl: true,
      },
    });

    let deletedCount = 0;

    // Delete each file
    for (const file of expiredFiles) {
      try {
        // Delete from storage
        await deleteAudioFile(file.storageUrl);

        // Delete from database
        await prisma.audioFile.delete({
          where: { id: file.id },
        });

        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete audio file ${file.id}:`, error);
      }
    }

    return deletedCount;
  } catch (error) {
    console.error("Cleanup expired audio files failed:", error);
    return 0;
  }
}

/**
 * Get audio file metadata
 * @param responseId - The response ID
 * @returns Audio file metadata or null if not found
 */
export async function getAudioFileMetadata(responseId: string) {
  try {
    return await prisma.audioFile.findUnique({
      where: { responseId },
    });
  } catch (error) {
    console.error("Failed to get audio file metadata:", error);
    return null;
  }
}

/**
 * Update audio file signed URL if expired
 * @param responseId - The response ID
 * @returns Updated signed URL or null if file not found
 */
export async function refreshAudioSignedUrl(responseId: string): Promise<string | null> {
  try {
    const audioFile = await prisma.audioFile.findUnique({
      where: { responseId },
    });

    if (!audioFile) {
      return null;
    }

    // Check if signed URL is expired
    const now = new Date();
    if (audioFile.expiresAt > now) {
      // Still valid, return existing URL
      return audioFile.signedUrl;
    }

    // Generate new signed URL
    const newSignedUrl = await generateSignedUrl(audioFile.storageUrl);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update in database
    await prisma.audioFile.update({
      where: { responseId },
      data: {
        signedUrl: newSignedUrl,
        expiresAt,
      },
    });

    return newSignedUrl;
  } catch (error) {
    console.error("Failed to refresh audio signed URL:", error);
    return null;
  }
}
