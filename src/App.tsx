/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { TopBar } from './components/TopBar';
import { ObsidianBentoMatrix } from './components/ObsidianBentoMatrix';
import { EliteBrainDojoSection } from './components/EliteBrainDojoSection';
import { Nexus7CommandCenter } from './components/Nexus7CommandCenter';
import { SpatialPatternObservatory3D } from './components/SpatialPatternObservatory3D';
import { SubstackFeedPanel } from './components/SubstackFeedPanel';
import { ExecutiveSummarySection } from './components/ExecutiveSummarySection';
import { PillarMatrixSection } from './components/PillarMatrixSection';
import { DotConnectingSection } from './components/DotConnectingSection';
import { BioscienceWorkbenchSection } from './components/BioscienceWorkbenchSection';
import { MasterVerdictSection } from './components/MasterVerdictSection';
import { PWAInstallControl } from './components/PWAInstallControl';
import { ThemeToggleControl } from './components/ThemeToggleControl';
import {
  type ThemeMode,
  THEME_STORAGE_KEY,
  applyThemeToRoot,
  getNextThemeMode,
} from './utils/themeEngine';
import {
  CURATED_BRIEFINGS,
  type IntelligenceBriefing,
  PillarId,
  generateDeterministicBriefing,
} from './utils/intelligenceEngine';
import {
  FEATURED_SUBSTACK_DISPATCHES,
  type SubstackArticle,
  convertSubstackArticleToBriefing,
} from './utils/substackParser';
import {
  ACCOUNT_SYNC_EVENT,
  type SharedAccountVault,
  getStoredAccountSession,
} from './utils/crossDeviceSync';

