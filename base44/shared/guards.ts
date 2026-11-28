import { authorizeAdminRequest } from './adminAuthCore.js';
import {
  ADMIN_SESSION_COOKIE,
  getAdminSession,
  hasExpectedOrigin,
  readAdminSecrets
} from './adminAuthSession.ts';

/**
 * Returns null for a Base44 administrator or a valid password-only admin session.
 */
export async function requireAdmin(base44, request) {
  return authorizeAdminRequest(base44, request, {
    getAdminSession,
    hasExpectedOrigin,
    readAdminSecrets,
    sessionCookie: ADMIN_SESSION_COOKIE
  });
}