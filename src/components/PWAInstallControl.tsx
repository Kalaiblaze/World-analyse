import React, { useState } from 'react';
import { Check, Copy, Download, Laptop, Share, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../utils/usePWAInstall';

const STANDALONE_APP_URL =
  'https://ais-pre-2tho74o6drejgzjfa2yydu-726094773231.asia-northeast1.run.app';

export const PWAInstallControl: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isInIframe, promptInstall } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>(
    isIOS ? 'ios' : 'android'
  );

  const targetUrl =
    typeof window !== 'undefined' && !isInIframe
      ? window.location.origin
      : STANDALONE_APP_URL;

  const handleInstallClick = async () => {
    if (isInstallable && !isInIframe) {
      const installed = await promptInstall();
      if (installed) return;
    }
    setShowGuideModal(true);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      setCopiedUrl(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {!isOnline && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#B45309]/15 border border-[#B45309]/40 text-[#9A3412] text-[11px] font-mono-tabular font-semibold">
            <WifiOff className="w-3.5 h-3.5" />
            OFFLINE ARCHIVE MODE
          </span>
        )}

        {isInstalled ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#15803D]/15 border border-[#15803D]/40 text-[#15803D] text-[11px] font-mono-tabular font-semibold">
            <Check className="w-3.5 h-3.5" />
            INSTALLED ON DEVICE
          </span>
        ) : (
          <button
            type="button"
            onClick={handleInstallClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1C1917] hover:bg-[#9A3412] text-[#FBF9F5] border border-[#1C1917] shadow-[0_2px_0_0_#9A3412] text-xs font-mono-tabular font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Install on Phone / Device</span>
          </button>
        )}
      </div>

      {showGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/75 backdrop-blur-xs"
        >
          <div className="w-full max-w-xl bg-[#FBF9F5] text-[#1C1917] border-2 border-[#1C1917] rounded-xl shadow-[0_12px_0_0_#1C1917] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#1C1917] text-[#FBF9F5] px-6 py-4 flex items-center justify-between gap-4 border-b border-[#D6CEBE]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#9A3412] border border-[#F59E0B]/50 flex items-center justify-center font-editorial font-bold text-lg text-[#FBF9F5]">
                  V
                </div>
                <div>
                  <div className="text-[11px] font-mono-tabular uppercase tracking-widest text-[#F59E0B]">
                    PWA STANDALONE DEPLOYMENT
                  </div>
                  <h2
                    id="pwa-install-modal-title"
                    className="font-editorial font-bold text-lg leading-tight"
                  >
                    Install VetriCheck on Your Phone or Device
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Close installation guide"
                className="p-1.5 rounded-lg text-[#D6CEBE] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Step 1: Standalone URL Box (crucial when inside preview iframe or sharing to phone) */}
              <div className="p-4 rounded-lg bg-[#F3EFE6] border border-[#D6CEBE] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono-tabular font-semibold uppercase tracking-wider text-[#9A3412]">
                    Step 1 · Open Direct App Link on Your Phone / Browser
                  </span>
                  {isInIframe && (
                    <span className="text-[11px] font-mono-tabular text-[#57534E]">
                      Required outside preview frame
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  Browsers block home-screen installation inside embedded preview frames. Copy or open this standalone URL directly in <strong>Chrome (Android/Desktop)</strong> or <strong>Safari (iPhone/iPad)</strong>:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={targetUrl}
                    aria-label="Standalone Application URL"
                    className="flex-1 bg-[#FBF9F5] border border-[#D6CEBE] rounded px-3 py-2 text-xs font-mono-tabular text-[#1C1917] select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-[#1C1917] hover:bg-[#9A3412] text-[#FBF9F5] text-xs font-mono-tabular font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#4ADE80]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>

                {isInstallable && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const accepted = await promptInstall();
                        if (accepted) setShowGuideModal(false);
                      }}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#9A3412] hover:bg-[#7C2D12] text-white font-semibold text-xs font-mono-tabular uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_3px_0_0_#1C1917] cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Trigger One-Click Native Install Now</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Platform Tabs */}
              <div className="space-y-3">
                <div className="text-xs font-mono-tabular font-semibold uppercase tracking-wider text-[#57534E]">
                  Step 2 · Follow Your Device Instructions
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('android')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      activeTab === 'android'
                        ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                        : 'bg-[#F3EFE6] text-[#57534E] border-[#D6CEBE] hover:text-[#1C1917]'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Android</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ios')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      activeTab === 'ios'
                        ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                        : 'bg-[#F3EFE6] text-[#57534E] border-[#D6CEBE] hover:text-[#1C1917]'
                    }`}
                  >
                    <Share className="w-3.5 h-3.5" />
                    <span>iPhone / iPad</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('desktop')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      activeTab === 'desktop'
                        ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                        : 'bg-[#F3EFE6] text-[#57534E] border-[#D6CEBE] hover:text-[#1C1917]'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Desktop</span>
                  </button>
                </div>

                {activeTab === 'android' && (
                  <ol className="p-4 rounded-lg bg-white border border-[#D6CEBE] space-y-2.5 text-xs text-[#1C1917] list-decimal list-inside">
                    <li>
                      Open the copied link in <strong>Google Chrome</strong> on your Android phone.
                    </li>
                    <li>
                      Tap the <strong>Install on Phone / Device</strong> button at the top of the app, OR tap the <strong>three-dot menu (⋮)</strong> in the top-right corner of Chrome.
                    </li>
                    <li>
                      Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                    </li>
                    <li>
                      Tap <strong>Install</strong> to launch VetriCheck as a full-screen standalone intelligence desk on your home screen.
                    </li>
                  </ol>
                )}

                {activeTab === 'ios' && (
                  <ol className="p-4 rounded-lg bg-white border border-[#D6CEBE] space-y-2.5 text-xs text-[#1C1917] list-decimal list-inside">
                    <li>
                      Open the copied link in <strong>Safari</strong> on your iPhone or iPad (iOS requires Safari for home-screen web apps).
                    </li>
                    <li>
                      Tap the <strong>Share</strong> button (the square with an upward arrow) at the bottom of Safari.
                    </li>
                    <li>
                      Scroll down the share sheet and tap <strong>Add to Home Screen</strong>.
                    </li>
                    <li>
                      Tap <strong>Add</strong> in the top-right corner. VetriCheck will appear on your home screen with its custom icon and open in full-screen standalone mode.
                    </li>
                  </ol>
                )}

                {activeTab === 'desktop' && (
                  <ol className="p-4 rounded-lg bg-white border border-[#D6CEBE] space-y-2.5 text-xs text-[#1C1917] list-decimal list-inside">
                    <li>
                      Open the copied link in a new tab in <strong>Chrome</strong>, <strong>Edge</strong>, or <strong>Brave</strong> on your Mac or Windows PC.
                    </li>
                    <li>
                      Click the <strong>Install icon</strong> (monitor with a downward arrow) on the right side of the browser address bar, OR click <strong>Install on Phone / Device</strong> inside the app.
                    </li>
                    <li>
                      Confirm by clicking <strong>Install</strong> to pin VetriCheck to your Dock, Taskbar, or Desktop with offline caching enabled.
                    </li>
                  </ol>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#F3EFE6] px-6 py-3 border-t border-[#D6CEBE] flex items-center justify-between text-xs text-[#57534E]">
              <span className="font-mono-tabular">
                PWA MANIFEST + WORKBOX SERVICE WORKER ACTIVE
              </span>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-1.5 rounded bg-[#1C1917] text-[#FBF9F5] font-mono-tabular font-semibold cursor-pointer"
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
