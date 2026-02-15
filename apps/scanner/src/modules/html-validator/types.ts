export interface VnuMessage {
  type: "error" | "info" | "non-document-error";
  subType?: "warning" | "fatal";
  message: string;
  extract?: string;
  firstLine?: number;
  lastLine?: number;
  firstColumn?: number;
  lastColumn?: number;
  hiliteStart?: number;
  hiliteLength?: number;
}

export interface VnuOutput {
  messages: VnuMessage[];
}

export interface HtmlValidatorResult {
  url: string;
  messages: VnuMessage[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
  durationMs: number;
}
