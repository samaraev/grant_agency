import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authorizeAdminRequest,
  isActiveAdminSession,
  isAdminAuthorized,
  nextLoginAttempt,
  signAdminSession,
  verifyAdminPassword,
  verifyAdminSessionToken,
} from '../base44/shared/adminAuthCore.js';

const secret = 'a-test-only-session-secret-with-more-than-32-bytes';

test('password verification accepts only the configured password', async () => {
  assert.equal(await verifyAdminPassword('correct horse battery', 'correct horse battery', secret), true);
  assert.equal(await verifyAdminPassword('wrong password', 'correct horse battery', secret), false);
});

test('session tokens are signed and expire', async () => {
  const sessionId = '95efc243-72a4-4d7b-bf9e-90d5d2757a91';
  const expiry = 2_000_000_000_000;
  const token = await signAdminSession(sessionId, expiry, secret);

  assert.deepEqual(await verifyAdminSessionToken(token, secret, expiry - 1), {
    sessionId,
    expiresAt: expiry,
  });
  assert.equal(await verifyAdminSessionToken(`${token.slice(0, -1)}x`, secret, expiry - 1), null);
  assert.equal(await verifyAdminSessionToken(token, secret, expiry), null);

  const activeToken = await verifyAdminSessionToken(token, secret, expiry - 1);
  const record = { expires_at: new Date(expiry).toISOString(), revoked_at: '' };
  assert.equal(isActiveAdminSession(record, activeToken, expiry - 1), true);
  assert.equal(isActiveAdminSession({ ...record, revoked_at: new Date().toISOString() }, activeToken, expiry - 1), false);
});

test('only an admin identity or a validated password session authorizes admin APIs', () => {
  assert.equal(isAdminAuthorized({ role: 'admin' }, false), true);
  assert.equal(isAdminAuthorized({ role: 'user' }, false), false);
  assert.equal(isAdminAuthorized(null, false), false);
  assert.equal(isAdminAuthorized(null, true), true);
});

test('admin API authorization rejects anonymous and non-admin callers', async () => {
  const dependencies = {
    getAdminSession: async () => null,
    hasExpectedOrigin: () => true,
    readAdminSecrets: () => ({ sessionSecret: secret }),
    sessionCookie: 'grant_admin_session',
  };
  const anonymousClient = { auth: { me: async () => { throw { status: 401 }; } } };
  const userClient = { auth: { me: async () => ({ role: 'user' }) } };
  const request = new Request('https://grant-home-inside.base44.app/functions/adminEntity');

  assert.equal((await authorizeAdminRequest(anonymousClient, request, dependencies)).status, 401);
  assert.equal((await authorizeAdminRequest(userClient, request, dependencies)).status, 403);
  assert.equal(await authorizeAdminRequest(
    { auth: { me: async () => ({ role: 'admin' }) } },
    request,
    dependencies
  ), null);
});

test('password sessions require a same-origin request and a valid server session', async () => {
  const dependencies = {
    getAdminSession: async () => ({ id: 'session-record' }),
    hasExpectedOrigin: () => false,
    readAdminSecrets: () => ({ sessionSecret: secret }),
    sessionCookie: 'grant_admin_session',
  };
  const anonymousClient = { auth: { me: async () => { throw { status: 401 }; } } };
  const request = new Request('https://grant-home-inside.base44.app/functions/adminEntity', {
    headers: {
      cookie: 'grant_admin_session=opaque',
      origin: 'https://attacker.example',
    },
  });

  assert.equal((await authorizeAdminRequest(anonymousClient, request, dependencies)).status, 403);
  dependencies.hasExpectedOrigin = () => true;
  assert.equal(await authorizeAdminRequest(anonymousClient, request, dependencies), null);
});

test('login attempts lock out after the configured threshold and reset after the window', () => {
  const now = 1_700_000_000_000;
  const next = nextLoginAttempt(
    { failed_attempts: 4, window_started_at: new Date(now - 1000).toISOString() },
    now,
    5,
    900_000,
    900_000
  );
  assert.equal(next.failed_attempts, 5);
  assert.equal(Date.parse(next.locked_until), now + 900_000);

  const reset = nextLoginAttempt(
    { failed_attempts: 5, window_started_at: new Date(now - 900_000).toISOString() },
    now,
    5,
    900_000,
    900_000
  );
  assert.equal(reset.failed_attempts, 1);
});
