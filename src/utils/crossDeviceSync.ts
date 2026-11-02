export type DevicePlatformType =
  | 'ubuntu-linux'
  | 'android-phone'
  | 'ios-phone'
  | 'desktop-workstation';

export interface ConnectedDeviceNode {
  deviceId: string;
  deviceName: string;
  platform: DevicePlatformType;
  lastSeenIso: string;
  isCurrentDevice?: boolean;
}

export interface SyncedBriefingItem {
  id: string;
  editionId: string;
  dateKey: string;
  title: string;
  summaryHook: string;
  focusPillar: string;
  savedFromPlatform: DevicePlatformType;
  savedAtIso: string;
}

export interface SyncedChatItem {
  id: string;
  role: 'user' | 'assistant';
  modelUsed: string;
  text: string;
  followUpOptions: string[];
  devicePlatform?: DevicePlatformType;
  createdAtIso: string;
}

export interface SharedAccountVault {
  accountId: string;
  syncKey: string;
  displayName: string;
  themeMode: 'obsidian-night' | 'terminal-green';
  selectedPillar: string;
  devices: ConnectedDeviceNode[];
  savedBriefings: SyncedBriefingItem[];
  savedChats: SyncedChatItem[];
  updatedAtIso: string;
}

export interface StoredAccountCredentials {
  accountId: string;
  syncKey: string;
  displayName: string;
}

export const ACCOUNT_STORAGE_KEY = 'nexus7_shared_account_session_v1';
export const DEVICE_ID_STORAGE_KEY = 'nexus7_client_device_id_v1';
export const ACCOUNT_SYNC_EVENT = 'nexus7-shared-account-updated';

/**
 * Detects whether the user is on Ubuntu/Linux, Android Phone, iOS Phone, or Desktop.
 */
export function detectClientPlatform(userAgent: string): {
  platform: DevicePlatformType;
  defaultDeviceName: string;
  badgeLabel: string;
} {
  const ua = (userAgent || '').toLowerCase();

  if (ua.includes('android')) {
    return {
      platform: 'android-phone',
      defaultDeviceName: 'Android Mobile Node',
      badgeLabel: '📱 Android Phone',
    };
  }

  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    return {
      platform: 'ios-phone',
      defaultDeviceName: 'iPhone / iOS Node',
      badgeLabel: '📱 iPhone / iOS',
    };
  }

  if (ua.includes('ubuntu') || (ua.includes('linux') && !ua.includes('android'))) {
    return {
      platform: 'ubuntu-linux',
      defaultDeviceName: ua.includes('ubuntu') ? 'Ubuntu Linux Workstation' : 'Linux Desktop Node',
      badgeLabel: '🐧 Ubuntu / Linux',
    };
  }

  return {
    platform: 'desktop-workstation',
    defaultDeviceName: 'Desktop Command Node',
    badgeLabel: '💻 Desktop Node',
  };
}

/**
 * Normalizes an email or callsign into a clean cross-device account identifier.
 */
export function normalizeAccountIdentity(rawAccount: string, rawSyncKey?: string): {
  valid: boolean;
  accountId: string;
  syncKey: string;
  displayName: string;
  error?: string;
} {
  const trimmedAccount = (rawAccount || '').trim().toLowerCase();
  if (trimmedAccount.length < 3) {
    return {
      valid: false,
      accountId: '',
      syncKey: '',
      displayName: '',
      error: 'Enter an account email or handle (at least 3 characters) to link Ubuntu and Phone.',
    };
  }

  const safeAccountId = trimmedAccount
    .replace(/[^a-z0-9@._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

  const cleanedKey = (rawSyncKey || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const finalSyncKey = cleanedKey.length >= 4 ? cleanedKey.slice(0, 24) : 'NX7-SYNC-CORE';

  const displayName = trimmedAccount.includes('@')
    ? trimmedAccount.split('@')[0]
    : trimmedAccount;

  return {
    valid: true,
    accountId: safeAccountId,
    syncKey: finalSyncKey,
    displayName: displayName.toUpperCase(),
  };
}

/**
 * Builds a 1-click pairing URL so opening the link on Ubuntu or Phone automatically signs into the same account.
 */
export function buildPairingUrl(baseUrl: string, accountId: string, syncKey: string): string {
  const cleanBase = (baseUrl || 'http://localhost:3000').replace(/\/$/, '');
  const params = new URLSearchParams({
    account: accountId,
    syncKey: syncKey,
  });
  return `${cleanBase}/?${params.toString()}`;
}

/**
 * Builds a copyable Ubuntu Terminal CLI command for syncing & viewing the 6-Pillar briefing in bash/zsh.
 */
export function buildUbuntuTerminalCommand(
  baseUrl: string,
  accountId: string,
  syncKey: string
): string {
  const cleanBase = (baseUrl || 'http://localhost:3000').replace(/\/$/, '');
  return `curl -s "${cleanBase}/api/account/ubuntu-cli?account=${encodeURIComponent(accountId)}&syncKey=${encodeURIComponent(syncKey)}"`;
}

export function getOrCreateClientDeviceId(): string {
  if (typeof window === 'undefined') return 'server-node';
  try {
    const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existing) return existing;
    const detected = detectClientPlatform(window.navigator.userAgent);
    const created = `${detected.platform}-${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, created);
    return created;
  } catch {
    return 'browser-node';
  }
}

export function getStoredAccountSession(): StoredAccountCredentials | null {
  if (typeof window === 'undefined') return null;
  try {
    // Also check URL query params for 1-click Ubuntu / Phone pairing links (?account=...&syncKey=...)
    const urlParams = new URLSearchParams(window.location.search);
    const paramAccount = urlParams.get('account');
    const paramKey = urlParams.get('syncKey');
    if (paramAccount) {
      const normalized = normalizeAccountIdentity(paramAccount, paramKey || undefined);
      if (normalized.valid) {
        const creds: StoredAccountCredentials = {
          accountId: normalized.accountId,
          syncKey: normalized.syncKey,
          displayName: normalized.displayName,
        };
        window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(creds));
        return creds;
      }
    }

    const raw = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAccountCredentials;
    if (parsed && parsed.accountId && parsed.syncKey) {
      return parsed;
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

export function saveStoredAccountSession(
  creds: StoredAccountCredentials,
  vault?: SharedAccountVault
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(creds));
    window.dispatchEvent(
      new CustomEvent(ACCOUNT_SYNC_EVENT, {
        detail: { creds, vault: vault || null },
      })
    );
  } catch {
    // Ignore storage errors
  }
}

export function clearStoredAccountSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ACCOUNT_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent(ACCOUNT_SYNC_EVENT, {
        detail: { creds: null, vault: null },
      })
    );
  } catch {
    // Ignore storage errors
  }
}
