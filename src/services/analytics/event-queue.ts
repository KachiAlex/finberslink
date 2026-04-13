/**
 * Analytics Event Queue
 * 
 * Manages async processing of analytics events using Bull queue.
 * Batches events and processes them every 5 seconds for efficient aggregation.
 */

import Queue from 'bull';
import { Logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

const logger = new Logger('EventQueue');

// Queue configuration
const QUEUE_NAME = 'analytics-events';
const PROCESS_INTERVAL = 5000; // 5 seconds
const BATCH_SIZE = 100;

interface QueuedEvent {
  resumeId: string;
  eventType: 'view' | 'download' | 'share' | 'export';
  metadata?: Record<string, any>;
  timestamp: Date;
}

let eventQueue: Queue.Queue<QueuedEvent> | null = null;

/**
 * Initialize the event queue
 */
export async function initializeEventQueue(): Promise<Queue.Queue<QueuedEvent>> {
  if (eventQueue) {
    return eventQueue;
  }

  try {
    // Create queue with Redis connection
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    eventQueue = new Queue(QUEUE_NAME, redisUrl, {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
      },
    });

    // Set up event handlers
    eventQueue.on('error', (error) => {
      logger.error('Queue error', error);
    });

    eventQueue.on('failed', (job, error) => {
      logger.error(`Job ${job.id} failed`, error);
    });

    eventQueue.on('completed', (job) => {
      logger.info(`Job ${job.id} completed`);
    });

    // Process events in batches
    await eventQueue.process(BATCH_SIZE, async (job) => {
      return processEventBatch(job.data);
    });

    logger.info('Event queue initialized');
    return eventQueue;
  } catch (error) {
    logger.error('Error initializing event queue', error);
    throw error;
  }
}

/**
 * Add event to queue
 */
export async function queueAnalyticsEvent(event: QueuedEvent): Promise<void> {
  try {
    const queue = await initializeEventQueue();

    await queue.add(event, {
      delay: 0,
      priority: 10,
    });

    logger.debug(`Event queued: ${event.eventType} for resume ${event.resumeId}`);
  } catch (error) {
    logger.error('Error queuing analytics event', error);
    throw error;
  }
}

/**
 * Process a batch of events
 */
async function processEventBatch(event: QueuedEvent): Promise<void> {
  try {
    // Aggregate metrics for this event
    await aggregateMetrics(event.resumeId, event.eventType);

    logger.debug(`Processed event: ${event.eventType} for resume ${event.resumeId}`);
  } catch (error) {
    logger.error('Error processing event batch', error);
    throw error;
  }
}

/**
 * Aggregate metrics for a resume
 */
async function aggregateMetrics(resumeId: string, eventType: string): Promise<void> {
  try {
    // Get all events for this resume
    const events = await prisma.resumeAnalytics.findMany({
      where: { resumeId },
      orderBy: { createdAt: 'asc' },
    });

    if (events.length === 0) {
      return;
    }

    // Calculate aggregated metrics
    const viewCount = events.filter(e => e.eventType === 'view').length;
    const downloadCount = events.filter(e => e.eventType === 'download').length;
    const shareCount = events.filter(e => e.eventType === 'share').length;

    // Update resume with aggregated view count
    await prisma.resume.update({
      where: { id: resumeId },
      data: {
        viewCount,
      },
    });

    // Aggregate section engagement
    const sectionEvents = events.filter(e => e.sectionName);
    const sectionMap = new Map<string, { views: number; timeSpent: number; scrollDepth: number[] }>();

    sectionEvents.forEach(event => {
      if (!event.sectionName) return;

      const existing = sectionMap.get(event.sectionName) || {
        views: 0,
        timeSpent: 0,
        scrollDepth: [],
      };

      existing.views += 1;
      existing.timeSpent += event.timeSpentSeconds || 0;
      if (event.scrollDepth) {
        existing.scrollDepth.push(event.scrollDepth);
      }

      sectionMap.set(event.sectionName, existing);
    });

    // Update section engagement records
    for (const [sectionName, data] of sectionMap.entries()) {
      const avgScrollDepth = data.scrollDepth.length > 0
        ? Math.round(data.scrollDepth.reduce((a, b) => a + b, 0) / data.scrollDepth.length)
        : 0;

      await prisma.resumeSectionEngagement.upsert({
        where: {
          resumeId_sectionName: {
            resumeId,
            sectionName,
          },
        },
        update: {
          viewCount: data.views,
          totalTimeSpentSeconds: data.timeSpent,
          averageScrollDepth: avgScrollDepth,
          lastUpdatedAt: new Date(),
        },
        create: {
          resumeId,
          sectionName,
          viewCount: data.views,
          totalTimeSpentSeconds: data.timeSpent,
          averageScrollDepth: avgScrollDepth,
        },
      });
    }

    logger.debug(`Metrics aggregated for resume ${resumeId}`);
  } catch (error) {
    logger.error('Error aggregating metrics', error);
    throw error;
  }
}

/**
 * Get queue health status
 */
export async function getQueueHealth(): Promise<{
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  try {
    const queue = await initializeEventQueue();

    const [active, waiting, completed, failed, delayed] = await Promise.all([
      queue.getActiveCount(),
      queue.getWaitingCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      active,
      waiting,
      completed,
      failed,
      delayed,
    };
  } catch (error) {
    logger.error('Error getting queue health', error);
    throw error;
  }
}

/**
 * Clear the queue
 */
export async function clearQueue(): Promise<void> {
  try {
    const queue = await initializeEventQueue();
    await queue.clean(0, 'completed');
    await queue.clean(0, 'failed');
    logger.info('Queue cleared');
  } catch (error) {
    logger.error('Error clearing queue', error);
    throw error;
  }
}

/**
 * Close the queue
 */
export async function closeQueue(): Promise<void> {
  try {
    if (eventQueue) {
      await eventQueue.close();
      eventQueue = null;
      logger.info('Event queue closed');
    }
  } catch (error) {
    logger.error('Error closing queue', error);
    throw error;
  }
}
