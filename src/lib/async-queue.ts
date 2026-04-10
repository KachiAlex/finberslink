/**
 * Async Processing Queue for Resume Completion Feature
 * Task 64: Implement async processing for background tasks
 */

export type QueueTask = {
  id: string;
  type: string;
  data: any;
  createdAt: Date;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  retries: number;
  maxRetries: number;
};

export type TaskHandler = (task: QueueTask) => Promise<void>;

class AsyncQueue {
  private queue: QueueTask[] = [];
  private handlers: Map<string, TaskHandler> = new Map();
  private processing = false;
  private maxConcurrent = 5;
  private activeCount = 0;

  /**
   * Register a task handler
   */
  registerHandler(taskType: string, handler: TaskHandler): void {
    this.handlers.set(taskType, handler);
  }

  /**
   * Add task to queue
   */
  async enqueue(
    type: string,
    data: any,
    maxRetries: number = 3
  ): Promise<string> {
    const taskId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const task: QueueTask = {
      id: taskId,
      type,
      data,
      createdAt: new Date(),
      status: "pending",
      retries: 0,
      maxRetries,
    };

    this.queue.push(task);
    this.process();

    return taskId;
  }

  /**
   * Process queue
   */
  private async process(): Promise<void> {
    if (this.processing || this.activeCount >= this.maxConcurrent) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.activeCount < this.maxConcurrent) {
      const task = this.queue.shift();

      if (!task) {
        break;
      }

      this.activeCount++;

      this.executeTask(task)
        .then(() => {
          this.activeCount--;
          this.process();
        })
        .catch(() => {
          this.activeCount--;
          this.process();
        });
    }

    this.processing = false;
  }

  /**
   * Execute a task
   */
  private async executeTask(task: QueueTask): Promise<void> {
    try {
      task.status = "processing";

      const handler = this.handlers.get(task.type);

      if (!handler) {
        throw new Error(`No handler registered for task type: ${task.type}`);
      }

      await handler(task);

      task.status = "completed";
    } catch (error) {
      task.retries++;

      if (task.retries < task.maxRetries) {
        task.status = "pending";
        this.queue.push(task); // Re-queue for retry
      } else {
        task.status = "failed";
        task.error = (error as Error).message;
        console.error(
          `[AsyncQueue] Task ${task.id} failed after ${task.maxRetries} retries:`,
          error
        );
      }
    }
  }

  /**
   * Get queue status
   */
  getStatus(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    queueLength: number;
    activeCount: number;
  } {
    return {
      pending: this.queue.filter((t) => t.status === "pending").length,
      processing: this.queue.filter((t) => t.status === "processing").length,
      completed: this.queue.filter((t) => t.status === "completed").length,
      failed: this.queue.filter((t) => t.status === "failed").length,
      queueLength: this.queue.length,
      activeCount: this.activeCount,
    };
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): QueueTask | undefined {
    return this.queue.find((t) => t.id === taskId);
  }

  /**
   * Clear completed tasks
   */
  clearCompleted(): number {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter((t) => t.status !== "completed");
    return initialLength - this.queue.length;
  }

  /**
   * Clear failed tasks
   */
  clearFailed(): number {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter((t) => t.status !== "failed");
    return initialLength - this.queue.length;
  }

  /**
   * Clear all tasks
   */
  clear(): void {
    this.queue = [];
  }
}

export const asyncQueue = new AsyncQueue();

/**
 * Task handlers for Resume Completion Feature
 */

// Export recording task
asyncQueue.registerHandler("export-recording", async (task) => {
  const { resumeId, template, fileSize, userAgent, ipAddress } = task.data;
  // Implementation would call pdfGenerationService.recordExport
  console.log(
    `[AsyncQueue] Recording export for resume ${resumeId} with template ${template}`
  );
});

// Analytics aggregation task
asyncQueue.registerHandler("analytics-aggregation", async (task) => {
  const { resumeId } = task.data;
  // Implementation would call analyticsService.aggregateData
  console.log(`[AsyncQueue] Aggregating analytics for resume ${resumeId}`);
});

// Notification email task
asyncQueue.registerHandler("notification-email", async (task) => {
  const { userId, notificationId } = task.data;
  // Implementation would call notificationService.sendNotificationEmail
  console.log(
    `[AsyncQueue] Sending notification email for notification ${notificationId}`
  );
});

// Version archival task
asyncQueue.registerHandler("version-archival", async (task) => {
  const { resumeId } = task.data;
  // Implementation would call versioningService.archiveOldVersions
  console.log(`[AsyncQueue] Archiving old versions for resume ${resumeId}`);
});

// Share link cleanup task
asyncQueue.registerHandler("share-link-cleanup", async (task) => {
  const { resumeId } = task.data;
  // Implementation would call sharingService.deleteExpiredShareLinks
  console.log(`[AsyncQueue] Cleaning up expired share links for resume ${resumeId}`);
});
