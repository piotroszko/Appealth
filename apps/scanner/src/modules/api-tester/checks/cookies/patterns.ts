export const AUTH_COOKIE_PATTERNS: RegExp[] = [
  /^sess(ion)?$/i,
  /^s(ess)?id$/i,
  /^token$/i,
  /^auth/i,
  /^jwt$/i,
  /^access[-_]?token$/i,
  /^refresh[-_]?token$/i,
  /^id[-_]?token$/i,
  /^phpsessid$/i,
  /^jsessionid$/i,
  /^aspsessionid/i,
  /^connect\.sid$/i,
  /^laravel[-_]session$/i,
  /^csrf/i,
  /^xsrf/i,
  /^remember[-_]?me$/i,
  /^_session$/i,
  /^__session$/i,
  /^__host-/i,
  /^__secure-/i,
];

export interface CookieSecurityFlag {
  name: string;
  attribute: string;
  authSeverity: "error" | "warning";
  nonAuthSeverity: "error" | "warning" | null;
  reason: string;
}

export const SECURITY_FLAGS: CookieSecurityFlag[] = [
  {
    name: "HttpOnly",
    attribute: "httponly",
    authSeverity: "error",
    nonAuthSeverity: "warning",
    reason: "Cookie accessible to JavaScript via document.cookie, enabling theft through XSS",
  },
  {
    name: "Secure",
    attribute: "secure",
    authSeverity: "error",
    nonAuthSeverity: "warning",
    reason: "Cookie can be transmitted over unencrypted HTTP connections",
  },
  {
    name: "SameSite",
    attribute: "samesite",
    authSeverity: "warning",
    nonAuthSeverity: null,
    reason: "Cookie may be sent with cross-site requests, increasing CSRF risk",
  },
];
