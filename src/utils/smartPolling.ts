import { CGMReading } from '../types';

export interface PollingStrategy {
  nextInterval: number;
  mode: 'normal' | 'intensive';
  nextExpectedReading: Date | null;
  confidence: number;
}

/**
 * Smart polling analyzer for CGM readings
 * Predicts when next reading should arrive and adjusts polling frequency
 */
export class SmartPollingAnalyzer {
  private static readonly DEFAULT_CGM_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static readonly INTENSIVE_POLLING = 45 * 1000; // 45 seconds when expecting reading
  private static readonly NORMAL_POLLING = 5 * 60 * 1000; // 5 minutes normal
  private static readonly INTENSIVE_WINDOW = 2 * 60 * 1000; // Start intensive 2min before expected

  /**
   * Calculate average interval between recent readings
   */
  static getAverageInterval(readings: CGMReading[]): number {
    if (readings.length < 2) {
      return this.DEFAULT_CGM_INTERVAL;
    }

    // Sort by time (most recent first)
    const sorted = [...readings].sort((a, b) => 
      new Date(b.timestamp).getTime() - 
      new Date(a.timestamp).getTime()
    );

    // Calculate intervals between last 5 readings for accuracy
    const intervals: number[] = [];
    for (let i = 0; i < Math.min(5, sorted.length - 1); i++) {
      const current = new Date(sorted[i].timestamp);
      const previous = new Date(sorted[i + 1].timestamp);
      const interval = current.getTime() - previous.getTime();
      
      // Only include reasonable intervals (3-8 minutes)
      if (interval >= 3 * 60 * 1000 && interval <= 8 * 60 * 1000) {
        intervals.push(interval);
      }
    }

    if (intervals.length === 0) {
      return this.DEFAULT_CGM_INTERVAL;
    }

    // Return median for robustness
    intervals.sort((a, b) => a - b);
    const mid = Math.floor(intervals.length / 2);
    return intervals.length % 2 === 0 
      ? (intervals[mid - 1] + intervals[mid]) / 2
      : intervals[mid];
  }

  /**
   * Predict when the next reading should arrive
   */
  static predictNextReading(readings: CGMReading[]): { time: Date | null; confidence: number } {
    if (readings.length === 0) {
      return { time: null, confidence: 0 };
    }

    const sorted = [...readings].sort((a, b) => 
      new Date(b.timestamp).getTime() - 
      new Date(a.timestamp).getTime()
    );

    const lastReading = sorted[0];
    const lastTime = new Date(lastReading.timestamp);
    const avgInterval = this.getAverageInterval(readings);
    
    const nextTime = new Date(lastTime.getTime() + avgInterval);
    const confidence = this.calculateConfidence(readings);
    
    return { time: nextTime, confidence };
  }

  /**
   * Calculate confidence based on reading consistency
   */
  private static calculateConfidence(readings: CGMReading[]): number {
    if (readings.length < 3) return 0.5;

    const sorted = [...readings].sort((a, b) => 
      new Date(b.timestamp).getTime() - 
      new Date(a.timestamp).getTime()
    );

    const intervals: number[] = [];
    for (let i = 0; i < Math.min(5, sorted.length - 1); i++) {
      const current = new Date(sorted[i].timestamp);
      const previous = new Date(sorted[i + 1].timestamp);
      intervals.push(current.getTime() - previous.getTime());
    }

    if (intervals.length === 0) return 0.5;

    // Calculate coefficient of variation (lower = more consistent = higher confidence)
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;

    // Convert to confidence (0-1)
    return Math.max(0.2, Math.min(1, 1 - coefficientOfVariation));
  }

  /**
   * Get optimal polling strategy based on predictions
   */
  static getPollingStrategy(readings: CGMReading[]): PollingStrategy {
    const prediction = this.predictNextReading(readings);
    const now = new Date();

    if (!prediction.time || prediction.confidence < 0.3) {
      // Low confidence - use normal polling
      return {
        nextInterval: this.NORMAL_POLLING,
        mode: 'normal',
        nextExpectedReading: prediction.time,
        confidence: prediction.confidence
      };
    }

    const timeUntilNext = prediction.time.getTime() - now.getTime();

    // Use intensive polling if we're within 2 minutes of expected reading
    // or if the reading is overdue by up to 2 minutes
    if (Math.abs(timeUntilNext) <= this.INTENSIVE_WINDOW) {
      return {
        nextInterval: this.INTENSIVE_POLLING,
        mode: 'intensive',
        nextExpectedReading: prediction.time,
        confidence: prediction.confidence
      };
    }

    // Otherwise use normal polling
    return {
      nextInterval: this.NORMAL_POLLING,
      mode: 'normal',
      nextExpectedReading: prediction.time,
      confidence: prediction.confidence
    };
  }

  /**
   * Format time until next reading for display
   */
  static formatTimeUntilNext(nextExpectedReading: Date | null): string {
    if (!nextExpectedReading) return 'Unknown';
    
    const now = new Date();
    const diff = nextExpectedReading.getTime() - now.getTime();
    
    if (diff < 0) {
      const overdue = Math.abs(diff);
      const minutes = Math.floor(overdue / (60 * 1000));
      return `${minutes}m overdue`;
    }
    
    const minutes = Math.floor(diff / (60 * 1000));
    const seconds = Math.floor((diff % (60 * 1000)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }
}