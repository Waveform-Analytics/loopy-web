import { CGMReading } from '../types';

export interface PollingStrategy {
  nextInterval: number;
  mode: 'normal' | 'intensive';
  nextExpectedReading: Date | null;
  confidence: number; // 0-1, how confident we are in the prediction
}

/**
 * Analyzes CGM reading patterns to predict the next reading time
 * and determine optimal polling strategy
 */
export class SmartPollingAnalyzer {
  private static readonly DEFAULT_CGM_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static readonly INTENSIVE_POLLING_INTERVAL = 45 * 1000; // 45 seconds
  private static readonly NORMAL_POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static readonly INTENSIVE_WINDOW = 2 * 60 * 1000; // Start intensive polling 2 minutes before expected reading

  /**
   * Calculate the average interval between recent CGM readings
   */
  static calculateAverageInterval(readings: CGMReading[]): number {
    if (readings.length < 2) {
      return this.DEFAULT_CGM_INTERVAL;
    }

    // Sort readings by time (most recent first)
    const sortedReadings = [...readings].sort((a, b) => 
      new Date(b.dateString || b.datetime).getTime() - 
      new Date(a.dateString || a.datetime).getTime()
    );

    // Calculate intervals between last 5-10 readings for better accuracy
    const intervalsToCheck = Math.min(10, sortedReadings.length - 1);
    const intervals: number[] = [];

    for (let i = 0; i < intervalsToCheck; i++) {
      const current = new Date(sortedReadings[i].dateString || sortedReadings[i].datetime);
      const previous = new Date(sortedReadings[i + 1].dateString || sortedReadings[i + 1].datetime);
      const interval = current.getTime() - previous.getTime();
      
      // Only include reasonable intervals (3-8 minutes) to filter out anomalies
      if (interval >= 3 * 60 * 1000 && interval <= 8 * 60 * 1000) {
        intervals.push(interval);
      }
    }

    if (intervals.length === 0) {
      return this.DEFAULT_CGM_INTERVAL;
    }

    // Return median interval for better robustness against outliers
    intervals.sort((a, b) => a - b);
    const medianIndex = Math.floor(intervals.length / 2);
    return intervals.length % 2 === 0 
      ? (intervals[medianIndex - 1] + intervals[medianIndex]) / 2
      : intervals[medianIndex];
  }

  /**
   * Predict when the next CGM reading should arrive
   */
  static predictNextReading(readings: CGMReading[]): { time: Date | null; confidence: number } {
    if (readings.length === 0) {
      return { time: null, confidence: 0 };
    }

    // Get the most recent reading
    const sortedReadings = [...readings].sort((a, b) => 
      new Date(b.dateString || b.datetime).getTime() - 
      new Date(a.dateString || a.datetime).getTime()
    );

    const lastReading = sortedReadings[0];
    const lastReadingTime = new Date(lastReading.dateString || lastReading.datetime);
    
    // Calculate average interval
    const averageInterval = this.calculateAverageInterval(readings);
    
    // Predict next reading time
    const nextReadingTime = new Date(lastReadingTime.getTime() + averageInterval);
    
    // Calculate confidence based on consistency of recent intervals
    const confidence = this.calculateConfidence(readings);
    
    return { 
      time: nextReadingTime, 
      confidence 
    };
  }

  /**
   * Calculate confidence in our prediction based on interval consistency
   */
  private static calculateConfidence(readings: CGMReading[]): number {
    if (readings.length < 3) {
      return 0.5; // Low confidence with insufficient data
    }

    const intervals: number[] = [];
    const sortedReadings = [...readings].sort((a, b) => 
      new Date(b.dateString || b.datetime).getTime() - 
      new Date(a.dateString || a.datetime).getTime()
    );

    // Calculate last 5 intervals
    for (let i = 0; i < Math.min(5, sortedReadings.length - 1); i++) {
      const current = new Date(sortedReadings[i].dateString || sortedReadings[i].datetime);
      const previous = new Date(sortedReadings[i + 1].dateString || sortedReadings[i + 1].datetime);
      intervals.push(current.getTime() - previous.getTime());
    }

    if (intervals.length === 0) return 0.5;

    // Calculate coefficient of variation (lower = more consistent = higher confidence)
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / mean;

    // Convert to confidence (0-1), where lower variation = higher confidence
    return Math.max(0.2, Math.min(1, 1 - coefficientOfVariation));
  }

  /**
   * Determine the optimal polling strategy based on current time and predictions
   */
  static getPollingStrategy(readings: CGMReading[]): PollingStrategy {
    const prediction = this.predictNextReading(readings);
    const now = new Date();

    if (!prediction.time || prediction.confidence < 0.3) {
      // Low confidence or no prediction - use normal polling
      return {
        nextInterval: this.NORMAL_POLLING_INTERVAL,
        mode: 'normal',
        nextExpectedReading: prediction.time,
        confidence: prediction.confidence
      };
    }

    const timeUntilNextReading = prediction.time.getTime() - now.getTime();

    // If we're within the intensive window before expected reading
    if (timeUntilNextReading > 0 && timeUntilNextReading <= this.INTENSIVE_WINDOW) {
      return {
        nextInterval: this.INTENSIVE_POLLING_INTERVAL,
        mode: 'intensive',
        nextExpectedReading: prediction.time,
        confidence: prediction.confidence
      };
    }

    // If the expected reading is overdue, use intensive polling to catch it
    if (timeUntilNextReading < 0 && Math.abs(timeUntilNextReading) <= this.INTENSIVE_WINDOW) {
      return {
        nextInterval: this.INTENSIVE_POLLING_INTERVAL,
        mode: 'intensive',
        nextExpectedReading: prediction.time,
        confidence: prediction.confidence
      };
    }

    // Otherwise, use normal polling
    return {
      nextInterval: this.NORMAL_POLLING_INTERVAL,
      mode: 'normal',
      nextExpectedReading: prediction.time,
      confidence: prediction.confidence
    };
  }

  /**
   * Format time until next expected reading for display
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