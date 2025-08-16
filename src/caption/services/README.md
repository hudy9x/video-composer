# Services Layer

## Purpose

The `services/` folder contains business logic services that handle specific concerns like validation, display formatting, and external dependency management. Each service follows the Single Responsibility Principle and provides a clean API for the core application.

## Design Pattern: Service Layer Pattern

The Service Layer pattern is used to:

- **Encapsulate Business Logic**: Each service handles a specific domain concern
- **Provide Reusable Components**: Services can be used across different parts of the application
- **Separate Concerns**: Validation, display, and external dependencies are isolated
- **Enable Testing**: Each service can be unit tested independently

## Current Implementation

### ValidationService
```typescript
export class ValidationService {
  static validateConfiguration(config: Config): void {
    // Validates fonts directory, overlay settings, timing, etc.
    BaseFont.validateFontsDirectory();
    config.textOverlays.forEach((overlay, index) => {
      this.validateOverlay(overlay, index);
    });
  }

  private static validateOverlay(overlay: TextOverlay, index: number): void {
    // Font validation, timing validation, font size validation
  }
}
```

### DisplayService
```typescript
export class DisplayService {
  static displayConfiguration(
    inputFile: string,
    outputFile: string,
    validatedOverlays: TextOverlay[],
    videoDimensions: VideoDimensions,
    config: Config
  ): void {
    // Formats and displays configuration information
  }
}
```

### FFmpegService
```typescript
export class FFmpegService {
  static async checkAvailability(): Promise<boolean> {
    // Checks if FFmpeg is available in system PATH
  }

  static handleFFmpegNotFound(): void {
    // Displays error message and exits
  }
}
```

## Adding a New Service Class

To add a new service (e.g., for logging or analytics), follow this pattern:

```typescript
// LoggingService.ts
export interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

export interface LogEntry {
  timestamp: Date;
  level: keyof LogLevel;
  message: string;
  metadata?: Record<string, any>;
}

export class LoggingService {
  private static logs: LogEntry[] = [];
  private static logLevel: keyof LogLevel = 'INFO';
  private static logFile?: string;

  static setLogLevel(level: keyof LogLevel): void {
    this.logLevel = level;
  }

  static setLogFile(filePath: string): void {
    this.logFile = filePath;
  }

  static debug(message: string, metadata?: Record<string, any>): void {
    this.log('DEBUG', message, metadata);
  }

  static info(message: string, metadata?: Record<string, any>): void {
    this.log('INFO', message, metadata);
  }

  static warn(message: string, metadata?: Record<string, any>): void {
    this.log('WARN', message, metadata);
  }

  static error(message: string, metadata?: Record<string, any>): void {
    this.log('ERROR', message, metadata);
  }

  private static log(level: keyof LogLevel, message: string, metadata?: Record<string, any>): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      metadata
    };

    // Store log entry
    this.logs.push(logEntry);

    // Check if we should output this log level
    if (!this.shouldLog(level)) return;

    // Format and output log
    const formattedMessage = this.formatLogEntry(logEntry);
    
    if (level === 'ERROR') {
      console.error(formattedMessage);
    } else if (level === 'WARN') {
      console.warn(formattedMessage);
    } else {
      console.log(formattedMessage);
    }

    // Write to file if configured
    if (this.logFile) {
      this.writeToFile(formattedMessage);
    }
  }

  private static shouldLog(level: keyof LogLevel): boolean {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  private static formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const metadataStr = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : '';
    
    return `[${timestamp}] ${entry.level}: ${entry.message}${metadataStr}`;
  }

  private static writeToFile(message: string): void {
    const fs = require('fs');
    
    try {
      fs.appendFileSync(this.logFile!, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // Utility methods
  static getLogs(level?: keyof LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  static clearLogs(): void {
    this.logs = [];
  }

  static exportLogs(filePath: string): void {
    const fs = require('fs');
    const logsJson = JSON.stringify(this.logs, null, 2);
    
    try {
      fs.writeFileSync(filePath, logsJson);
      this.info(`Logs exported to ${filePath}`);
    } catch (error) {
      this.error(`Failed to export logs: ${error}`);
    }
  }

  // Performance tracking
  static startTimer(label: string): void {
    this.debug(`Timer started: ${label}`, { action: 'timer_start', label });
  }

  static endTimer(label: string): void {
    this.debug(`Timer ended: ${label}`, { action: 'timer_end', label });
  }

  // Video processing specific logging
  static logVideoProcessingStart(inputFile: string, outputFile: string): void {
    this.info('Video processing started', {
      inputFile,
      outputFile,
      action: 'video_processing_start'
    });
  }

  static logVideoProcessingComplete(
    inputFile: string, 
    outputFile: string, 
    duration: number
  ): void {
    this.info('Video processing completed', {
      inputFile,
      outputFile,
      duration,
      action: 'video_processing_complete'
    });
  }

  static logFFmpegCommand(command: string[]): void {
    this.debug('FFmpeg command executed', {
      command: command.join(' '),
      action: 'ffmpeg_command'
    });
  }
}
```

