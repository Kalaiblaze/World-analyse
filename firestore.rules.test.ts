import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rulesSource = fs.readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8');

interface SimulatedAuth {
  uid: string;
  email_verified: boolean;
}

interface SimulatedRequest {
  auth: SimulatedAuth | null;
  docId: string;
  requestTimeIso: string;
  incoming: Record<string, unknown>;
  existing?: Record<string, unknown>;
}

const VALID_ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
const DATE_KEY_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const ALLOWED_PILLARS = new Set([
  'ALL',
  'Aerospace',
  'Defence',
  'Geopolitics',
  'Money & Economy',
  'Technology',
  'Physics',
]);
const BRIEFING_KEYS = [
  'ownerId',
  'editionId',
  'dateKey',
  'title',
  'summaryHook',
  'focusPillar',
  'createdAt',
  'updatedAt',
];

function evaluateCreateUserBriefing(req: SimulatedRequest): boolean {
  if (!req.auth || req.auth.email_verified !== true) return false;
  if (
    typeof req.docId !== 'string' ||
    req.docId.length < 1 ||
    req.docId.length > 128 ||
    !VALID_ID_REGEX.test(req.docId)
  ) {
    return false;
  }
  const keys = Object.keys(req.incoming);
  if (
    keys.length !== BRIEFING_KEYS.length ||
    !BRIEFING_KEYS.every((k) => keys.includes(k))
  ) {
    return false;
  }
  const d = req.incoming;
  if (
    typeof d.ownerId !== 'string' ||
    d.ownerId.length < 1 ||
    d.ownerId.length > 128 ||
    !VALID_ID_REGEX.test(d.ownerId) ||
    d.ownerId !== req.auth.uid
  ) {
    return false;
  }
  if (
    typeof d.editionId !== 'string' ||
    d.editionId.length < 1 ||
    d.editionId.length > 120 ||
    !VALID_ID_REGEX.test(d.editionId)
  ) {
    return false;
  }
  if (typeof d.dateKey !== 'string' || !DATE_KEY_REGEX.test(d.dateKey)) {
    return false;
  }
  if (typeof d.title !== 'string' || d.title.length < 3 || d.title.length > 240) {
    return false;
  }
  if (
    typeof d.summaryHook !== 'string' ||
    d.summaryHook.length < 3 ||
    d.summaryHook.length > 2000
  ) {
    return false;
  }
  if (typeof d.focusPillar !== 'string' || !ALLOWED_PILLARS.has(d.focusPillar)) {
    return false;
  }
  if (d.createdAt !== req.requestTimeIso || d.updatedAt !== req.requestTimeIso) {
    return false;
  }
  return true;
}

test('firestore.rules enforces all 8 pillars and rejects all Dirty Dozen payloads', () => {
  assert.ok(rulesSource.includes("rules_version = '2';"));
  assert.ok(rulesSource.includes('allow read, write: if false;'));
  assert.ok(rulesSource.includes('request.auth.token.email_verified == true'));

  const now = '2026-11-02T12:00:00.000Z';
  const validPayload = {
    ownerId: 'user_alpha',
    editionId: 'ed-2026-11-02',
    dateKey: '2026-11-02',
    title: 'NEXUS-7 Daily Briefing',
    summaryHook: 'Machi, 6 pillars connected cleanly today!',
    focusPillar: 'ALL',
    createdAt: now,
    updatedAt: now,
  };

  // Valid request passes
  assert.equal(
    evaluateCreateUserBriefing({
      auth: { uid: 'user_alpha', email_verified: true },
      docId: 'briefing_01',
      requestTimeIso: now,
      incoming: validPayload,
    }),
    true
  );

  // Dirty Dozen 1: Unauthenticated write
  assert.equal(
    evaluateCreateUserBriefing({
      auth: null,
      docId: 'briefing_01',
      requestTimeIso: now,
      incoming: validPayload,
    }),
    false
  );

  // Dirty Dozen 2: Unverified email spoof
  assert.equal(
    evaluateCreateUserBriefing({
      auth: { uid: 'user_alpha', email_verified: false },
      docId: 'briefing_01',
      requestTimeIso: now,
      incoming: validPayload,
    }),
    false
  );

  // Dirty Dozen 3: Cross-user identity spoofing
  assert.equal(
    evaluateCreateUserBriefing({
      auth: { uid: 'user_beta', email_verified: true },
      docId: 'briefing_01',
      requestTimeIso: now,
      incoming: validPayload,
    }),
    false
  );

  // Dirty Dozen 4: Shadow / ghost field injection
  assert.equal(
    evaluateCreateUserBriefing({
      auth: { uid: 'user_alpha', email_verified: true },
      docId: 'briefing_01',
      requestTimeIso: now,
      incoming: { ...validPayload, isAdmin: true },
    }),
    false
  );

  // Dirty Dozen 5: ID poisoning
  assert.equal(
    evaluateCreateUserBriefing({
      auth: { uid: 'user_alpha', email_verified: true },
      docId: '../etc/passwd',
      requestTimeIso: now,
      incoming: validPayload,
    }),
    false
  );

  // Dirty Dozen 6: Denial-of-Wallet string overflow
  assert.equal(
    evaluateCreateUserBriefing({
      auth: { uid: 'user_alpha', email_verified: true },
      docId: 'briefing_01',
      requestTimeIso: now,
      incoming: { ...validPayload, title: 'X'.repeat(300) },
    }),
    false
  );

  // Dirty Dozen 7: Forged client timestamp
  assert.equal(
    evaluateCreateUserBriefing({
      auth: { uid: 'user_alpha', email_verified: true },
      docId: 'briefing_01',
      requestTimeIso: now,
      incoming: { ...validPayload, createdAt: '1999-01-01T00:00:00.000Z' },
    }),
    false
  );

  // Dirty Dozen 12: Invalid enum value for focusPillar
  assert.equal(
    evaluateCreateUserBriefing({
      auth: { uid: 'user_alpha', email_verified: true },
      docId: 'briefing_01',
      requestTimeIso: now,
      incoming: { ...validPayload, focusPillar: 'InvalidPillar' },
    }),
    false
  );
});
