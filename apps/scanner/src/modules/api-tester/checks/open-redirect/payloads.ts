export const REDIRECT_PARAM_NAMES = new Set([
  "next",
  "url",
  "redirect",
  "redirect_url",
  "redirect_uri",
  "return",
  "return_url",
  "returnurl",
  "returnto",
  "dest",
  "destination",
  "goto",
  "target",
  "continue",
  "forward",
  "redir",
  "callback",
  "to",
  "out",
  "back",
  "backurl",
  "fallback",
  "ref",
  "jump",
  "link",
  "service",
  "view",
  "login_url",
  "logout",
  "checkout_url",
]);

export const EVIL_DOMAIN = "open-redirect-test.example.com";

export function makePayloads(targetHost: string): string[] {
  return [
    `https://${EVIL_DOMAIN}`,
    `//${EVIL_DOMAIN}`,
    `https://${EVIL_DOMAIN}/`,
    `/\\/${EVIL_DOMAIN}`,
    `https://${targetHost}@${EVIL_DOMAIN}`,
    `https://${EVIL_DOMAIN}?.${targetHost}`,
    `https://${EVIL_DOMAIN}#${targetHost}`,
    `https://${EVIL_DOMAIN}%00.${targetHost}`,
  ];
}
