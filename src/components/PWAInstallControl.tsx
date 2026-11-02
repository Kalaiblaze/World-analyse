import React, { useCallback, useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  KeyRound,
  Laptop,
  Link2,
  LogOut,
  RefreshCw,
  Share,
  Smartphone,
  Terminal,
  WifiOff,
  X,
} from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../utils/usePWAInstall';
import {
  ACCOUNT_SYNC_EVENT,
  type SharedAccountVault,
  type StoredAccountCredentials,
  buildPairingUrl,
  buildUbuntuTerminalCommand,
  clearStoredAccountSession,
  detectClientPlatform,
  getOrCreateClientDeviceId,
  getStoredAccountSession,
  saveStoredAccountSession,
} from '../utils/crossDeviceSync';

const STANDALONE_APP_URL =
  'https://ais-pre-2tho74o6drejgzjfa2yydu-726094773231.asia-northeast1.run.app';

export const PWAInstallControl: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isInIframe, promptInstall } = usePWAInstall();
  const isOnline = useOnlineStatus();

  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const clientPlatformInfo = detectClientPlatform(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  );

  const [activeTab, setActiveTab] = useState<'ubuntu' | 'android' | 'ios' | 'desktop'>(
    clientPlatformInfo.platform === 'ubuntu-linux'
      ? 'ubuntu'
      : isIOS
        ? 'ios'
        : 'ubuntu'
  );

  // Shared Cross-Device Account State (Ubuntu + Phone)
  const [accountCreds, setAccountCreds] = useState<StoredAccountCredentials | null>(() =>
    getStoredAccountSession()
  );
  const [accountInput, setAccountInput] = useState<string>(
    () => getStoredAccountSession()?.accountId || 'commander@ubuntu-nexus7.io'
  );
  const [syncKeyInput, setSyncKeyInput] = useState<string>(
    () => getStoredAccountSession()?.syncKey || 'NX7-SYNC-CORE'
  );
  const [sharedVault, setSharedVault] = useState<SharedAccountVault | null>(null);
  const [isSyncingAccount, setIsSyncingAccount] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const targetUrl =
    typeof window !== 'undefined' && !isInIframe
      ? window.location.origin
      : STANDALONE_APP_URL;

  const syncWithServer = useCallback(
    async (targetAccount: string, targetSyncKey: string, persistToStorage = true) => {
      setIsSyncingAccount(true);
      setSyncError(null);
      try {
        const deviceId = getOrCreateClientDeviceId();
        const detected = detectClientPlatform(
          typeof navigator !== 'undefined' ? navigator.userAgent : ''
        );
        const res = await fetch('/api/account/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountInput: targetAccount,
            syncKeyInput: targetSyncKey,
            deviceId,
            deviceName: detected.defaultDeviceName,
            platform: detected.platform,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSyncError(data.error || 'Could not link cross-device account.');
          return;
        }
        const vault: SharedAccountVault = data.vault;
        setSharedVault(vault);
        const creds: StoredAccountCredentials = {
          accountId: vault.accountId,
          syncKey: vault.syncKey,
          displayName: vault.displayName,
        };
        setAccountCreds(creds);
        setAccountInput(vault.accountId);
        setSyncKeyInput(vault.syncKey);
        if (persistToStorage) {
          saveStoredAccountSession(creds, vault);
        }
      } catch {
        setSyncError('Offline or unable to reach cross-device sync server.');
      } finally {
        setIsSyncingAccount(false);
      }
    },
    []
  );

  // Automatically sync if URL params (?account=...&syncKey=...) or stored session exists
  useEffect(() => {
    const initial = getStoredAccountSession();
    if (initial) {
      syncWithServer(initial.accountId, initial.syncKey, false);
    }

    const handleAccountEvent = (e: Event) => {
      const custom = e as CustomEvent<{
        creds: StoredAccountCredentials | null;
        vault: SharedAccountVault | null;
      }>;
      if (custom.detail?.creds) {
        setAccountCreds(custom.detail.creds);
        setAccountInput(custom.detail.creds.accountId);
        setSyncKeyInput(custom.detail.creds.syncKey);
        if (custom.detail.vault) {
          setSharedVault(custom.detail.vault);
        }
      } else {
        setAccountCreds(null);
        setSharedVault(null);
      }
    };

    window.addEventListener(ACCOUNT_SYNC_EVENT, handleAccountEvent);
    return () => {
      window.removeEventListener(ACCOUNT_SYNC_EVENT, handleAccountEvent);
    };
  }, [syncWithServer]);

  const handleConnectAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await syncWithServer(accountInput, syncKeyInput, true);
  };

  const handleDisconnectAccount = () => {
    clearStoredAccountSession();
    setAccountCreds(null);
    setSharedVault(null);
  };

  const handleCopyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      setCopiedKey(null);
    }
  };

  const activeAccountId = accountCreds?.accountId || accountInput || 'commander@ubuntu-nexus7.io';
  const activeSyncKey = accountCreds?.syncKey || syncKeyInput || 'NX7-SYNC-CORE';
  const pairingUrl = buildPairingUrl(targetUrl, activeAccountId, activeSyncKey);
  const ubuntuCliCommand = buildUbuntuTerminalCommand(targetUrl, activeAccountId, activeSyncKey);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        {!isOnline && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-mono-tabular font-semibold">
            <WifiOff className="w-3.5 h-3.5" />
            OFFLINE ARCHIVE MODE
          </span>
        )}

        {accountCreds && (
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono-tabular font-semibold cursor-pointer hover:bg-emerald-500/25 transition-colors"
            title="Ubuntu Linux & Phone linked to same account"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              🐧📱 LINKED: {accountCreds.displayName} ({sharedVault?.devices.length || 2} NODES)
            </span>
          </button>
        )}

        {isInstalled && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono-tabular font-semibold">
            <Check className="w-3.5 h-3.5" />
            PWA INSTALLED
          </span>
        )}

        <button
          type="button"
          onClick={() => setShowGuideModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-tabular font-semibold transition-all cursor-pointer border"
          style={{
            backgroundColor: 'var(--nexus-accent-soft)',
            borderColor: 'var(--nexus-border-strong)',
            color: 'var(--nexus-text-primary)',
          }}
        >
          <Terminal className="w-3.5 h-3.5" style={{ color: 'var(--nexus-accent)' }} />
          <span>Ubuntu + Phone Account Sync</span>
        </button>
      </div>

      {showGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <div className="w-full max-w-2xl bg-[#0B0F19] text-[#F8FAFC] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#111827] px-6 py-4 flex items-center justify-between gap-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center font-display font-bold text-sm text-cyan-300">
                  🐧📱
                </div>
                <div>
                  <div className="text-[11px] font-mono-tabular uppercase tracking-widest text-cyan-400">
                    UNIFIED MULTI-NODE BRIDGE · UBUNTU LINUX + PHONE
                  </div>
                  <h2
                    id="pwa-install-modal-title"
                    className="font-display font-bold text-lg leading-tight text-white"
                  >
                    Connect Ubuntu Linux & Phone on the Same Account
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Close Ubuntu and Phone account sync guide"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto text-left normal-case">
              {/* STEP 1: Shared Account Sign-In / Pairing */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono-tabular font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    Step 1 · Link Same Account Across Ubuntu & Phone
                  </span>
                  <span className="text-[11px] font-mono-tabular px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                    Detected This Device: {clientPlatformInfo.badgeLabel}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter the same <strong>Account Handle / Email</strong> and <strong>Sync Passkey</strong> on your <strong>Ubuntu Linux PC</strong> and on your <strong>Phone</strong>. Your saved 6-pillar briefings, theme mode, and terminal chats sync across both devices automatically.
                </p>

                <form onSubmit={handleConnectAccountSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-5">
                    <label htmlFor="shared-account-id-input" className="sr-only">
                      Shared Account Email or Callsign
                    </label>
                    <input
                      id="shared-account-id-input"
                      type="text"
                      value={accountInput}
                      onChange={(e) => setAccountInput(e.target.value)}
                      placeholder="e.g. machi@ubuntu-nexus7.io"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono-tabular text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="shared-sync-key-input" className="sr-only">
                      Sync Passkey
                    </label>
                    <input
                      id="shared-sync-key-input"
                      type="text"
                      value={syncKeyInput}
                      onChange={(e) => setSyncKeyInput(e.target.value)}
                      placeholder="NX7-SYNC-CORE"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono-tabular text-amber-300 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-4 flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isSyncingAccount}
                      className="flex-1 py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono-tabular font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAccount ? 'animate-spin' : ''}`} />
                      <span>{accountCreds ? 'Sync Now' : 'Link Account'}</span>
                    </button>
                    {accountCreds && (
                      <button
                        type="button"
                        onClick={handleDisconnectAccount}
                        aria-label="Unlink shared account"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 cursor-pointer"
                        title="Disconnect Account"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </form>

                {syncError && (
                  <div className="text-xs text-amber-300 font-mono-tabular bg-amber-500/10 border border-amber-500/30 rounded px-3 py-1.5">
                    {syncError}
                  </div>
                )}

                {/* Connected Nodes Status Pill Grid */}
                {sharedVault && (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono-tabular text-emerald-400">
                      <span>
                        🟢 ACTIVE ACCOUNT VAULT: {sharedVault.accountId} ({sharedVault.savedBriefings.length} Saved Briefings)
                      </span>
                      <span>{sharedVault.devices.length} NODES LINKED</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sharedVault.devices.map((node) => (
                        <div
                          key={node.deviceId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono-tabular text-slate-200"
                        >
                          <span>
                            {node.platform === 'ubuntu-linux'
                              ? '🐧'
                              : node.platform === 'android-phone' || node.platform === 'ios-phone'
                                ? '📱'
                                : '💻'}
                          </span>
                          <span className="font-semibold text-cyan-300">{node.deviceName}</span>
                          <span className="text-emerald-400">● SYNCED</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: 1-Click Pairing Link for Phone & Ubuntu Browser */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono-tabular font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" />
                    Step 2 · 1-Click Magic Pairing Link (Open on Phone or Ubuntu)
                  </span>
                  {isInIframe && (
                    <span className="text-[11px] font-mono-tabular text-slate-400">
                      Auto-signs into {activeAccountId}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Open this link on your <strong>Ubuntu browser</strong> (Firefox / Chrome / Brave) and on your <strong>Phone</strong> (Chrome / Safari). It automatically signs both devices into <strong>{activeAccountId}</strong>:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pairingUrl}
                    aria-label="1-Click Ubuntu and Phone Account Pairing Link"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono-tabular text-cyan-300 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyText(pairingUrl, 'pairing-url')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono-tabular font-bold transition-colors cursor-pointer shrink-0"
                  >
                    {copiedKey === 'pairing-url' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied Link</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Pairing Link</span>
                      </>
                    )}
                  </button>
                </div>

                {isInstallable && !isInIframe && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        const accepted = await promptInstall();
                        if (accepted) setShowGuideModal(false);
                      }}
                      className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono-tabular uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Trigger One-Click Native App Install Now</span>
                    </button>
                  </div>
                )}
              </div>

              {/* STEP 3: Platform Instructions (Ubuntu Linux, Android, iPhone, Desktop) */}
              <div className="space-y-3">
                <div className="text-xs font-mono-tabular font-bold uppercase tracking-wider text-slate-400">
                  Step 3 · Setup Guide for Ubuntu Linux & Phone
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ubuntu')}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono-tabular font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      activeTab === 'ubuntu'
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>🐧 Ubuntu Linux</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('android')}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono-tabular font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      activeTab === 'android'
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>📱 Android Phone</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ios')}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono-tabular font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      activeTab === 'ios'
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <Share className="w-3.5 h-3.5" />
                    <span>🍏 iPhone / iOS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('desktop')}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono-tabular font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      activeTab === 'desktop'
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>💻 Desktop PWA</span>
                  </button>
                </div>

                {activeTab === 'ubuntu' && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs text-slate-200">
                    <div className="font-mono-tabular font-bold text-cyan-400 uppercase">
                      Option A · Ubuntu GNOME Desktop App (Chrome / Brave / Chromium)
                    </div>
                    <ol className="space-y-1.5 list-decimal list-inside text-slate-300">
                      <li>
                        Open the <strong>1-Click Pairing Link</strong> above in <strong>Chrome, Brave, or Chromium</strong> on your Ubuntu desktop.
                      </li>
                      <li>
                        Click the <strong>Install icon</strong> in the right side of the address bar (or <strong>Menu ⋮ ➔ Save and Share ➔ Install NEXUS-7</strong>).
                      </li>
                      <li>
                        NEXUS-7 launches as a native Ubuntu window in your GNOME Dock / Application Launcher synced to <strong>{activeAccountId}</strong>.
                      </li>
                    </ol>

                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="font-mono-tabular font-bold text-emerald-400 uppercase">
                        Option B · Ubuntu Terminal CLI Sync (`gnome-terminal` / `bash` / `zsh`)
                      </div>
                      <p className="text-slate-400">
                        Run this command in your Ubuntu terminal to register your Ubuntu CLI node and stream today&apos;s 6-Pillar briefing + saved account vault:
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={ubuntuCliCommand}
                          aria-label="Ubuntu Terminal CLI Sync Command"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-[11px] font-mono-tabular text-emerald-300 select-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopyText(ubuntuCliCommand, 'ubuntu-cli')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono-tabular font-bold cursor-pointer shrink-0"
                        >
                          {copiedKey === 'ubuntu-cli' ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied CLI</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy CLI</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'android' && (
                  <ol className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs text-slate-200 list-decimal list-inside">
                    <li>
                      Open the <strong>1-Click Pairing Link</strong> in <strong>Google Chrome</strong> on your Android phone (this automatically logs into <strong>{activeAccountId}</strong>).
                    </li>
                    <li>
                      Tap the <strong>three-dot menu (⋮)</strong> in the top-right corner of Chrome and select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                    </li>
                    <li>
                      Launch <strong>NEXUS-7</strong> from your phone home screen — all briefings and chats saved on your Ubuntu PC appear immediately on your phone!
                    </li>
                  </ol>
                )}

                {activeTab === 'ios' && (
                  <ol className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs text-slate-200 list-decimal list-inside">
                    <li>
                      Open the <strong>1-Click Pairing Link</strong> in <strong>Safari</strong> on your iPhone or iPad (auto-links account <strong>{activeAccountId}</strong>).
                    </li>
                    <li>
                      Tap the <strong>Share</strong> button at the bottom of Safari and tap <strong>Add to Home Screen</strong>.
                    </li>
                    <li>
                      Open <strong>NEXUS-7</strong> from your home screen and verify your shared account badge shows <strong>🐧📱 LINKED</strong>.
                    </li>
                  </ol>
                )}

                {activeTab === 'desktop' && (
                  <ol className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs text-slate-200 list-decimal list-inside">
                    <li>
                      Open the <strong>1-Click Pairing Link</strong> in Chrome, Edge, or Brave on Ubuntu, macOS, or Windows.
                    </li>
                    <li>
                      Click the <strong>Install icon</strong> in the browser address bar to install as a standalone desktop app with offline caching.
                    </li>
                  </ol>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#111827] px-6 py-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono-tabular">
                CROSS-DEVICE VAULT + WORKBOX PWA SERVICE WORKER ACTIVE
              </span>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono-tabular font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
