export type FindingStatus = "pass" | "warn" | "fail" | "info";

export interface CheckFinding {
  check: string;
  status: FindingStatus;
  message: string;
  details?: Record<string, unknown>;
}

// Core Records
export interface SoaRecord {
  nsname: string;
  hostmaster: string;
  serial: number;
  refresh: number;
  retry: number;
  expire: number;
  minttl: number;
}

export interface MxRecord {
  priority: number;
  exchange: string;
}

export interface CaaRecord {
  critical: number;
  issue?: string;
  issuewild?: string;
  iodef?: string;
  [key: string]: unknown;
}

export interface RecordsResult {
  a: string[];
  aaaa: string[];
  ns: string[];
  soa: SoaRecord | null;
  mx: MxRecord[];
  txt: string[];
  cname: string[];
  caa: CaaRecord[];
  findings: CheckFinding[];
}

// Email Security
export interface SpfResult {
  raw: string | null;
  mechanisms: string[];
  dnsLookupCount: number;
  hasAll: boolean;
  allQualifier: string | null;
}

export interface DmarcResult {
  raw: string | null;
  policy: string | null;
  subdomainPolicy: string | null;
  adkim: string | null;
  aspf: string | null;
  rua: string | null;
  ruf: string | null;
}

export interface DkimResult {
  foundSelectors: string[];
  checkedSelectors: string[];
}

export interface EmailSecurityResult {
  spf: SpfResult;
  dmarc: DmarcResult;
  dkim: DkimResult;
  findings: CheckFinding[];
}

// DNSSEC
export interface DnssecResult {
  enabled: boolean;
  hasRrsig: boolean;
  adFlag: boolean;
  findings: CheckFinding[];
}

// Nameserver Health
export interface NsProbeResult {
  nameserver: string;
  ip: string | null;
  responsive: boolean;
  responseTimeMs: number | null;
  soaSerial: number | null;
  error?: string;
}

export interface NameserverHealthResult {
  probes: NsProbeResult[];
  soaSerialsConsistent: boolean;
  delegationConsistent: boolean | null;
  parentNs: string[];
  authoritativeNs: string[];
  findings: CheckFinding[];
}

// Reverse DNS
export interface ReverseDnsEntry {
  ip: string;
  ptrHostnames: string[];
  forwardConfirmed: boolean;
}

export interface ReverseDnsResult {
  entries: ReverseDnsEntry[];
  findings: CheckFinding[];
}

// Misconfigurations
export interface MisconfigurationResult {
  danglingCnames: { cname: string; target: string }[];
  openResolvers: { nameserver: string; ip: string }[];
  axfrExposed: { nameserver: string; ip: string }[];
  findings: CheckFinding[];
}

// Response Quality
export interface TtlEntry {
  type: string;
  value: string;
  ttl: number;
}

export interface ResponseQualityResult {
  resolutionTimeMs: number;
  ttls: TtlEntry[];
  findings: CheckFinding[];
}

// Summary
export interface DnsHealthSummary {
  pass: number;
  warn: number;
  fail: number;
  info: number;
  total: number;
}

// Top-level result
export interface DnsHealthCheckResult {
  domain: string;
  timestamp: string;
  records: RecordsResult;
  emailSecurity: EmailSecurityResult;
  dnssec: DnssecResult;
  nameserverHealth: NameserverHealthResult;
  reverseDns: ReverseDnsResult;
  misconfigurations: MisconfigurationResult;
  responseQuality: ResponseQualityResult;
  summary: DnsHealthSummary;
  durationMs: number;
}
