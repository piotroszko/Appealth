import type { ProbePath } from "./types.js";

// ── 1. Environment & Secrets ────────────────────────────────────────────
export const ENV_SECRETS: ProbePath[] = [
  {
    path: ".env",
    label: ".env file exposed",
    severity: "error",
    bodyPatterns: [/^\w+=.+/m, /DB_(HOST|PASSWORD|USER)/i, /API_KEY/i, /SECRET/i],
  },
  {
    path: ".env.local",
    label: ".env.local file exposed",
    severity: "error",
    bodyPatterns: [/^\w+=.+/m, /SECRET/i, /KEY/i],
  },
  {
    path: ".env.production",
    label: ".env.production file exposed",
    severity: "error",
    bodyPatterns: [/^\w+=.+/m, /SECRET/i, /DATABASE/i],
  },
  {
    path: ".env.backup",
    label: ".env.backup file exposed",
    severity: "error",
    bodyPatterns: [/^\w+=.+/m, /SECRET/i, /KEY/i],
  },
  {
    path: "config.php",
    label: "PHP config file exposed",
    severity: "error",
    bodyPatterns: [/<\?php/i, /\$db/i, /define\s*\(/i],
  },
  {
    path: "wp-config.php",
    label: "WordPress config exposed",
    severity: "error",
    bodyPatterns: [/DB_NAME/i, /DB_PASSWORD/i, /AUTH_KEY/i, /table_prefix/i],
  },
  {
    path: "web.config",
    label: "IIS web.config exposed",
    severity: "error",
    bodyPatterns: [/<configuration/i, /connectionString/i, /<appSettings/i],
  },
  {
    path: "config.json",
    label: "config.json exposed",
    severity: "warning",
    bodyPatterns: [/"(password|secret|key|token|database)"/i],
  },
  {
    path: "settings.json",
    label: "settings.json exposed",
    severity: "warning",
    bodyPatterns: [/"(password|secret|key|token|database)"/i],
  },
];

// ── 2. Version Control ──────────────────────────────────────────────────
export const VERSION_CONTROL: ProbePath[] = [
  {
    path: ".git/HEAD",
    label: "Git HEAD exposed",
    severity: "error",
    bodyPatterns: [/^ref: refs\/heads\//m],
  },
  {
    path: ".git/config",
    label: "Git config exposed",
    severity: "error",
    bodyPatterns: [/\[core\]/i, /\[remote\s+"origin"\]/i, /repositoryformatversion/i],
  },
  {
    path: ".svn/entries",
    label: "SVN entries exposed",
    severity: "error",
    bodyPatterns: [/^(\d+)\n/m, /svn:/i, /dir\n/i],
  },
  {
    path: ".hg/requires",
    label: "Mercurial repo exposed",
    severity: "error",
    bodyPatterns: [/revlogv1/i, /dotencode/i, /fncache/i],
  },
  {
    path: ".gitignore",
    label: ".gitignore exposed",
    severity: "warning",
    bodyPatterns: [/node_modules/i, /\.env/i, /\*\.log/i, /vendor\//i],
  },
];

// ── 3. Package & Dependency Files ───────────────────────────────────────
export const PACKAGE_FILES: ProbePath[] = [
  {
    path: "package.json",
    label: "package.json exposed",
    severity: "warning",
    bodyPatterns: [/"name"\s*:/i, /"version"\s*:/i, /"dependencies"\s*:/i],
  },
  {
    path: "package-lock.json",
    label: "package-lock.json exposed",
    severity: "warning",
    bodyPatterns: [/"lockfileVersion"/i, /"packages"\s*:/i],
  },
  {
    path: "composer.json",
    label: "composer.json exposed (PHP)",
    severity: "warning",
    bodyPatterns: [/"require"\s*:/i, /"name"\s*:/i],
  },
  {
    path: "composer.lock",
    label: "composer.lock exposed (PHP)",
    severity: "warning",
    bodyPatterns: [/"packages"\s*:/i, /"content-hash"/i],
  },
  {
    path: "Gemfile",
    label: "Gemfile exposed (Ruby)",
    severity: "warning",
    bodyPatterns: [/^source\s/m, /^gem\s/m],
  },
  {
    path: "Gemfile.lock",
    label: "Gemfile.lock exposed (Ruby)",
    severity: "warning",
    bodyPatterns: [/^GEM$/m, /^BUNDLED WITH$/m, /specs:/i],
  },
  {
    path: "requirements.txt",
    label: "requirements.txt exposed (Python)",
    severity: "warning",
    bodyPatterns: [/^[\w-]+==/m, /^(django|flask|requests|numpy)/im],
  },
  {
    path: "Pipfile",
    label: "Pipfile exposed (Python)",
    severity: "warning",
    bodyPatterns: [/\[packages\]/i, /\[dev-packages\]/i],
  },
];

// ── 4. Debug & Admin Panels ─────────────────────────────────────────────
export const DEBUG_ADMIN: ProbePath[] = [
  {
    path: "admin",
    label: "Admin panel accessible",
    severity: "warning",
    bodyPatterns: [/login/i, /admin/i, /dashboard/i, /password/i],
  },
  {
    path: "phpinfo.php",
    label: "phpinfo() page exposed",
    severity: "error",
    bodyPatterns: [/phpinfo\(\)/i, /PHP Version/i, /Configuration File/i],
  },
  {
    path: "telescope",
    label: "Laravel Telescope exposed",
    severity: "error",
    bodyPatterns: [/telescope/i, /Laravel/i],
  },
  {
    path: "actuator",
    label: "Spring Boot Actuator exposed",
    severity: "error",
    bodyPatterns: [/"_links"/i, /actuator/i, /"self"/i],
  },
  {
    path: "console",
    label: "Debug console exposed",
    severity: "error",
    bodyPatterns: [/console/i, /debugger/i, /interactive/i],
  },
  {
    path: "__debug__/",
    label: "Django debug toolbar exposed",
    severity: "error",
    bodyPatterns: [/djdt/i, /debug/i, /toolbar/i],
  },
  {
    path: "elmah.axd",
    label: "ELMAH error log exposed (.NET)",
    severity: "error",
    bodyPatterns: [/elmah/i, /error\s+log/i, /exception/i],
  },
  {
    path: "trace.axd",
    label: "ASP.NET trace exposed",
    severity: "error",
    bodyPatterns: [/trace/i, /request\s+details/i, /asp\.net/i],
  },
];

// ── 5. Server Information ───────────────────────────────────────────────
export const SERVER_INFO: ProbePath[] = [
  {
    path: "server-status",
    label: "Apache server-status exposed",
    severity: "error",
    bodyPatterns: [/Apache Server Status/i, /Server uptime/i, /requests\/sec/i],
  },
  {
    path: "server-info",
    label: "Apache server-info exposed",
    severity: "error",
    bodyPatterns: [/Apache Server Information/i, /Server Settings/i, /Module Name/i],
  },
  {
    path: "metrics",
    label: "Prometheus metrics exposed",
    severity: "warning",
    bodyPatterns: [/^# HELP /m, /^# TYPE /m, /_total\s/m, /_bucket\{/m],
  },
  {
    path: "health",
    label: "Health endpoint exposed",
    severity: "warning",
    bodyPatterns: [/"status"\s*:\s*"(UP|ok|healthy)"/i],
  },
  {
    path: "actuator/env",
    label: "Spring Actuator /env exposed",
    severity: "error",
    bodyPatterns: [/"propertySources"/i, /"activeProfiles"/i],
  },
  {
    path: "actuator/configprops",
    label: "Spring Actuator configprops exposed",
    severity: "error",
    bodyPatterns: [/"contexts"/i, /"beans"/i, /"prefix"/i],
  },
  {
    path: "actuator/heapdump",
    label: "Java heap dump downloadable",
    severity: "error",
    bodyPatterns: [],
    statusOnly: true,
    minBodyLength: 10_000,
  },
];

// ── 6. Backup & Old Files ───────────────────────────────────────────────
export const BACKUP_FILES: ProbePath[] = [
  {
    path: "database.sql",
    label: "SQL dump file exposed",
    severity: "error",
    bodyPatterns: [/CREATE TABLE/i, /INSERT INTO/i, /DROP TABLE/i, /-- Dump/i],
  },
  {
    path: "backup.zip",
    label: "Backup archive downloadable",
    severity: "error",
    bodyPatterns: [],
    statusOnly: true,
    minBodyLength: 100,
  },
  {
    path: "backup.tar.gz",
    label: "Backup archive downloadable",
    severity: "error",
    bodyPatterns: [],
    statusOnly: true,
    minBodyLength: 100,
  },
  {
    path: "config.bak",
    label: "Config backup file exposed",
    severity: "error",
    bodyPatterns: [/password/i, /secret/i, /database/i, /<\?php/i, /^\w+=.+/m],
  },
  {
    path: "config.old",
    label: "Old config file exposed",
    severity: "error",
    bodyPatterns: [/password/i, /secret/i, /database/i, /<\?php/i, /^\w+=.+/m],
  },
];

// ── 7. Infrastructure Config ────────────────────────────────────────────
export const INFRA_CONFIG: ProbePath[] = [
  {
    path: "Dockerfile",
    label: "Dockerfile exposed",
    severity: "warning",
    bodyPatterns: [/^FROM\s/m, /^RUN\s/m, /^COPY\s/m, /^EXPOSE\s/m],
  },
  {
    path: "docker-compose.yml",
    label: "docker-compose.yml exposed",
    severity: "error",
    bodyPatterns: [/^services:/m, /image:/i, /ports:/i, /volumes:/i],
  },
  {
    path: "terraform.tfstate",
    label: "Terraform state file exposed",
    severity: "error",
    bodyPatterns: [/"terraform_version"/i, /"resources"/i, /"serial"/i],
  },
  {
    path: ".kube/config",
    label: "Kubernetes config exposed",
    severity: "error",
    bodyPatterns: [/apiVersion:/i, /clusters:/i, /contexts:/i],
  },
];

// ── 8. Source Code & Source Maps ─────────────────────────────────────────
export const SOURCE_EXPOSURE: ProbePath[] = [
  {
    path: "main.js.map",
    label: "JS source map exposed (main)",
    severity: "warning",
    bodyPatterns: [/"version"\s*:\s*3/i, /"sources"/i, /"mappings"/i],
  },
  {
    path: "app.js.map",
    label: "JS source map exposed (app)",
    severity: "warning",
    bodyPatterns: [/"version"\s*:\s*3/i, /"sources"/i, /"mappings"/i],
  },
  {
    path: "bundle.js.map",
    label: "JS source map exposed (bundle)",
    severity: "warning",
    bodyPatterns: [/"version"\s*:\s*3/i, /"sources"/i, /"mappings"/i],
  },
];

// ── 9. Log Files ────────────────────────────────────────────────────────
export const LOG_FILES: ProbePath[] = [
  {
    path: "storage/logs/laravel.log",
    label: "Laravel log file exposed",
    severity: "error",
    bodyPatterns: [/\[\d{4}-\d{2}-\d{2}/i, /Stack trace/i, /Exception/i],
  },
  {
    path: "error.log",
    label: "Error log file exposed",
    severity: "error",
    bodyPatterns: [/\[error\]/i, /\[\d{4}-\d{2}-\d{2}/i, /Exception/i, /PHP (Warning|Fatal)/i],
  },
  {
    path: "access.log",
    label: "Access log file exposed",
    severity: "warning",
    bodyPatterns: [/\d+\.\d+\.\d+\.\d+/i, /"(GET|POST|PUT|DELETE)\s/i, /HTTP\/\d/i],
  },
  {
    path: "debug.log",
    label: "Debug log file exposed",
    severity: "error",
    bodyPatterns: [/\[\d{4}-\d{2}-\d{2}/i, /debug/i, /error/i],
  },
  {
    path: "npm-debug.log",
    label: "npm debug log exposed",
    severity: "warning",
    bodyPatterns: [/npm ERR!/i, /verbose/i, /error/i],
  },
];

export const ALL_CATEGORIES = [
  { name: "Environment & Secrets", paths: ENV_SECRETS },
  { name: "Version Control", paths: VERSION_CONTROL },
  { name: "Package & Dependency Files", paths: PACKAGE_FILES },
  { name: "Debug & Admin Panels", paths: DEBUG_ADMIN },
  { name: "Server Information", paths: SERVER_INFO },
  { name: "Backup & Old Files", paths: BACKUP_FILES },
  { name: "Infrastructure Config", paths: INFRA_CONFIG },
  { name: "Source Code & Source Maps", paths: SOURCE_EXPOSURE },
  { name: "Log Files", paths: LOG_FILES },
] as const;
