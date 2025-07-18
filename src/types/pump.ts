// Pump data types - designed for future integration
export interface BolusDelivery {
  datetime: string;
  amount: number;           // Units of insulin
  type: 'normal' | 'square' | 'dual';
  duration?: number;        // For extended boluses
  carbs?: number;          // Associated carb count
  bg_input?: number;       // BG used for calculation
  programmed_by: 'user' | 'loop';
}

export interface BasalRate {
  datetime: string;
  rate: number;            // Units per hour
  duration: number;        // Duration in minutes
  type: 'scheduled' | 'temp' | 'suspend';
  reason?: string;         // Loop adjustment reason
}

export interface InsulinOnBoard {
  datetime: string;
  iob: number;             // Active insulin units
  decay_rate: number;      // How fast it's decaying
}

export interface PumpSettings {
  datetime: string;
  max_basal: number;
  max_bolus: number;
  insulin_sensitivity: number[];  // By time of day
  carb_ratio: number[];           // By time of day
  target_bg: {
    low: number;
    high: number;
  };
}

export interface PumpDataResponse {
  boluses: BolusDelivery[];
  basal_rates: BasalRate[];
  iob_history: InsulinOnBoard[];
  settings: PumpSettings[];
  last_updated: string;
  time_range: {
    start: string;
    end: string;
    hours: number;
  };
}

// Combined data for correlation analysis
export interface CombinedDiabetesData {
  cgm: import('./cgm').CGMDataResponse;
  pump: PumpDataResponse;
  correlations?: {
    bolus_impact: Array<{
      bolus_time: string;
      bolus_amount: number;
      glucose_change: {
        pre_bolus: number;
        post_bolus_1h: number;
        post_bolus_2h: number;
        effectiveness_score: number;
      };
    }>;
    basal_effectiveness: number;
    overnight_stability: number;
  };
}