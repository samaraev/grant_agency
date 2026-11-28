import { secrets } from 'base44:runtime';
import {
  isActiveAdminSession,
  readCookie,
  verifyAdminSessionToken
} from './adminAuthCore.js';

export const ADMIN_SESSION_COOKIE = 'grant_admin_session';
export const ADMIN_SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000;

export function readAdminSecrets() {
  try {
    const password = secrets.get('ADMIN_PASSWORD');
    const sessionSecret = secrets.get('ADMIN_SESSION_SECRET');
    if (!password || !sessionSecret || sessionSecret.length < 32) return null;
    return { password, sessionSecret };
  } catch {
    return null;
  }
}

export function hasExpectedOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  try {
    const originUrl = new URL(origin);
    return originUrl.origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function getAdminSession(request, base44, sessionSecret) {
  const rawToken = readCookie(request, ADMIN_SESSION_COOKIE);
  if (!rawToken) return null;

  const token = await verifyAdminSessionToken(rawToken, sessionSecret);
  if (!token) return null;

  const page = await base44.asServiceRole.entities.AdminSession.filter(
    { session_id: token.sessionId },
    { limit: 1 }
  );
  const session = page?.items?.[0];
  return isActiveAdminSession(session, token) ? session : null;
}
