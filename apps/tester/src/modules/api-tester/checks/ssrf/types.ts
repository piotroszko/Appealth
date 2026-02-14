export interface SsrfPayload {
  url: string;
  label: string;
  category: string;
  patterns: RegExp[];
}