export default function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'terminal-green' || saved === 'obsidian-night') {
        return saved;
      }
    } catch {
      // Ignore storage errors
    }
    return 'obsidian-night';
  });

  useEffect(() => {
    applyThemeToRoot(themeMode);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {
      // Ignore storage errors
    }
  }, [themeMode]);

  useEffect(() => {
    const handleAccountSync = (e: Event) => {
      const custom = e as CustomEvent<{ vault?: SharedAccountVault | null }>;
      const syncedTheme = custom.detail?.vault?.themeMode;
      if (syncedTheme === 'obsidian-night' || syncedTheme === 'terminal-green') {
        setThemeMode(syncedTheme);
      }
    };
    window.addEventListener(ACCOUNT_SYNC_EVENT, handleAccountSync);
    return () => window.removeEventListener(ACCOUNT_SYNC_EVENT, handleAccountSync);
  }, []);

  const handleToggleTheme = (nextMode?: ThemeMode) => {
    setThemeMode((prev) => {
      const resolved = nextMode ?? getNextThemeMode(prev);
      const creds = getStoredAccountSession();
      if (creds) {
        fetch('/api/account/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: creds.accountId,
            syncKey: creds.syncKey,
            themeMode: resolved,
          }),
        }).catch(() => {});
      }
      return resolved;
    });
  };

  const [editions, setEditions] = useState<IntelligenceBriefing[]>(CURATED_BRIEFINGS);
  const [activeEditionId, setActiveEditionId] = useState<string>(CURATED_BRIEFINGS[0].editionId);
  const [selectedPillar, setSelectedPillar] = useState<PillarId | 'ALL'>('ALL');

  // Daily Auto-Update State
  const [dailyDateKey, setDailyDateKey] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [lastDailySyncIso, setLastDailySyncIso] = useState<string>(() =>
    new Date().toISOString()
  );
  const [dailyGroundingLinks, setDailyGroundingLinks] = useState<
    { title: string; uri: string }[]
  >([]);
  const [isSyncingDaily, setIsSyncingDaily] = useState<boolean>(false);

  const [substackArticles, setSubstackArticles] = useState<SubstackArticle[]>(
    FEATURED_SUBSTACK_DISPATCHES
  );
  const [activeSubstackId, setActiveSubstackId] = useState<string | null>(
    FEATURED_SUBSTACK_DISPATCHES[0].id
  );
  const [isSyncingRss, setIsSyncingRss] = useState<boolean>(false);
  const [isDecodingUrl, setIsDecodingUrl] = useState<boolean>(false);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const activeBriefing =
    editions.find((b) => b.editionId === activeEditionId) ?? editions[0];

  const handleSimulateNextFeed = () => {
    const currentIndex = editions.findIndex((e) => e.editionId === activeBriefing.editionId);
    const nextIndex = (currentIndex + 1) % editions.length;
    const nextEdition = editions[nextIndex];
    setActiveEditionId(nextEdition.editionId);
    setSelectedPillar('ALL');
    setStatusNotice(
      `🟢 Simulated Live Intelligence Scenario ${nextIndex + 1}/${editions.length}: "${nextEdition.title}"`
    );
  };

  const syncDailyBriefing = useCallback(async (targetDateKey?: string, showBanner = false) => {
    const dateKeyToFetch = targetDateKey || new Date().toISOString().slice(0, 10);
    setIsSyncingDaily(true);
    try {
      const res = await fetch(
        `/api/intelligence/daily?dateKey=${encodeURIComponent(dateKeyToFetch)}`
      );
      if (res.ok) {
        const data = await res.json();
        const syncedBriefing: IntelligenceBriefing | undefined = data.briefing;
        if (syncedBriefing) {
          setEditions((prev) => {
            const exists = prev.some((e) => e.editionId === syncedBriefing.editionId);
            return exists
              ? prev.map((e) =>
                  e.editionId === syncedBriefing.editionId ? syncedBriefing : e
                )
              : [syncedBriefing, ...prev];
          });
          setActiveEditionId(syncedBriefing.editionId);
        }
        if (Array.isArray(data.groundingLinks)) {
          setDailyGroundingLinks(data.groundingLinks);
        }
        setDailyDateKey(data.dateKey || dateKeyToFetch);
        setLastDailySyncIso(data.syncedAt || new Date().toISOString());
        if (showBanner) {
          setStatusNotice(
            `🟢 [SYSTEM STATUS]: Synced daily 6-pillar intelligence briefing for ${dateKeyToFetch}.`
          );
        }
      }
    } catch {
      // Keep existing curated briefings active
    } finally {
      setIsSyncingDaily(false);
    }
  }, []);

  // Initial mount: Sync daily briefing + Substack feed, and set up automatic daily rollover check
  useEffect(() => {
    let cancelled = false;
    syncDailyBriefing(new Date().toISOString().slice(0, 10), false);

    fetch('/api/substack/feed')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && Array.isArray(data.articles) && data.articles.length > 0) {
          setSubstackArticles(data.articles);
        }
      })
      .catch(() => {});

    // Check every 5 minutes if the date rolled over to a new day so the briefing auto-updates daily
    const intervalId = window.setInterval(() => {
      const currentDay = new Date().toISOString().slice(0, 10);
      setDailyDateKey((prevDay) => {
        if (prevDay !== currentDay) {
          syncDailyBriefing(currentDay, true);
        }
        return currentDay;
      });
    }, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [syncDailyBriefing]);

  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectEdition = (editionId: string) => {
    setActiveEditionId(editionId);
    setSelectedPillar('ALL');
    const matchedSubstack = substackArticles.find((a) => a.briefingId === editionId);
    setActiveSubstackId(matchedSubstack ? matchedSubstack.id : null);
  };

  const handleSelectSubstackArticle = async (article: SubstackArticle) => {
    setActiveSubstackId(article.id);
    setSelectedPillar('ALL');

    try {
      const response = await fetch('/api/substack/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article }),
      });

      if (response.ok) {
        const data = await response.json();
        const decoded: IntelligenceBriefing = data.briefing;
        setEditions((prev) => {
          const exists = prev.some((e) => e.editionId === decoded.editionId);
          return exists
            ? prev.map((e) => (e.editionId === decoded.editionId ? decoded : e))
            : [decoded, ...prev];
        });
        setActiveEditionId(decoded.editionId);
        setStatusNotice(
          `Decoded Substack dispatch: "${article.title}" (${article.publicationName}) across all 6 pillars.`
        );
        scrollToSection('obsidian-bento-matrix');
        return;
      }
    } catch {
      // Fallback to local conversion
    }

    const fallback = convertSubstackArticleToBriefing(article, editions);
    setEditions((prev) => {
      const exists = prev.some((e) => e.editionId === fallback.editionId);
      return exists ? prev : [fallback, ...prev];
    });
    setActiveEditionId(fallback.editionId);
    setStatusNotice(
      `Decoded Substack dispatch: "${article.title}" (${article.publicationName}) across all 6 pillars.`
    );
    scrollToSection('obsidian-bento-matrix');
  };

  const handleSyncLiveRss = async (sourceId: string) => {
    setIsSyncingRss(true);
    setStatusNotice(null);
    try {
      const res = await fetch(
        `/api/substack/feed?sourceId=${encodeURIComponent(sourceId)}&live=true`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.articles) && data.articles.length > 0) {
          setSubstackArticles(data.articles);
          setStatusNotice(
            data.liveFetchedCount > 0
              ? `Synced ${data.liveFetchedCount} live Substack RSS dispatches + curated intelligence archive.`
              : `Verified Substack intelligence feed (${data.articles.length} dispatches ready).`
          );
        }
      }
    } catch {
      setStatusNotice('Substack curated intelligence feed active.');
    } finally {
      setIsSyncingRss(false);
    }
  };

  const handleDecodeCustomSubstackUrl = async (urlOrTopic: string) => {
    setIsDecodingUrl(true);
    setStatusNotice(null);
    try {
      const res = await fetch('/api/substack/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ substackUrl: urlOrTopic }),
      });

      if (res.ok) {
        const data = await res.json();
        const briefing: IntelligenceBriefing = data.briefing;
        const newArticle: SubstackArticle | undefined = data.sourceArticle;

        if (newArticle) {
          setSubstackArticles((prev) => [newArticle, ...prev]);
          setActiveSubstackId(newArticle.id);
        }
        setEditions((prev) => [briefing, ...prev]);
        setActiveEditionId(briefing.editionId);
        setSelectedPillar('ALL');
        setStatusNotice(
          `Decoded Substack source "${urlOrTopic}" into 6-Pillar Thunglish Pattern Matrix.`
        );
        scrollToSection('obsidian-bento-matrix');
        return;
      }
    } catch {
      // Fallback deterministic synthesis
    } finally {
      setIsDecodingUrl(false);
    }

    const fallbackBriefing = generateDeterministicBriefing(
      `Substack Dispatch: ${urlOrTopic}`,
      'ALL'
    );
    setEditions((prev) => [fallbackBriefing, ...prev]);
    setActiveEditionId(fallbackBriefing.editionId);
    setStatusNotice(`Decoded Substack source "${urlOrTopic}" into 6-Pillar Thunglish Pattern Matrix.`);
    scrollToSection('obsidian-bento-matrix');
  };

  const handleSynthesizeCustomSignal = async (
    query: string,
    focusPillar: PillarId | 'ALL'
  ) => {
    setIsSynthesizing(true);
    setStatusNotice(null);
    try {
      const res = await fetch('/api/intelligence/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, focusPillar }),
      });

      if (res.ok) {
        const data = await res.json();
        const newBriefing: IntelligenceBriefing = data.briefing;
        setEditions((prev) => [newBriefing, ...prev]);
        setActiveEditionId(newBriefing.editionId);
        setActiveSubstackId(null);
        setSelectedPillar('ALL');
        setStatusNotice(
          `Synthesized new 6-Pillar Thunglish Briefing for: "${query}".`
        );
        scrollToSection('obsidian-bento-matrix');
        return;
      }
    } catch {
      // Fall through to deterministic builder
    } finally {
      setIsSynthesizing(false);
    }

    const fallback = generateDeterministicBriefing(query, focusPillar);
    setEditions((prev) => [fallback, ...prev]);
    setActiveEditionId(fallback.editionId);
    setActiveSubstackId(null);
    setSelectedPillar('ALL');
    setStatusNotice(`Synthesized new 6-Pillar Thunglish Briefing for: "${query}".`);
    scrollToSection('obsidian-bento-matrix');
  };

  return (
    <div id="top" className="nexus-theme-shell min-h-screen flex flex-col">
      {/* Strict 3-Zone Top Bar */}
      <TopBar
        onNavigate={scrollToSection}
        onOpenSynthesizer={() => scrollToSection('custom-synthesizer')}
      />

      {/* Operational Utility Strip + Theme Toggle + PWA Device Installation Control */}
      <div
        className="border-b px-6 lg:px-12 py-2.5 text-xs font-mono-tabular uppercase flex flex-wrap items-center justify-between gap-4 transition-colors"
        style={{
          backgroundColor: 'var(--nexus-surface)',
          borderColor: 'var(--nexus-border)',
          color: 'var(--nexus-text-secondary)',
        }}
      >
        <div>
          <span className="font-semibold" style={{ color: 'var(--nexus-accent)' }}>
            NEXUS-7 // GLOBAL PATTERN INTELLIGENCE
          </span>
          <span aria-hidden="true"> · </span>
          <span>6 PILLARS: AEROSPACE / DEFENCE / GEOPOLITICS / MONEY / TECH / PHYSICS</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ThemeToggleControl themeMode={themeMode} onToggleTheme={handleToggleTheme} />
          <PWAInstallControl />
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1360px] mx-auto px-6 lg:px-12">
        {statusNotice && (
          <div
            role="status"
            className="mt-6 p-4 rounded-xl flex items-center justify-between gap-4 text-xs font-medium border"
            style={{
              backgroundColor: 'var(--nexus-accent-soft)',
              borderColor: 'var(--nexus-border-strong)',
              color: 'var(--nexus-text-primary)',
            }}
          >
            <span>{statusNotice}</span>
            <button
              type="button"
              onClick={() => setStatusNotice(null)}
              className="font-mono-tabular uppercase underline cursor-pointer shrink-0"
              style={{ color: 'var(--nexus-accent)' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Linear / Raycast Obsidian & Terminal Green Interactive Bento-Grid Matrix */}
        <ObsidianBentoMatrix
          briefing={activeBriefing}
          editions={editions}
          selectedPillar={selectedPillar}
          onSelectPillar={setSelectedPillar}
          onSimulateNextFeed={handleSimulateNextFeed}
          themeMode={themeMode}
          onToggleTheme={handleToggleTheme}
        />

        {/* 4-Part Elite Brain Dojo, Book Wisdom, Titan vs. Titanic Case Study & Charisma Mentor */}
        <EliteBrainDojoSection
          briefing={activeBriefing}
          onSelectPillar={(pillar) => {
            setSelectedPillar(pillar);
            scrollToSection('obsidian-bento-matrix');
          }}
        />

        {/* NEXUS-7 Real-Time Command Center Terminal (System Status, Daily Auto-Sync, Firebase Cloud Vault, Multi-Turn Chat, Search/Maps Grounding, Voice Transcribe, Image & Video Studio) */}
        <Nexus7CommandCenter
          activeBriefing={activeBriefing}
          dailyDateKey={dailyDateKey}
          lastDailySyncIso={lastDailySyncIso}
          dailyGroundingLinks={dailyGroundingLinks}
          isSyncingDaily={isSyncingDaily}
          onSyncDailyBriefing={() => syncDailyBriefing(undefined, true)}
          onSelectPillar={(pillar) => {
            setSelectedPillar(pillar);
            scrollToSection('pillar-breakdown');
          }}
          onSynthesizeSignal={handleSynthesizeCustomSignal}
        />

        {/* Interactive Three.js 3D Spatial Pattern Observatory */}
        <SpatialPatternObservatory3D
          briefing={activeBriefing}
          selectedPillar={selectedPillar}
          onSelectPillar={setSelectedPillar}
        />

        {/* 1. 🎯 Executive Briefing (The Big Picture in Thunglish) */}
        <ExecutiveSummarySection
          briefing={activeBriefing}
          editions={editions}
          onSelectEdition={handleSelectEdition}
          selectedPillar={selectedPillar}
          onSelectPillar={setSelectedPillar}
        />

        {/* 2. 🚀 Interactive Pillar Matrix (Aerospace | Defence | Geopolitics | Money | Tech | Physics) */}
        <PillarMatrixSection
          pillars={activeBriefing.pillars}
          selectedPillar={selectedPillar}
          onSelectPillar={setSelectedPillar}
        />

        {/* 3. 🔗 The Dot-Connecting Web (How everything links together today) */}
        <DotConnectingSection
          connections={activeBriefing.dotConnections}
          selectedPillar={selectedPillar}
          onSelectPillar={setSelectedPillar}
        />

        {/* 4. 🧬 DeepMind & EMBL-EBI Bioscience Intelligence Workbench */}
        <BioscienceWorkbenchSection />

        {/* 5. 📰 Substack Intelligence Wire & Live Ingestion */}
        <SubstackFeedPanel
          articles={substackArticles}
          activeArticleId={activeSubstackId}
          isSyncingRss={isSyncingRss}
          isDecodingUrl={isDecodingUrl}
          onSelectArticle={handleSelectSubstackArticle}
          onSyncLiveRss={handleSyncLiveRss}
          onDecodeCustomSubstackUrl={handleDecodeCustomSubstackUrl}
        />

        {/* 6. 🔮 The Master Verdict / Takeaway + Custom Signal Synthesizer */}
        <MasterVerdictSection
          briefing={activeBriefing}
          isSynthesizing={isSynthesizing}
          onSynthesizeCustomSignal={handleSynthesizeCustomSignal}
          onSelectPillar={(pillar) => {
            setSelectedPillar(pillar);
            scrollToSection('pillar-breakdown');
          }}
        />
      </main>

      {/* Clean Editorial Footer */}
      <footer
        className="mt-16 border-t px-6 lg:px-12 py-8 transition-colors"
        style={{
          backgroundColor: 'var(--nexus-surface)',
          borderColor: 'var(--nexus-border)',
          color: 'var(--nexus-text-secondary)',
        }}
      >
        <div className="max-w-[1320px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div>
            <span className="font-editorial font-bold" style={{ color: 'var(--nexus-text-primary)' }}>
              NEXUS-7 // VetriCheck Global Intelligence Terminal
            </span>
            <span aria-hidden="true"> · </span>
            <span>Daily Auto-Updated 6-Pillar 3D Pattern Recognition Matrix</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#nexus7-terminal" className="underline-offset-4 hover:underline">
              NEXUS-7 Terminal
            </a>
            <a href="#spatial-observatory" className="underline-offset-4 hover:underline">
              3D Observatory
            </a>
            <a href="#executive-summary" className="underline-offset-4 hover:underline">
              Executive Briefing
            </a>
            <a href="#pillar-breakdown" className="underline-offset-4 hover:underline">
              Six Pillars
            </a>
            <a href="#dot-matrix" className="underline-offset-4 hover:underline">
              Dot-Connecting Web
            </a>
            <a href="#bioscience-workbench" className="underline-offset-4 hover:underline">
              Bioscience Lab
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
