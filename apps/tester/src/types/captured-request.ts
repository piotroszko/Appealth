export interface CapturedRequest {
  url: string;
  method: string;
  resourceType: string;
  requestHeaders: Record<string, string>;
  queryParams: Record<string, string>;
  postData: string | null;
  responseStatus: number | null;
  responseHeaders: Record<string, string> | null;
  responseBody: string | null;
  sourcePageUrl: string;
}
