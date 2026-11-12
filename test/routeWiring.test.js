/**
 * UI <-> API wiring audit (no database needed).
 *
 * 1. Reads each backend's REAL route table from Express at runtime (not by regex).
 * 2. Extracts every apiCall(...) each web portal makes (method + path, with file-level
 *    string constants like `${BASE}` resolved and `${id}`-style parts treated as params).
 * 3. Flags any call with no matching backend route — that screen action is broken (404).
 * 4. Flags menu links (navigationConfig) that point at no page route (blank/redirect page).
 *
 * Run: node test/routeWiring.test.js            (exit 1 when a break is found)
 *      node test/routeWiring.test.js --json     (machine-readable report)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORTALS = [
  { name: 'Super Admin', dir: 'SuperAdmin_module_forntend', backend: 'SuperAdmin_Backend', prefix: '/api/v1/super-admin', callsIncludePrefix: true },
  { name: 'Institute Admin', dir: 'IntituteAdmin_module_frontend', backend: 'IntituteAdmin_Backend', prefix: '/api/v1/admin', callsIncludePrefix: false },
  { name: 'Staff', dir: 'Staff_module_frontend', backend: 'Staff_backend', prefix: '/api/v1/staff', callsIncludePrefix: false },
  { name: 'Student', dir: 'Student_module_frontend', backend: 'Student_Backend', prefix: '/api/v1/student', callsIncludePrefix: false },
];

// ---------- backend routes, straight from Express ----------
const collectRoutes = (stack, base = '', out = []) => {
  for (const layer of stack) {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase());
      const paths = [].concat(layer.route.path);
      for (const p of paths) for (const m of methods) out.push({ method: m, path: base + p });
    } else if (layer.name === 'router' && layer.handle?.stack) {
      // a mounted sub-router: recover its literal mount path from the layer regexp
      const src = layer.regexp?.source || '';
      const mount = src.replace('^\\/', '/').replace('\\/?(?=\\/|$)', '').replace(/\\\//g, '/').replace(/\(\?:\(\[\^\\\/]\+\?\)\)/g, ':param');
      collectRoutes(layer.handle.stack, base + (mount === '/' ? '' : mount), out);
    }
  }
  return out;
};

const backendRoutes = {};
for (const p of PORTALS) {
  const router = require(path.join(ROOT, p.backend, 'src', 'routes', 'apiRoutes.js'));
  backendRoutes[p.backend] = collectRoutes(router.stack).map((r) => ({ ...r, full: p.prefix + r.path }));
}

const toSegments = (url) => url.split('?')[0].replace(/\/+$/, '').split('/').filter(Boolean);
const segMatch = (route, call) => {
  const a = toSegments(route);
  const b = toSegments(call);
  if (a.length !== b.length) return false;
  return a.every((s, i) => s.startsWith(':') || b[i] === ':param' || s === b[i]);
};

// ---------- frontend calls ----------
const walk = (d, out = []) => {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jsx?|tsx?)$/.test(f)) out.push(p);
  }
  return out;
};

// Reads one JS expression/argument starting at i, honouring strings, nested template
// literals and brackets; stops at a top-level ',' or ')'. Returns [text, endIndex].
const readArg = (src, i) => {
  const start = i;
  let depth = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "'" || ch === '"') { i = skipString(src, i); continue; }
    if (ch === '`') { i = skipTemplate(src, i); continue; }
    if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) { if (depth === 0) break; depth--; }
    else if (ch === ',' && depth === 0) break;
    i++;
  }
  return [src.slice(start, i).trim(), i];
};
const skipString = (src, i) => { const q = src[i++]; while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; } return i + 1; };
const skipTemplate = (src, i) => {
  i++;
  while (i < src.length && src[i] !== '`') {
    if (src[i] === '\\') { i += 2; continue; }
    if (src[i] === '$' && src[i + 1] === '{') { i = skipBraces(src, i + 1); continue; }
    i++;
  }
  return i + 1;
};
const skipBraces = (src, i) => {
  let depth = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "'" || ch === '"') { i = skipString(src, i); continue; }
    if (ch === '`') { i = skipTemplate(src, i); continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return i + 1; }
    i++;
  }
  return i;
};
// Splits a template literal's text into literal chunks and ${expr} parts.
const templateParts = (tpl) => {
  const body = tpl.slice(1, -1);
  const parts = [];
  let i = 0;
  let lit = '';
  while (i < body.length) {
    if (body[i] === '$' && body[i + 1] === '{') {
      const end = skipBraces(body, i + 1);
      parts.push({ lit }, { expr: body.slice(i + 2, end - 1).trim() });
      lit = '';
      i = end;
    } else { lit += body[i]; i++; }
  }
  parts.push({ lit });
  return parts;
};

const extractCalls = (file) => {
  const src = fs.readFileSync(file, 'utf8');
  const consts = {};
  for (const m of src.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*(['"`])([^'"`$]*)\2\s*;/g)) consts[m[1]] = m[3];
  const calls = [];
  const unresolved = [];
  for (const m of src.matchAll(/\bapiCall\(/g)) {
    let i = m.index + m[0].length;
    const [arg0, end0] = readArg(src, i);
    const arg1 = src[end0] === ',' ? readArg(src, end0 + 1)[0] : '';
    const line = src.slice(0, m.index).split('\n').length;
    let url;
    if (/^['"]/.test(arg0)) url = arg0.slice(1, -1);
    else if (arg0.startsWith('`')) {
      // A ${expr} that fills a whole path segment = a route param; one glued onto other
      // text (e.g. `/alumni${query}`) = a query-string suffix, dropped; a known string
      // constant (`${BASE}`) is substituted.
      url = '';
      const parts = templateParts(arg0);
      // starts with a non-constant variable (e.g. a helper's `${base}` parameter) → can't be resolved statically
      if (parts[0].lit === '' && parts[1] && !(parts[1].expr in consts)) { unresolved.push(arg0); continue; }
      parts.forEach((p, idx) => {
        if ('lit' in p) { url += p.lit; return; }
        if (p.expr in consts) { url += consts[p.expr]; return; }
        const before = url.slice(-1);
        const after = (parts[idx + 1]?.lit || '').charAt(0);
        if (before === '/' && (after === '/' || after === '' || after === '?')) url += ':param';
      });
      if (!url.startsWith('/')) { unresolved.push(arg0); continue; }
    } else { unresolved.push(arg0); continue; } // whole URL from a variable
    url = url.split('?')[0];
    const methodMatch = arg1.match(/method:\s*['"`](GET|POST|PUT|PATCH|DELETE)['"`]/i);
    calls.push({ method: methodMatch ? methodMatch[1].toUpperCase() : 'GET', url, line });
  }
  return { calls, unresolved };
};

// ---------- menu links vs page routes ----------
const extractNavPaths = (dir) => {
  const navFile = path.join(ROOT, dir, 'src', 'routes', 'navigationConfig.js');
  if (!fs.existsSync(navFile)) return [];
  return [...fs.readFileSync(navFile, 'utf8').matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1]);
};
const extractPageRoutes = (dir) => {
  const src = fs.readFileSync(path.join(ROOT, dir, 'src', 'routes', 'AppRoutes.jsx'), 'utf8');
  // Rebuild nested <Route path> into full paths by tracking open/close of parent routes
  const full = [];
  const stack = [];
  for (const m of src.matchAll(/<Route\b([^>]*?)(\/?)>|<\/Route>/g)) {
    if (m[0] === '</Route>') { stack.pop(); continue; }
    const attrs = m[1];
    const p = (attrs.match(/path=["']([^"']+)["']/) || [])[1];
    const parent = stack.length ? stack[stack.length - 1] : '';
    let joined = p === undefined ? parent : p.startsWith('/') ? p : `${parent.replace(/\/\*?$/, '')}/${p}`;
    joined = joined.replace(/\/\*$/, '/*');
    if (p !== undefined) full.push(joined);
    if (m[2] !== '/') stack.push(joined.replace(/\/\*$/, ''));
  }
  return full;
};
const pageRouteMatches = (routes, link) => routes.some((r) => {
  if (r.endsWith('/*')) return false; // catch-alls redirect, they don't render the page
  return segMatch(r, link);
});

// ---------- run ----------
const report = { portals: [] };
let breaks = 0;
for (const p of PORTALS) {
  const files = walk(path.join(ROOT, p.dir, 'src'));
  const routes = backendRoutes[p.backend];
  const missing = [];
  const unresolved = [];
  let total = 0;
  for (const file of files) {
    const { calls, unresolved: u } = extractCalls(file);
    u.forEach((x) => unresolved.push({ file: path.relative(ROOT, file), expr: x }));
    for (const c of calls) {
      total++;
      const full = p.callsIncludePrefix ? c.url : p.prefix + c.url;
      const sameMethod = routes.filter((r) => r.method === c.method && segMatch(r.full, full));
      if (sameMethod.length) continue;
      const otherMethod = routes.filter((r) => segMatch(r.full, full)).map((r) => r.method);
      missing.push({ file: path.relative(ROOT, file), line: c.line, method: c.method, url: full, existsWith: [...new Set(otherMethod)] });
    }
  }
  const pageRoutes = extractPageRoutes(p.dir);
  const deadLinks = [...new Set(extractNavPaths(p.dir))].filter((l) => !pageRouteMatches(pageRoutes, l));
  breaks += missing.length + deadLinks.length;
  report.portals.push({ portal: p.name, backendRoutes: routes.length, frontendCalls: total, missing, deadLinks, unresolved });
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  for (const r of report.portals) {
    console.log(`\n=== ${r.portal}: ${r.frontendCalls} API calls checked against ${r.backendRoutes} backend routes`);
    if (!r.missing.length) console.log('  ✅ every API call has a backend route');
    for (const m of r.missing) {
      console.log(`  ❌ ${m.method} ${m.url}  (${m.file}:${m.line})${m.existsWith.length ? `  — route exists only as ${m.existsWith.join('/')}` : '  — no such route'}`);
    }
    if (!r.deadLinks.length) console.log('  ✅ every menu link opens a page');
    for (const l of r.deadLinks) console.log(`  ❌ menu link ${l} has no page route`);
    if (r.unresolved.length) console.log(`  ℹ ${r.unresolved.length} call(s) build their URL from a variable (checked by the live sweep instead)`);
  }
}
if (breaks) {
  if (!process.argv.includes('--json')) console.error(`\n❌ ${breaks} wiring break(s) found.`);
  process.exit(1);
}
if (!process.argv.includes('--json')) console.log('\n🎉 Every UI API call and menu link is wired to something real.');
