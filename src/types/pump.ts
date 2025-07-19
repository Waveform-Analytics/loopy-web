/**
 * Pump data types for future insulin delivery integration
 * 
 * These types define the structure for insulin pump data that can be overlayed
 * on CGM charts for correlation analysis and comprehensive diabetes management
 */

/**
 * Bolus (meal-time insulin) delivery record
 */
export interface BolusDelivery {
  /** Timestamp when bolus was delivered */
  datetime: string;
  /** Amount of insulin delivered in units */
  amount: number;
  /** Type of bolus delivery */
  type: 'normal' | 'square' | 'dual' | 'extended';
  /** Duration for extended/square boluses in minutes */
  duration?: number;
  /** Associated carbohydrate count in grams */
  carbs?: number;
  /** Blood glucose input used for calculation */
  bg_input?: number;
  /** Who/what programmed this bolus */
  programmed_by: 'user' | 'loop' | 'automated';
  /** Optional reason/notes */
  reason?: string;
  /** Whether this bolus was completed successfully */
  completed: boolean;
}

/**
 * Basal rate (background insulin) record
 */
export interface BasalRate {
  /** Timestamp when this basal rate started */
  datetime: string;
  /** Insulin delivery rate in units per hour */
  rate: number;
  /** Duration this rate was active in minutes */
  duration: number;
  /** Type of basal delivery */
  type: 'scheduled' | 'temp' | 'suspend' | 'resume';
  /** Reason for temporary basal adjustment */
  reason?: string;
  /** Original scheduled rate (for temp basals) */
  scheduled_rate?: number;
  /** Percentage of scheduled rate (for temp basals) */
  percent?: number;
  /** Who/what initiated this basal change */
  initiated_by: 'user' | 'loop' | 'scheduled';
}

/**
 * Insulin on Board (active insulin) calculation
 */
export interface InsulinOnBoard {
  /** Timestamp of this IOB calculation */
  datetime: string;
  /** Total active insulin in units */
  iob: number;
  /** IOB from boluses only */
  bolus_iob?: number;
  /** IOB from basal insulin */
  basal_iob?: number;
  /** Rate of insulin decay */
  decay_rate: number;
  /** Insulin action time used for calculation (hours) */
  insulin_action_time: number;
}

/**
 * Pump settings and configuration
 */
export interface PumpSettings {
  /** Timestamp when these settings were active */
  datetime: string;
  /** Maximum basal rate allowed */
  max_basal: number;
  /** Maximum bolus amount allowed */
  max_bolus: number;
  /** Insulin sensitivity factors by time of day */
  insulin_sensitivity: Array<{
    time: string;    // "HH:MM" format
    value: number;   // mg/dL per unit
  }>;
  /** Carbohydrate ratios by time of day */
  carb_ratio: Array<{
    time: string;    // "HH:MM" format  
    value: number;   // grams per unit
  }>;
  /** Target blood glucose ranges */
  target_bg: {
    low: number;
    high: number;
  };
  /** Insulin action time in hours */
  insulin_action_time: number;
}

/**
 * Combined pump data response from API
 */
export interface PumpDataResponse {
  /** Bolus delivery records */
  boluses: BolusDelivery[];
  /** Basal rate records */
  basal_rates: BasalRate[];
  /** Insulin on board history */
  iob_history: InsulinOnBoard[];
  /** Pump settings over time */
  settings: PumpSettings[];
  /** When this data was last updated */
  last_updated: string;
  /** Time range for this data */
  time_range: {
    start: string;
    end: string;
    hours: number;
  };
}

/**
 * Combined CGM + Pump data for correlation analysis
 */
export interface CombinedDiabetesData {
  /** CGM data */
  cgm: {
    readings: any[]; // Will reference CGMReading[] when imported
    current?: any;   // Will reference CurrentGlucose when imported
  };
  /** Pump data */
  pump: PumpDataResponse;
  /** Calculated correlations and insights */
  correlations?: {
    /** Bolus effectiveness analysis */
    bolus_impact: Array<{
      bolus_time: string;
      bolus_amount: number;
      glucose_change: {
        pre_bolus: number;
        post_bolus_1h: number;
        post_bolus_2h: number;
        post_bolus_3h: number;
        effectiveness_score: number; // 0-100
      };
    }>;
    /** Overall basal effectiveness rating */
    basal_effectiveness: number; // 0-100
    /** Overnight glucose stability score */
    overnight_stability: number; // 0-100
    /** Time in range correlation with insulin delivery */
    insulin_timing_correlation: number; // -1 to 1
  };
}

/**
 * Insulin delivery visualization options
 */
export interface InsulinVisualizationConfig {
  /** Whether to show bolus markers on chart */
  showBoluses: boolean;
  /** Whether to show basal rate overlay */
  showBasal: boolean;
  /** Whether to show IOB trend line */
  showIOB: boolean;
  /** Opacity for insulin overlays */
  opacity: number;
  /** Colors for different insulin types */
  colors: {
    bolus: string;
    basal: string;
    iob: string;
    temp_basal: string;
  };
}

/**
 * Default insulin visualization configuration
 */
export const DEFAULT_INSULIN_VIZ_CONFIG: InsulinVisualizationConfig = {
  showBoluses: true,
  showBasal: true,
  showIOB: false,
  opacity: 0.7,
  colors: {
    bolus: '#FF6B35',
    basal: '#4ECDC4', 
    iob: '#45B7D1',
    temp_basal: '#FFA726',
  },
};

/**
 * Bolus type display configuration
 */
export const BOLUS_TYPE_CONFIG = {
  normal: { label: 'Normal', symbol: '●', color: '#FF6B35' },
  square: { label: 'Square', symbol: '■', color: '#FF8F00' },
  dual: { label: 'Dual', symbol: '◆', color: '#FF5722' },
  extended: { label: 'Extended', symbol: '▬', color: '#F57C00' },
} as const;

/**
 * Helper function to calculate total daily insulin
 */
export function calculateTotalDailyInsulin(
  boluses: BolusDelivery[],
  basalRates: BasalRate[]
): { bolus: number; basal: number; total: number } {
  const bolusTotal = boluses
    .filter(b => b.completed)
    .reduce((sum, b) => sum + b.amount, 0);
  
  const basalTotal = basalRates
    .filter(b => b.type !== 'suspend')
    .reduce((sum, b) => sum + (b.rate * b.duration / 60), 0);
  
  return {
    bolus: bolusTotal,
    basal: basalTotal,
    total: bolusTotal + basalTotal,
  };
}

/**
 * Helper function to get bolus display properties
 */
export function getBolusDisplayConfig(type: BolusDelivery['type']) {
  return BOLUS_TYPE_CONFIG[type] || BOLUS_TYPE_CONFIG.normal;
}