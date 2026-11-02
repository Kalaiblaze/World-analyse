# NEXUS-7 Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants & Master Source of Truth
- **Zero-PII Storage**: Neither `/user_briefings/{briefingId}` nor `/terminal_chats/{messageId}` stores user PII (`email`, `phone`, `address`). Only the non-PII `ownerId` (`request.auth.uid`) is stored.
- **Strict Ownership**: Every document in `/user_briefings/{briefingId}` and `/terminal_chats/{messageId}` belongs exclusively to `resource.data.ownerId == request.auth.uid`.
- **Verified Identity**: All write operations (`create`, `update`, `delete`) require `request.auth != null && request.auth.token.email_verified == true`.
- **Strict Key Allowlisting**:
  - `UserBriefing` requires and allows ONLY `['ownerId', 'editionId', 'dateKey', 'title', 'summaryHook', 'focusPillar', 'createdAt', 'updatedAt']`.
  - `ChatMessageRecord` requires and allows ONLY `['ownerId', 'role', 'modelUsed', 'text', 'followUpOptions', 'createdAt']`.
- **Temporal Integrity**: `createdAt == request.time` on create; `updatedAt == request.time` and `createdAt == existing().createdAt` on update.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Payload 1 (Unauthenticated Write)**: `auth = null`, creating a `user_briefings` document. -> `PERMISSION_DENIED`
2. **Payload 2 (Unverified Email Spoof)**: `auth.uid = 'user_1'`, `email_verified = false`, creating a `user_briefings` document. -> `PERMISSION_DENIED`
3. **Payload 3 (Cross-User Identity Spoofing)**: `auth.uid = 'user_1'`, `incoming.ownerId = 'user_2'`. -> `PERMISSION_DENIED`
4. **Payload 4 (Shadow / Ghost Field Injection on Create)**: `incoming` includes `isAdmin: true` alongside required fields. -> `PERMISSION_DENIED`
5. **Payload 5 (ID Poisoning / Path Variable Overflow)**: Document ID exceeds 128 chars or contains illegal characters (`../../etc`). -> `PERMISSION_DENIED`
6. **Payload 6 (Denial-of-Wallet String Overflow)**: `title` length > 240 chars or `summaryHook` > 2000 chars. -> `PERMISSION_DENIED`
7. **Payload 7 (Forged Client Timestamp on Create)**: `incoming.createdAt != request.time`. -> `PERMISSION_DENIED`
8. **Payload 8 (Immutable Field Mutation on Update)**: Updating `ownerId` or `createdAt` on `/user_briefings/{briefingId}`. -> `PERMISSION_DENIED`
9. **Payload 9 (Shadow Key Injection on Update)**: Updating `editionId` or injecting `ghostField` during title/summary update. -> `PERMISSION_DENIED`
10. **Payload 10 (Unbounded Array Injection on ChatMessageRecord)**: `followUpOptions` array with > 4 items or non-string first element. -> `PERMISSION_DENIED`
11. **Payload 11 (Unauthorized Cross-User Read/List)**: `auth.uid = 'user_2'` attempting `get` or `list` on `user_1` documents. -> `PERMISSION_DENIED`
12. **Payload 12 (Invalid Enum Value for Pillar/Role)**: `focusPillar = 'HackedPillar'` or `role = 'system_root'`. -> `PERMISSION_DENIED`

## 3. Red Team Audit Conflict Report
- **Identity Spoofing**: Blocked by `data.ownerId == request.auth.uid` on create and `incoming().ownerId == existing().ownerId` on update.
- **State Shortcutting**: Blocked by strict enum checks on `focusPillar` and `role`.
- **Resource Poisoning**: Blocked by `isValidId()` on all single-doc path variables and `.size()` bounds on every string and array.
- **Value Poisoning on Update**: Blocked because `isValidUserBriefing(incoming())` wraps the entire `allow update` block alongside `affectedKeys().hasOnly(['title', 'summaryHook', 'focusPillar', 'updatedAt'])`.
