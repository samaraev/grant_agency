const encoder = new TextEncoder();

function toBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function fromBase64Url(value) {
  if (!/^[\w-]+$/.test(value)) return null;
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  try {
    return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

export async function verifyAdminPassword(candidate, expected, secret) {
  const [candidateDigest, expectedDigest] = await Promise.all([
    hmac(`admin-password:${candidate}`, secret),
    hmac(`admin-password:${expected}`, secret),
  ]);
  return constantTimeEqual(candidateDigest, expectedDigest);
}

export async function signAdminSession(sessionId, expiresAt, secret) {
  const payload = `${sessionId}.${expiresAt}`;
  const signature = await hmac(`admin-session:${payload}`, secret);
  return `${payload}.${toBase64Url(signature)}`;
}

export async function verifyAdminSessionToken(token, secret, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 256) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [sessionId, expiryText, signatureText] = parts;
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return null;
  if (!/^\d{13}$/.test(expiryText)) return null;

  const expiresAt = Number(expiryText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now) return null;
  const signature = fromBase64Url(signatureText);
  if (!signature || signature.length !== 32) return null;

  const expected = await hmac(`admin-session:${sessionId}.${expiryText}`, secret);
  if (!constantTimeEqual(signature, expected)) return null;
  return { sessionId, expiresAt };
}

export function isActiveAdminSession(session, token, now = Date.now()) {
  return Boolean(
    session &&
    token &&
    !session.revoked_at &&
    Date.parse(session.expires_at || '') === token.expiresAt &&
    token.expiresAt > now
  );
}

export function isAdminAuthorized(user, hasPasswordSession) {
  return user?.role === 'admin' || hasPasswordSession === true;
}

export async function authorizeAdminRequest(
  base44,
  request,
  { getAdminSession, hasExpectedOrigin, readAdminSecrets, sessionCookie }
) {
  const user = await base44.auth.me().catch((error) =>
    error.status === 401 ? null : Promise.reject(error)
  );
  let hasPasswordSession = false;

  if (request && readCookie(request, sessionCookie)) {
    if (!hasExpectedOrigin(request)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const config = readAdminSecrets();
    if (!config) {
      return Response.json({ error: 'Authentication is not configured' }, { status: 503 });
    }
    hasPasswordSession = Boolean(
      await getAdminSession(request, base44, config.sessionSecret)
    );
  }

  if (isAdminAuthorized(user, hasPasswordSession)) return null;
  return Response.json(
    { error: user ? 'Forbidden' : 'Unauthorized' },
    { status: user ? 403 : 401 }
  );
}

export function nextLoginAttempt(current, now, maxAttempts, windowMs, lockMs) {
  const existingStart = Date.parse(current?.window_started_at || '');
  const expiredWindow = !Number.isFinite(existingStart) || now - existingStart >= windowMs;
  const attempts = expiredWindow ? 1 : Number(current?.failed_attempts || 0) + 1;
  const windowStartedAt = expiredWindow ? new Date(now).toISOString() : current.window_started_at;
  const lockedUntil = attempts >= maxAttempts ? new Date(now + lockMs).toISOString() : '';

  return {
    failed_attempts: attempts,
    window_started_at: windowStartedAt,
    locked_until: lockedUntil,
  };
}

export function readCookie(request, name) {
  const cookies = request.headers.get('cookie') || '';
  for (const part of cookies.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim();
    }
  }
  return '';
}
