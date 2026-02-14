export type FindingStatus = "pass" | "warn" | "fail" | "info";

export interface CheckFinding {
  check: string;
  status: FindingStatus;
  message: string;
  details?: Record<string, unknown>;
}

export interface SslTlsRequestBody {
  url: string;
}

// Certificate check
export interface CertificateInfo {
  subject: { CN?: string; O?: string; C?: string };
  issuer: { CN?: string; O?: string; C?: string };
  validFrom: string;
  validTo: string;
  daysUntilExpiry: number;
  serialNumber: string;
  fingerprint256: string;
  subjectAltNames: string[];
  isSelfSigned: boolean;
  signatureAlgorithm: string;
}

export interface ChainCertificate {
  subject: string;
  issuer: string;
  validTo: string;
  isSelfSigned: boolean;
}

export interface CertificateResult {
  certificate: CertificateInfo | null;
  chain: ChainCertificate[];
  chainValid: boolean;
  chainLength: number;
  findings: CheckFinding[];
}

// Protocol check
export interface ProtocolSupport {
  protocol: string;
  supported: boolean;
  deprecated: boolean;
}

export interface ProtocolResult {
  protocols: ProtocolSupport[];
  negotiatedProtocol: string | null;
  findings: CheckFinding[];
}

// Cipher check
export interface CipherInfo {
  name: string;
  version: string;
  bits: number;
  strength: "insecure" | "weak" | "acceptable" | "strong";
}

export interface CipherResult {
  negotiatedCipher: CipherInfo | null;
  findings: CheckFinding[];
}

// HSTS check
export interface HstsResult {
  present: boolean;
  maxAge: number | null;
  includeSubDomains: boolean;
  preload: boolean;
  rawHeader: string | null;
  findings: CheckFinding[];
}

// CAA validation
export interface CaaValidationResult {
  caaRecords: string[];
  certificateIssuer: string | null;
  issuerMatchesCaa: boolean | null;
  findings: CheckFinding[];
}

// Summary
export interface SslTlsSummary {
  pass: number;
  warn: number;
  fail: number;
  info: number;
  total: number;
}

// Top-level result
export interface SslTlsCheckResult {
  domain: string;
  port: number;
  timestamp: string;
  certificate: CertificateResult;
  protocol: ProtocolResult;
  cipher: CipherResult;
  hsts: HstsResult;
  caaValidation: CaaValidationResult;
  summary: SslTlsSummary;
  durationMs: number;
}
