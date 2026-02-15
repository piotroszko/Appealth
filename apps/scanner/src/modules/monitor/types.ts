export interface MonitorCheckResult {
  statusCode: number | null;
  responseTimeMs: number;
  error: string | null;
}

export interface HealthCheckResponse {
  url: string;
  statusCode: number | null;
  responseTimeMs: number;
  error: string | null;
  checkedAt: Date;
}
