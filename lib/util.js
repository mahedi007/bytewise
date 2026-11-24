// Shared helpers for the API (runs on Cloudflare Pages Functions / Workers runtime)

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const fail = (status, message) => {
  throw new HttpError(status, message);
};

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  });
}

/** Parse a JSON request body. Requiring JSON blocks classic cross-site form posts (CSRF). */
export async function readBody(request) {
  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) fail(415, 'Expected a JSON body');
  try {
    const data = await request.json();
    return data && typeof data === 'object' ? data : {};
  } catch {
    fail(400, 'Invalid JSON');
  }
}

export function parseCookies(request) {
  const out = {};
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function makeCookie(name, value, maxAgeSeconds) {
  return [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ].join('; ');
}

/** Trim + cap a user-supplied string. Returns '' for null/undefined. */
export function str(v, max = 500) {
  if (v === null || v === undefined) return '';
  return String(v).trim().slice(0, max);
}

export function int(v, fallback = 0) {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

export const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

/** Accepts Bangladeshi mobile numbers in common formats (01XXXXXXXXX, +8801..., 8801...). */
export function normalizePhone(p) {
  const digits = String(p || '').replace(/[^\d]/g, '');
  if (/^8801\d{9}$/.test(digits)) return '+' + digits;
  if (/^01\d{9}$/.test(digits)) return '+88' + digits;
  if (digits.length >= 8 && digits.length <= 15) return '+' + digits; // international
  return '';
}

export function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Date string in Asia/Dhaka (UTC+6, no DST). offsetDays lets you get yesterday etc. */
export function dhakaDate(offsetDays = 0) {
  const d = new Date(Date.now() + 6 * 3600 * 1000 + offsetDays * 86400 * 1000);
  return d.toISOString().slice(0, 10);
}

// ---------------- crypto ----------------
const enc = new TextEncoder();

const b64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromB64url = (s) => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};

export function randomToken(bytes = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function sha256(text) {
  return b64url(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

// Workers' free plan has a tight CPU budget, so iterations are moderate.
// The count is stored with each hash, so it can be raised later without breaking old logins.
const PBKDF2_ITERATIONS = 50000;

async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64url(salt)}$${b64url(bits)}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, iter, saltS, hashS] = String(stored || '').split('$');
  if (scheme !== 'pbkdf2' || !saltS || !hashS) return false;
  const bits = new Uint8Array(await pbkdf2(password, fromB64url(saltS), Number(iter)));
  const expected = fromB64url(hashS);
  if (bits.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < bits.length; i++) diff |= bits[i] ^ expected[i];
  return diff === 0;
}
