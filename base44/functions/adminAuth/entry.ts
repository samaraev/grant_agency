import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  nextLoginAttempt,
  readCookie,
  signAdminSession,
  verifyAdminPassword
} from '../../shared/adminAuthCore.js';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_LIFETIME_MS,
  getAdminSession,
  hasExpectedOrigin,
  readAdminSecrets,
} from '../../shared/adminAuthSession.ts';

const MAX_ATTEMPTS = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

function response(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}

function cookieHeader(value, maxAge) {
  return `${ADMIN_SESSION_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}

async function attemptKey(request, secret) {
  const address = request.headers.get('cf-connecting-ip')?.trim() || 'unavailable';
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = new Uint8Array(
    await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(`admin-rate-limit:${address.slice(0, 128)}`)
    )
  );
  let binary = '';
  for (const byte of digest) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

async function findAttempt(base44, key) {
  const page = await base44.asServiceRole.entities.AdminLoginAttempt.filter(
    { attempt_key: key },
    { limit: 1 }
  );
  return page?.items?.[0] || null;
}

async function saveAttempt(base44, current, key, values) {
  if (current?.id) {
    await base44.asServiceRole.entities.AdminLoginAttempt.update(current.id, values);
  } else {
    await base44.asServiceRole.entities.AdminLoginAttempt.create({ attempt_key: key, ...values });
  }
}

async function resetAttempt(base44, current) {
  if (current?.id) {
    await base44.asServiceRole.entities.AdminLoginAttempt.update(current.id, {
      failed_attempts: 0,
      window_started_at: new Date().toISOString(),
      locked_until: '',
    });
  }
}

export default async function (req: Request): Promise<Response> {
  if (req.method !== 'POST' || !hasExpectedOrigin(req)) {
    return response({ error: 'Forbidden' }, 403);
  }
  if (!req.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    return response({ error: 'Invalid request' }, 400);
  }

  try {
    const base44 = createClientFromRequest(req);

    const rawBody = await req.text();
    if (rawBody.length > 4096) return response({ error: 'Invalid request' }, 400);
    let body;
    try {
      body = JSON.parse(rawBody || '{}');
    } catch {
      return response({ error: 'Invalid request' }, 400);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return response({ error: 'Invalid request' }, 400);
    }
    if (body.action === 'session') {
      const user = await base44.auth.me().catch((error) =>
        error.status === 401 ? null : Promise.reject(error)
      );
      if (user?.role === 'admin') return response({ authenticated: true });
      const secrets = readAdminSecrets();
      if (!secrets) return response({ error: 'Authentication is not configured' }, 503);
      const session = await getAdminSession(req, base44, secrets.sessionSecret);
      if (!session) return response({ error: 'Unauthorized' }, 401);
      return response({ authenticated: true });
    }

    if (body.action === 'logout') {
      const secrets = readAdminSecrets();
      if (!secrets && readCookie(req, ADMIN_SESSION_COOKIE)) {
        return response(
          { error: 'Authentication is not configured' },
          503,
          { 'Set-Cookie': cookieHeader('', 0) }
        );
      }
      const session = secrets
        ? await getAdminSession(req, base44, secrets.sessionSecret)
        : null;
      if (session?.id) {
        await base44.asServiceRole.entities.AdminSession.update(session.id, {
          revoked_at: new Date().toISOString(),
        });
      }
      return response(
        { ok: true },
        200,
        { 'Set-Cookie': cookieHeader('', 0) }
      );
    }

    if (body.action !== 'login' || typeof body.password !== 'string' || body.password.length > 1024) {
      return response({ error: 'Invalid password' }, 401);
    }

    const secrets = readAdminSecrets();
    if (!secrets) return response({ error: 'Authentication is not configured' }, 503);

    const key = await attemptKey(req, secrets.sessionSecret);
    const currentAttempt = await findAttempt(base44, key);
    const now = Date.now();
    const lockedUntil = Date.parse(currentAttempt?.locked_until || '');
    if (Number.isFinite(lockedUntil) && lockedUntil > now) {
      return response(
        { error: 'Invalid password' },
        429,
        { 'Retry-After': String(Math.ceil((lockedUntil - now) / 1000)) }
      );
    }

    const accepted = await verifyAdminPassword(body.password, secrets.password, secrets.sessionSecret);
    if (!accepted) {
      const attempt = nextLoginAttempt(
        currentAttempt,
        now,
        MAX_ATTEMPTS,
        RATE_WINDOW_MS,
        LOCKOUT_MS
      );
      await saveAttempt(base44, currentAttempt, key, attempt);
      return response(
        { error: 'Invalid password' },
        attempt.locked_until ? 429 : 401,
        attempt.locked_until ? { 'Retry-After': String(Math.ceil(LOCKOUT_MS / 1000)) } : {}
      );
    }

    await resetAttempt(base44, currentAttempt);
    const sessionId = crypto.randomUUID();
    const expiresAt = Date.now() + ADMIN_SESSION_LIFETIME_MS;
    await base44.asServiceRole.entities.AdminSession.create({
      session_id: sessionId,
      expires_at: new Date(expiresAt).toISOString(),
      revoked_at: '',
    });
    const token = await signAdminSession(sessionId, expiresAt, secrets.sessionSecret);
    return response(
      { authenticated: true },
      200,
      { 'Set-Cookie': cookieHeader(token, ADMIN_SESSION_LIFETIME_MS / 1000) }
    );
  } catch {
    console.error('adminAuth request failed');
    return response({ error: 'Authentication request failed' }, 500);
  }
}
