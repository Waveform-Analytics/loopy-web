export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  timestamp: string;
}

export interface LoadingState {
  isLoading: boolean;
  error: ApiError | null;
}

export interface AppState {
  currentReading: LoadingState & {
    data: any | null;
  };
  historicalData: LoadingState & {
    data: any[] | null;
  };
  timeRange: string;
  liveMode: boolean;
}

export type NotificationLevel = 'info' | 'warning' | 'error' | 'success';