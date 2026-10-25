/**
 * Builds all 4 web portals into ONE static site (dist-web/) so they can be hosted
 * under a single URL — one Vercel project, see the root vercel.json:
 *
 *   /super-admin/*  → SuperAdmin_module_forntend
 *   /admin/*        → IntituteAdmin_module_frontend   (also serves / and /login)
 *   /staff/*        → Staff_module_frontend
 *   /student/*      → Student_module_frontend
 *
 * Every portal's routes are already prefixed with its path, so each app is just
 * built with a matching Vite `base`. One origin = shared localStorage, so the
 * unified login page can sign in to any portal (VITE_SINGLE_SITE=true).
 *
 * Backend URLs come from VITE_<ROLE>_API_URL env vars (set them in Vercel), with
 * the current Render URLs as defaults. Run locally: `node scripts/build-web.mjs`.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outRoot = path.join(root, 'dist-web');

const apiUrls = {
  SUPER_ADMIN: process.env.VITE_SUPER_ADMIN_API_URL || 'https://scoms-erp-main-1.onrender.com',
  INSTITUTE_ADMIN: process.env.VITE_INSTITUTE_ADMIN_API_URL || 'https://scoms-erp-main-2.onrender.com',
  STAFF: process.env.VITE_STAFF_API_URL || 'https://scoms-erp-main.onrender.com',
  STUDENT: process.env.VITE_STUDENT_API_URL || 'https://scoms-erp-main-3.onrender.com',
};

const portals = [
  { dir: 'SuperAdmin_module_forntend', base: 'super-admin', role: 'SUPER_ADMIN' },
  { dir: 'IntituteAdmin_module_frontend', base: 'admin', role: 'INSTITUTE_ADMIN' },
  { dir: 'Staff_module_frontend', base: 'staff', role: 'STAFF' },
  { dir: 'Student_module_frontend', base: 'student', role: 'STUDENT' },
];

const sharedEnv = {
  VITE_SINGLE_SITE: 'true',
  VITE_SUPER_ADMIN_API_URL: apiUrls.SUPER_ADMIN,
  VITE_INSTITUTE_ADMIN_API_URL: apiUrls.INSTITUTE_ADMIN,
  VITE_STAFF_API_URL: apiUrls.STAFF,
  VITE_STUDENT_API_URL: apiUrls.STUDENT,
};

const run = (cmd, cwd, env) => {
  console.log(`\n> [${path.basename(cwd)}] ${cmd}`);
  execSync(cmd, { cwd, env, stdio: 'inherit' });
};

rmSync(outRoot, { recursive: true, force: true });
mkdirSync(outRoot, { recursive: true });

for (const portal of portals) {
  const cwd = path.join(root, portal.dir);
  const env = { ...process.env, ...sharedEnv, VITE_API_URL: apiUrls[portal.role] };

  // Always a clean install on Vercel; locally reuse an existing node_modules
  if (process.env.VERCEL || !existsSync(path.join(cwd, 'node_modules'))) {
    run('npm ci --include=dev', cwd, env);
  }
  run(`npx vite build --base=/${portal.base}/ --outDir "${path.join(outRoot, portal.base)}" --emptyOutDir`, cwd, env);
}

console.log(`\nBuilt all portals into ${outRoot}`);
