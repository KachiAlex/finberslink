/**
 * Resume Completion Feature Logging and Monitoring
 * 
 * Structured logging for all resume operations
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  operation: string;
  message: string;
  userId?: string;
  resumeId?: string;
  duration?: number;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

class ResumeLogger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  /**
   * Log entry
   */
  private log(entry: LogEntry): void {
    const logMessage = JSON.stringify(entry);

    switch (entry.level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(logMessage);
        }
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
    }

    // TODO: Send to external logging service (e.g., Sentry, LogRocket, DataDog)
    // this.sendToExternalService(entry);
  }

  /**
   * Log PDF export operation
   */
  logPDFExport(
    resumeId: string,
    userId: string,
    template: string,
    duration: number,
    fileSize?: number,
    error?: Error
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: error ? LogLevel.ERROR : LogLevel.INFO,
      service: 'PDFGenerationService',
      operation: 'generatePDF',
      message: error ? `PDF export failed: ${error.message}` : 'PDF export successful',
      userId,
      resumeId,
      duration,
      metadata: { template, fileSize },
      error: error ? {
        code: 'PDF_EXPORT_ERROR',
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  /**
   * Log share link creation
   */
  logShareLinkCreation(
    resumeId: string,
    userId: string,
    recipientCount: number,
    duration: number,
    error?: Error
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: error ? LogLevel.ERROR : LogLevel.INFO,
      service: 'SharingService',
      operation: 'createShareLink',
      message: error ? `Share link creation failed: ${error.message}` : 'Share link created successfully',
      userId,
      resumeId,
      duration,
      metadata: { recipientCount },
      error: error ? {
        code: 'SHARE_LINK_ERROR',
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  /**
   * Log version creation
   */
  logVersionCreation(
    resumeId: string,
    userId: string,
    duration: number,
    error?: Error
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: error ? LogLevel.ERROR : LogLevel.INFO,
      service: 'VersioningService',
      operation: 'createVersion',
      message: error ? `Version creation failed: ${error.message}` : 'Version created successfully',
      userId,
      resumeId,
      duration,
      error: error ? {
        code: 'VERSION_ERROR',
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  /**
   * Log view recording
   */
  logViewRecording(
    resumeId: string,
    duration: number,
    error?: Error
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: error ? LogLevel.WARN : LogLevel.DEBUG,
      service: 'AnalyticsService',
      operation: 'recordView',
      message: error ? `View recording failed: ${error.message}` : 'View recorded',
      resumeId,
      duration,
      error: error ? {
        code: 'VIEW_RECORDING_ERROR',
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  /**
   * Log notification creation
   */
  logNotificationCreation(
    resumeId: string,
    userId: string,
    type: 'view' | 'download',
    duration: number,
    error?: Error
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: error ? LogLevel.WARN : LogLevel.DEBUG,
      service: 'NotificationService',
      operation: 'createNotification',
      message: error ? `Notification creation failed: ${error.message}` : 'Notification created',
      userId,
      resumeId,
      duration,
      metadata: { type },
      error: error ? {
        code: 'NOTIFICATION_ERROR',
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  /**
   * Log email sending
   */
  logEmailSending(
    recipient: string,
    type: 'share' | 'notification',
    duration: number,
    error?: Error
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: error ? LogLevel.ERROR : LogLevel.INFO,
      service: 'EmailService',
      operation: 'sendEmail',
      message: error ? `Email sending failed: ${error.message}` : 'Email sent successfully',
      duration,
      metadata: { recipient, type },
      error: error ? {
        code: 'EMAIL_ERROR',
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  /**
   * Log cleanup job
   */
  logCleanupJob(
    jobName: string,
    itemsProcessed: number,
    duration: number,
    error?: Error
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: error ? LogLevel.ERROR : LogLevel.INFO,
      service: 'CleanupService',
      operation: jobName,
      message: error ? `Cleanup job failed: ${error.message}` : 'Cleanup job completed',
      duration,
      metadata: { itemsProcessed },
      error: error ? {
        code: 'CLEANUP_ERROR',
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  /**
   * Log API request
   */
  logAPIRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string,
    error?: Error
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: statusCode >= 400 ? LogLevel.WARN : LogLevel.DEBUG,
      service: 'API',
      operation: `${method} ${path}`,
      message: `API request completed with status ${statusCode}`,
      userId,
      duration,
      metadata: { method, path, statusCode },
      error: error ? {
        code: 'API_ERROR',
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  /**
   * Log performance metric
   */
  logPerformanceMetric(
    operation: string,
    duration: number,
    threshold: number
  ): void {
    if (duration > threshold) {
      this.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.WARN,
        service: 'Performance',
        operation,
        message: `Operation exceeded performance threshold: ${duration}ms > ${threshold}ms`,
        duration,
        metadata: { threshold },
      });
    }
  }

  /**
   * Send to external logging service
   * TODO: Implement integration with Sentry, LogRocket, DataDog, etc.
   */
  private sendToExternalService(entry: LogEntry): void {
    // Example: Send to Sentry
    // if (entry.level === LogLevel.ERROR) {
    //   Sentry.captureException(new Error(entry.message), {
    //     tags: {
    //       service: entry.service,
    //       operation: entry.operation,
    //     },
    //     extra: entry.metadata,
    //   });
    // }
  }
}

export const resumeLogger = new ResumeLogger();

/**
 * Performance monitoring decorator
 */
export function monitorPerformance(
  operation: string,
  thresholdMs: number = 1000
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        resumeLogger.logPerformanceMetric(operation, duration, thresholdMs);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        resumeLogger.logPerformanceMetric(operation, duration, thresholdMs);
        throw error;
      }
    };

    return descriptor;
  };
}
