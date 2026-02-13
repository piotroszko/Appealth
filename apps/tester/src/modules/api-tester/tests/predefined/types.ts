export interface ProbePath {
  path: string;
  label: string;
  severity: "error" | "warning";
  bodyPatterns: RegExp[];
  minBodyLength?: number;
  statusOnly?: boolean;
}

export interface ProbeResult {
  status: number;
  body: string;
  headers: Record<string, string>;
}