## Another Service Example: MetricsService

```typescript
// MetricsService.ts
export interface ProcessingMetrics {
  totalVideosProcessed: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
  successfulProcesses: number;
  failedProcesses: number;
  startTime: Date;
  endTime?: Date;
}

export class MetricsService {
  private static metrics: ProcessingMetrics = {
    totalVideosProcessed: 0,
    totalProcessingTime: 0,
    averageProcessingTime: 0,
    successfulProcesses: 0,
    failedProcesses: 0,
    startTime: new Date()
  };

  private static processingTimers: Map<string, Date> = new Map();

  static startProcessing(videoId: string): void {
    this.processingTimers.set(videoId, new Date());
  }

  static endProcessing(videoId: string, success: boolean): void {
    const startTime = this.processingTimers.get(videoId);
    if (!startTime) return;

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    this.metrics.totalVideosProcessed++;
    this.metrics.totalProcessingTime += duration;
    
    if (success) {
      this.metrics.successfulProcesses++;
    } else {
      this.metrics.failedProcesses++;
    }

    this.metrics.averageProcessingTime = 
      this.metrics.totalProcessingTime / this.metrics.totalVideosProcessed;

    this.processingTimers.delete(videoId);
  }

  static getMetrics(): ProcessingMetrics {
    return { ...this.metrics };
  }

  static resetMetrics(): void {
    this.metrics = {
      totalVideosProcessed: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      successfulProcesses: 0,
      failedProcesses: 0,
      startTime: new Date()
    };
    this.processingTimers.clear();
  }

  static generateReport(): string {
    const metrics = this.getMetrics();
    const successRate = metrics.totalVideosProcessed > 0 
      ? (metrics.successfulProcesses / metrics.totalVideosProcessed * 100).toFixed(2)
      : '0.00';

    return `
Video Processing Metrics Report
===============================
Total Videos Processed: ${metrics.totalVideosProcessed}
Successful Processes: ${metrics.successfulProcesses}
Failed Processes: ${metrics.failedProcesses}
Success Rate: ${successRate}%
Total Processing Time: ${(metrics.totalProcessingTime / 1000).toFixed(2)}s
Average Processing Time: ${(metrics.averageProcessingTime / 1000).toFixed(2)}s
Session Started: ${metrics.startTime.toISOString()}
    `.trim();
  }
}
```

## Update the services index.ts

```typescript
// services/index.ts
export * from './ValidationService';
export * from './DisplayService';
export * from './FFmpegService';
export * from './LoggingService';
export * from './MetricsService';
```

## Usage in Core Application

```typescript
// In VideoTextApplication.ts
import { LoggingService, MetricsService } from '../services';

export class VideoTextApplication {
  async processVideo(inputFile: string, outputFile: string): Promise<void> {
    const videoId = `${inputFile}_${Date.now()}`;
    
    try {
      // Start logging and metrics
      LoggingService.logVideoProcessingStart(inputFile, outputFile);
      MetricsService.startProcessing(videoId);

      // ... existing processing logic ...

      // End metrics tracking
      MetricsService.endProcessing(videoId, true);
      LoggingService.logVideoProcessingComplete(inputFile, outputFile, 0);
      
    } catch (error) {
      MetricsService.endProcessing(videoId, false);
      LoggingService.error(`Video processing failed: ${error.message}`, {
        inputFile,
        outputFile,
        error: error.stack
      });
      throw error;
    }
  }
}
```
