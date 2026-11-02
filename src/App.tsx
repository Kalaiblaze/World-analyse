/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { TopBar } from './components/TopBar';
import { SpatialPatternObservatory3D } from './components/SpatialPatternObservatory3D';
import { SubstackFeedPanel } from './components/SubstackFeedPanel';
import { ExecutiveSummarySection } from './components/ExecutiveSummarySection';
import { PillarMatrixSection } from './components/PillarMatrixSection';
import { DotConnectingSection } from './components/DotConnectingSection';
import { MasterVerdictSection } from './components/MasterVerdictSection';
import {
  CURATED_BRIEFINGS,
  IntelligenceBriefing,
  PillarId,
  generateDeterministicBriefing,
} from './utils/intelligenceEngine';
import {
  FEATURED_SUBSTACK_DISPATCHES,
  SubstackArticle,
  convertSubstackArticleToBriefing,
} from './utils/substackParser';

export default function App() {
  const [editions, setEditions] = useState<IntelligenceBriefing[]>(CURATED_BRIEFINGS);
  const [activeEditionId, setActiveEditionId] = useState<string>(CURATED_BRIEFINGS[0].editionId);
  const [selectedPillar, setSelectedPillar] = useState<PillarId | 'ALL'>('ALL');

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

  useEffect(() => {
    let cancelled = false;
    fetch('/api/substack/feed')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && Array.isArray(data.articles) && data.articles.length > 0) {
          setSubstackArticles(data.articles);
        }
      })
      .catch(() => {
        // Curated Substack dispatches remain active
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
        scrollToSection('executive-summary');
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
    scrollToSection('executive-summary');
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
        scrollToSection('executive-summary');
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
    scrollToSection('executive-summary');
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
        scrollToSection('executive-summary');
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
    scrollToSection('executive-summary');
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1917]">
      {/* Strict 3-Zone Top Bar */}
      <TopBar
        onNavigate={scrollToSection}
        onOpenSynthesizer={() => scrollToSection('custom-synthesizer')}
      />

      {/* Operational Utility Strip */}
      <div className="bg-[#F3EFE6] border-b border-[#D6CEBE] px-6 lg:px-12 py-2.5 text-xs font-mono-tabular text-[#57534E] flex flex-wrap items-center justify-between gap-4">
        <div>
          <span>3D SPATIAL INTELLIGENCE DESK &amp; SUBSTACK PATTERN MATRIX</span>
          <span aria-hidden="true"> · </span>
          <span>6 PILLARS: AEROSPACE / DEFENCE / GEOPOLITICS / MONEY / TECH / PHYSICS</span>
        </div>
        <div>
          <span>TONE: SHARP THUNGLISH &amp; STREET-SMART ANALOGIES</span>
          <span aria-hidden="true"> · </span>
          <span>LAYERS: PAST / PRESENT / FUTURE (1–10Y)</span>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1320px] mx-auto px-6 lg:px-12">
        {statusNotice && (
          <div
            role="status"
            className="mt-6 p-4 bg-[#F3EFE6] border-2 border-[#9A3412] shadow-[0_4px_0_0_#9A3412] rounded-md flex items-center justify-between gap-4 text-xs font-medium text-[#1C1917]"
          >
            <span>{statusNotice}</span>
            <button
              type="button"
              onClick={() => setStatusNotice(null)}
              className="text-[#9A3412] font-mono-tabular underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Interactive Three.js 3D Spatial Pattern Observatory */}
        <SpatialPatternObservatory3D
          briefing={activeBriefing}
          selectedPillar={selectedPillar}
          onSelectPillar={setSelectedPillar}
        />

        {/* Substack Intelligence Wire & Live Ingestion */}
        <SubstackFeedPanel
          articles={substackArticles}
          activeArticleId={activeSubstackId}
          isSyncingRss={isSyncingRss}
          isDecodingUrl={isDecodingUrl}
          onSelectArticle={handleSelectSubstackArticle}
          onSyncLiveRss={handleSyncLiveRss}
          onDecodeCustomSubstackUrl={handleDecodeCustomSubstackUrl}
        />

        {/* 1. Executive Summary (The Big Picture in Thunglish) */}
        <ExecutiveSummarySection
          briefing={activeBriefing}
          editions={editions}
          onSelectEdition={handleSelectEdition}
          selectedPillar={selectedPillar}
          onSelectPillar={setSelectedPillar}
        />

        {/* 2. Pillar-by-Pillar Breakdown (Aerospace, Defence, Geopolitics, Money, Tech, Physics) */}
        <PillarMatrixSection
          pillars={activeBriefing.pillars}
          selectedPillar={selectedPillar}
          onSelectPillar={setSelectedPillar}
        />

        {/* 3. Dot-Connecting Matrix (How Pillar A links to Pillar B & C) */}
        <DotConnectingSection
          connections={activeBriefing.dotConnections}
          selectedPillar={selectedPillar}
          onSelectPillar={setSelectedPillar}
        />

        {/* 4. The Master Verdict / Takeaway + Custom Signal Synthesizer */}
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
      <footer className="mt-16 border-t border-[#D6CEBE] bg-[#F3EFE6] px-6 lg:px-12 py-8">
        <div className="max-w-[1320px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#57534E]">
          <div>
            <span className="font-editorial font-bold text-[#1C1917]">
              VetriCheck Global Intelligence Desk
            </span>
            <span aria-hidden="true"> · </span>
            <span>Multi-Disciplinary 3D Pattern Recognition Archive</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#spatial-observatory" className="hover:text-[#1C1917] underline-offset-4 hover:underline">
              3D Observatory
            </a>
            <a href="#substack-wire" className="hover:text-[#1C1917] underline-offset-4 hover:underline">
              Substack Wire
            </a>
            <a href="#executive-summary" className="hover:text-[#1C1917] underline-offset-4 hover:underline">
              Executive Summary
            </a>
            <a href="#pillar-breakdown" className="hover:text-[#1C1917] underline-offset-4 hover:underline">
              Six Pillars
            </a>
            <a href="#dot-matrix" className="hover:text-[#1C1917] underline-offset-4 hover:underline">
              Dot Matrix
            </a>
            <a href="#master-verdict" className="hover:text-[#1C1917] underline-offset-4 hover:underline">
              Master Verdict
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
