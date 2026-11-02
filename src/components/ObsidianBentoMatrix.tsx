import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Clock,
  Cpu,
  Download,
  Flame,
  Globe2,
  Layers,
  Network,
  Orbit,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  ALL_PILLARS,
  type IntelligenceBriefing,
  type PillarAnalysis,
  PillarId,
} from '../utils/intelligenceEngine';
import { type ThemeMode } from '../utils/themeEngine';

interface ObsidianBentoMatrixProps {
  briefing: IntelligenceBriefing;
  editions: IntelligenceBriefing[];
  selectedPillar: PillarId | 'ALL';
  onSelectPillar: (pillar: PillarId | 'ALL') => void;
  onSimulateNextFeed: () => void;
  themeMode?: ThemeMode;
  onToggleTheme?: (nextMode?: ThemeMode) => void;
}

type CardTemporalTab = 'PAST' | 'PRESENT' | 'FUTURE';

interface DomainVisualConfig {
  hex: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  glowRing: string;
  shortLabel: string;
  dudaHartFeatures: string[];
  dudaHartDecisionRule: string;
}

export const DOMAIN_STYLE_MAP: Record<PillarId, DomainVisualConfig> = {
  [PillarId.AEROSPACE]: {
    hex: '#38BDF8',
    badgeBg: 'rgba(56, 189, 248, 0.12)',
    badgeBorder: 'rgba(56, 189, 248, 0.38)',
    badgeText: '#38BDF8',
    glowRing: '0 0 28px -4px rgba(56, 189, 248, 0.45)',
    shortLabel: 'AEROSPACE',
    dudaHartFeatures: [
      'x₁: Orbital Altitude Floor = 265 km (VLEO regime vs 550 km legacy LEO)',
      'x₂: Radar Return SNR Gain = +12.4 dB (inverse fourth-power range law)',
      'x₃: Hall-Thruster Propellant Mass Fraction = 0.00 (atmosphere-breathing N₂/O₂)',
    ],
    dudaHartDecisionRule:
      'g(x) = w₁·SNR_dB + w₂·(Isp_eff) − λ·(Drag_Decay) > θ_orbital ⇒ Classify as Permanent VLEO Dominance Shift (Reject transient LEO satellite launch noise).',
  },
  [PillarId.DEFENCE]: {
    hex: '#F43F5E',
    badgeBg: 'rgba(244, 63, 94, 0.12)',
    badgeBorder: 'rgba(244, 63, 94, 0.38)',
    badgeText: '#F43F5E',
    glowRing: '0 0 28px -4px rgba(244, 63, 94, 0.45)',
    shortLabel: 'DEFENCE',
    dudaHartFeatures: [
      'x₁: Mid-Course Hypersonic Glide Custody = 94.8% continuous track lock',
      'x₂: Bistatic Top-Down Radar Cross-Section (RCS) = +18 dBsm vs ground horizon',
      'x₃: Interceptor-to-Target Cost Ratio = 1 : 14 (attritable loyal-wingman swarm)',
    ],
    dudaHartDecisionRule:
      'g(x) = P(Track_Lock | VLEO_Illumination) · (Cost_Target / Cost_Interceptor) > 10.0 ⇒ Classify as Air-Denial Doctrine Inversion.',
  },
  [PillarId.GEOPOLITICS]: {
    hex: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    badgeBorder: 'rgba(245, 158, 11, 0.38)',
    badgeText: '#F59E0B',
    glowRing: '0 0 28px -4px rgba(245, 158, 11, 0.45)',
    shortLabel: 'GEOPOLITICS',
    dudaHartFeatures: [
      'x₁: Export-Controlled CVD Diamond & GaN Reactor Share = 38% of global capacity',
      'x₂: Equatorial Launch Inclination Delta-V Advantage = +14.6% payload mass bonus',
      'x₃: Sub-Sea Cable Chokepoint Bypass Ratio = 47% lower latency via 1550nm laser mesh',
    ],
    dudaHartDecisionRule:
      'g(x) = Chokepoint_Concentration(CVD_Diamond) × Equatorial_Access_Index > θ_sovereign ⇒ Classify as New Resource Chokepoint Alignment.',
  },
  [PillarId.MONEY]: {
    hex: '#10B981',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    badgeBorder: 'rgba(16, 185, 129, 0.38)',
    badgeText: '#10B981',
    glowRing: '0 0 28px -4px rgba(16, 185, 129, 0.45)',
    shortLabel: 'MONEY & ECONOMY',
    dudaHartFeatures: [
      'x₁: Institutional Hard-Tech Foundry Valuation Spread = 22.4x vs 14.8x SaaS EV/EBITDA',
      'x₂: Sovereign Deep-Tech CapEx Rotation = $418.4B (+24.6% YoY)',
      'x₃: Tier-2 Wafer Equipment Book-to-Bill Ratio = 1.42x (structural backlog expansion)',
    ],
    dudaHartDecisionRule:
      'g(x) = (EV_EBITDA_Foundry − EV_EBITDA_SaaS) + β·(BookToBill − 1.25) > 0 ⇒ Trigger Multi-Year Capital Rotation Signal into Physical Atoms.',
  },
  [PillarId.TECH]: {
    hex: '#8B5CF6',
    badgeBg: 'rgba(139, 92, 246, 0.12)',
    badgeBorder: 'rgba(139, 92, 246, 0.38)',
    badgeText: '#8B5CF6',
    glowRing: '0 0 28px -4px rgba(139, 92, 246, 0.45)',
    shortLabel: 'TECHNOLOGY',
    dudaHartFeatures: [
      'x₁: Orbital Onboard NPU Target Triage Latency = 14.2 ms (vs 180 min ground downlink)',
      'x₂: Raw SAR-to-Tactical Packet Compression Ratio = 99.4% bandwidth reduction',
      'x₃: 3D Chiplet Rad-Hard SEU Fault Tolerance = 10⁻⁹ errors/bit-day',
    ],
    dudaHartDecisionRule:
      'g(x) = (Latency_Ground / Latency_Orbital) · Compression_Factor > 10³ ⇒ Classify as Autonomous Edge-Inference Singularity.',
  },
  [PillarId.PHYSICS]: {
    hex: '#D946EF',
    badgeBg: 'rgba(217, 70, 239, 0.12)',
    badgeBorder: 'rgba(217, 70, 239, 0.38)',
    badgeText: '#D946EF',
    glowRing: '0 0 28px -4px rgba(217, 70, 239, 0.45)',
    shortLabel: 'PHYSICS',
    dudaHartFeatures: [
      'x₁: GaN-on-Diamond Interfacial Phonon Bridge = 2.1 nm (SAB atomic weld)',
      'x₂: Substrate Thermal Conductivity = 1,850 W/m·K (+310% vs legacy SiC)',
      'x₃: Continuous-Wave RF Power Density = 3.1x baseline without liquid cooling',
    ],
    dudaHartDecisionRule:
      'g(x) = κ_diamond / R_Kapitza > θ_phonon ⇒ Classify as Fundamental Solid-State Thermal Breakthrough.',
  },
};

const CHAIN_ORDER: PillarId[] = [
  PillarId.PHYSICS,
  PillarId.TECH,
  PillarId.AEROSPACE,
  PillarId.DEFENCE,
  PillarId.GEOPOLITICS,
  PillarId.MONEY,
];

export const ObsidianBentoMatrix: React.FC<ObsidianBentoMatrixProps> = ({
  briefing,
  editions,
  selectedPillar,
  onSelectPillar,
  onSimulateNextFeed,
  themeMode = 'obsidian-night',
  onToggleTheme,
}) => {
  const [liveTimeStr, setLiveTimeStr] = useState<string>(() =>
    new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  );
  const [connectAllDots, setConnectAllDots] = useState<boolean>(false);
  const [highlightedPillars, setHighlightedPillars] = useState<PillarId[]>([]);
  const [cardTabs, setCardTabs] = useState<Record<string, CardTemporalTab>>({});
  const [drawerPillar, setDrawerPillar] = useState<PillarAnalysis | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLiveTimeStr(
        new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const getActiveTabForPillar = (pillarId: PillarId): CardTemporalTab => {
    return cardTabs[pillarId] || 'PRESENT';
  };

  const setTabForPillar = (pillarId: PillarId, tab: CardTemporalTab) => {
    setCardTabs((prev) => ({ ...prev, [pillarId]: tab }));
  };

  const handleHighlightConnected = (sourcePillar: PillarId, linked: PillarId[]) => {
    const nextSet = Array.from(new Set([sourcePillar, ...linked]));
    setHighlightedPillars((prev) =>
      prev.length === nextSet.length && prev.every((p) => nextSet.includes(p))
        ? []
        : nextSet
    );
  };

  const visiblePillars =
    selectedPillar === 'ALL'
      ? briefing.pillars
      : briefing.pillars.filter((p) => p.id === selectedPillar);

  const activeScenarioIndex =
    editions.findIndex((e) => e.editionId === briefing.editionId) + 1 || 1;

  return (
    <section
      id="obsidian-bento-matrix"
      aria-label="NEXUS-7 Obsidian Bento-Grid Pattern Matrix"
      className="my-8 space-y-6"
    >
      {/* 1. TOP LIVE TELEMETRY BAR */}
      <div className="obsidian-bento-card rounded-2xl p-4 lg:px-6 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Live Status + Clock + Scenario Counter */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-mono-tabular uppercase font-semibold">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>LIVE TELEMETRY</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-300 text-xs font-mono-tabular uppercase">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>UTC/LOCAL {liveTimeStr}</span>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-violet-500/15 border border-violet-400/30 text-violet-300 text-xs font-mono-tabular uppercase">
            SCENARIO {activeScenarioIndex}/{editions.length}
          </span>
        </div>

        {/* Center: 6-Pillar Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter Bento Grid by Pillar">
          <button
            type="button"
            onClick={() => {
              onSelectPillar('ALL');
              setHighlightedPillars([]);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono-tabular uppercase transition-all cursor-pointer border ${
              selectedPillar === 'ALL'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-semibold'
                : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white'
            }`}
          >
            ALL 6 PILLARS
          </button>
          {ALL_PILLARS.map((pillarId) => {
            const cfg = DOMAIN_STYLE_MAP[pillarId];
            const isSelected = selectedPillar === pillarId;
            return (
              <button
                key={pillarId}
                type="button"
                onClick={() => onSelectPillar(isSelected ? 'ALL' : pillarId)}
                style={{
                  borderColor: isSelected ? cfg.hex : 'rgba(255,255,255,0.08)',
                  backgroundColor: isSelected ? cfg.badgeBg : 'rgba(255,255,255,0.02)',
                  color: isSelected ? cfg.hex : '#94A3B8',
                }}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono-tabular uppercase transition-all cursor-pointer border hover:text-white"
              >
                {cfg.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Right: Global "Connect All Dots" Toggle + "Simulate New Live Intelligence Feed" + Standalone HTML Download */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setConnectAllDots((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-tabular uppercase cursor-pointer border transition-all ${
              connectAllDots
                ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-200 shadow-[0_0_20px_-4px_rgba(217,70,239,0.5)] font-semibold'
                : 'bg-white/[0.03] border-white/[0.08] text-slate-300 hover:border-cyan-500/40'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>{connectAllDots ? '⚡ ALL DOTS CONNECTED' : 'Connect All Dots'}</span>
          </button>

          <button
            type="button"
            onClick={onSimulateNextFeed}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-slate-950 font-mono-tabular font-bold text-xs uppercase cursor-pointer transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Simulate New Live Intelligence Feed</span>
          </button>

          <a
            href="/nexus7-standalone.html"
            download="nexus7-global-pattern-intelligence.html"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-200 text-xs font-mono-tabular uppercase transition-all"
            title="Download self-contained single-file HTML5 app"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Single-File HTML</span>
          </a>

          {onToggleTheme && (
            <button
              type="button"
              data-testid="bento-theme-toggle-btn"
              onClick={() => onToggleTheme()}
              style={{
                backgroundColor: 'var(--nexus-accent-soft)',
                borderColor: 'var(--nexus-border-strong)',
                color: 'var(--nexus-accent)',
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono-tabular uppercase font-semibold cursor-pointer transition-all"
            >
              <span>
                Theme: {themeMode === 'terminal-green' ? 'Terminal Green' : 'Obsidian Night'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 2. HERO "MASTER PATTERN SYNTHESIS" WIDE BENTO BANNER */}
      <div className="obsidian-bento-card rounded-2xl p-6 lg:p-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="space-y-2 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular uppercase text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>MASTER PATTERN SYNTHESIS // CROSS-DOMAIN CHAIN REACTION</span>
              <span className="px-2 py-0.5 rounded bg-white/[0.06] text-slate-300">
                {briefing.dateLabel}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              {briefing.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              <strong className="text-cyan-300">Thunglish Executive Hook: </strong>“
              {briefing.executiveSummary.bigPictureHeadline}”
            </p>
          </div>

          <div className="shrink-0 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] max-w-sm">
            <div className="text-[11px] font-mono-tabular uppercase text-amber-400 mb-1">
              STREET-SMART THUNGLISH TL;DR
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {briefing.executiveSummary.streetSmartTldr}
            </p>
          </div>
        </div>

        {/* Interactive 6-Node Visual Flow Chain (Physics -> Tech -> Aerospace -> Defence -> Geopolitics -> Money) */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-mono-tabular uppercase text-slate-400 mb-3">
            <span>INTERACTIVE CAUSAL CASCADE — CLICK ANY DOMAIN NODE TO TRACE RIPPLE:</span>
            {highlightedPillars.length > 0 && (
              <button
                type="button"
                onClick={() => setHighlightedPillars([])}
                className="text-cyan-400 hover:underline cursor-pointer"
              >
                Clear Highlight ({highlightedPillars.length} active)
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {CHAIN_ORDER.map((pillarId, idx) => {
              const cfg = DOMAIN_STYLE_MAP[pillarId];
              const pillarData = briefing.pillars.find((p) => p.id === pillarId);
              const isHighlighted =
                connectAllDots ||
                highlightedPillars.includes(pillarId) ||
                selectedPillar === pillarId;

              return (
                <button
                  key={pillarId}
                  type="button"
                  onClick={() => {
                    if (pillarData) {
                      handleHighlightConnected(pillarId, pillarData.linkedPillars);
                    }
                  }}
                  style={{
                    borderColor: isHighlighted ? cfg.hex : 'rgba(255,255,255,0.08)',
                    boxShadow: isHighlighted ? cfg.glowRing : 'none',
                  }}
                  className="text-left p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border transition-all cursor-pointer relative group"
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span
                      style={{ color: cfg.hex }}
                      className="text-[11px] font-mono-tabular uppercase font-bold"
                    >
                      0{idx + 1} · {cfg.shortLabel}
                    </span>
                    {idx < CHAIN_ORDER.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    )}
                  </div>
                  <div className="text-xs font-semibold text-white line-clamp-2 mb-1">
                    {pillarData?.present.keyMetric || 'LIVE'}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">
                    {pillarData?.present.metricLabel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. 6-PILLAR INTERACTIVE BENTO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {visiblePillars.map((pillar) => {
          const cfg = DOMAIN_STYLE_MAP[pillar.id];
          const activeTab = getActiveTabForPillar(pillar.id);
          const isHighlighted =
            connectAllDots || highlightedPillars.includes(pillar.id);

          return (
            <article
              key={pillar.id}
              style={{
                borderColor: isHighlighted ? cfg.hex : undefined,
                boxShadow: isHighlighted ? cfg.glowRing : undefined,
              }}
              className="obsidian-bento-card rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                {/* Card Top Header: Domain Accent Badge + Code + Deep-Dive Trigger */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span
                    style={{
                      backgroundColor: cfg.badgeBg,
                      borderColor: cfg.badgeBorder,
                      color: cfg.badgeText,
                    }}
                    className="px-3 py-1 rounded-md border text-xs font-mono-tabular uppercase font-semibold"
                  >
                    {pillar.id}
                  </span>

                  <span className="text-[11px] font-mono-tabular uppercase text-slate-400">
                    {pillar.code.split('·')[0]} · {pillar.present.keyMetric}
                  </span>
                </div>

                {/* Pillar Headline (Space Grotesk) */}
                <h2
                  onClick={() => setDrawerPillar(pillar)}
                  className="font-display text-xl font-bold text-white leading-snug mb-2.5 cursor-pointer hover:text-cyan-300 transition-colors"
                >
                  {pillar.headline}
                </h2>

                {/* Thunglish Hook */}
                <p className="text-xs text-slate-300 leading-relaxed mb-4 italic bg-white/[0.02] p-3 rounded-lg border border-white/[0.06]">
                  “{pillar.thunglishHook}”
                </p>

                {/* 3-Tab Temporal Switcher ([PAST: Root Cause], [PRESENT: Trigger], [FUTURE: 5-Yr Projection]) */}
                <div
                  role="tablist"
                  aria-label={`Temporal Switcher for ${pillar.id}`}
                  className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-black/40 border border-white/[0.08] mb-4"
                >
                  {(
                    [
                      { id: 'PAST', label: 'PAST: Root' },
                      { id: 'PRESENT', label: 'PRESENT: Trigger' },
                      { id: 'FUTURE', label: 'FUTURE: 5-Yr' },
                    ] as const
                  ).map((tab) => {
                    const isTabActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isTabActive}
                        onClick={() => setTabForPillar(pillar.id, tab.id)}
                        style={{
                          backgroundColor: isTabActive ? cfg.badgeBg : 'transparent',
                          borderColor: isTabActive ? cfg.badgeBorder : 'transparent',
                          color: isTabActive ? cfg.hex : '#94A3B8',
                        }}
                        className="py-1.5 px-1.5 rounded-lg text-[9.5px] tracking-wider font-mono-tabular uppercase font-semibold border transition-all cursor-pointer whitespace-nowrap text-center"
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Temporal Tab Body */}
                <div className="min-h-[155px] p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
                  {activeTab === 'PAST' && (
                    <>
                      <div className="flex items-center justify-between text-[11px] font-mono-tabular uppercase text-slate-400">
                        <span>🔸 [PAST] HISTORICAL ROOT CAUSE</span>
                        <span>{pillar.past.era}</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {pillar.past.context}
                      </p>
                      <div className="pt-2 border-t border-white/[0.06] text-[11px] text-slate-400">
                        <strong className="text-white">Catalyst: </strong>
                        {pillar.past.rootTrigger}
                      </div>
                    </>
                  )}

                  {activeTab === 'PRESENT' && (
                    <>
                      <div className="flex items-center justify-between text-[11px] font-mono-tabular uppercase text-cyan-400">
                        <span>🔸 [PRESENT] CURRENT TRIGGER</span>
                        <span>{pillar.present.dateMarker}</span>
                      </div>
                      <p className="text-xs text-white font-medium leading-relaxed">
                        {pillar.present.triggerEvent}
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        <strong className="text-cyan-300">Reality Today: </strong>
                        {pillar.present.whyItMattersToday}
                      </p>
                    </>
                  )}

                  {activeTab === 'FUTURE' && (
                    <>
                      <div className="flex items-center justify-between text-[11px] font-mono-tabular uppercase text-fuchsia-400">
                        <span>🔸 [FUTURE] 1-TO-5 YR PROJECTION</span>
                        <span>HORIZON MATRIX</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        <strong className="text-white">1-Yr: </strong>
                        {pillar.future.year1}
                      </p>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        <strong className="text-cyan-300">5-Yr: </strong>
                        {pillar.future.year5}
                      </p>
                      <div className="pt-1.5 border-t border-white/[0.06] text-[11px] text-emerald-300">
                        <strong>Opportunity: </strong>
                        {pillar.future.asymmetricOpportunity}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Card Footer: "Connected Dots" Clickable Highlight Tags + Deep-Dive Drawer Trigger */}
              <div className="mt-5 pt-4 border-t border-white/[0.08] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-mono-tabular uppercase text-slate-400">
                    🔗 CONNECTED DOTS:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {pillar.linkedPillars.map((linkedId) => {
                      const linkedCfg = DOMAIN_STYLE_MAP[linkedId];
                      const isTagActive = highlightedPillars.includes(linkedId);
                      return (
                        <button
                          key={linkedId}
                          type="button"
                          onClick={() =>
                            handleHighlightConnected(pillar.id, pillar.linkedPillars)
                          }
                          style={{
                            borderColor: isTagActive
                              ? linkedCfg.hex
                              : 'rgba(255,255,255,0.12)',
                            color: linkedCfg.hex,
                            backgroundColor: isTagActive
                              ? linkedCfg.badgeBg
                              : 'rgba(255,255,255,0.03)',
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-mono-tabular uppercase border hover:bg-white/[0.08] transition-all cursor-pointer"
                        >
                          ⚡ {linkedCfg.shortLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerPillar(pillar)}
                  className="w-full py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-cyan-500/15 border border-white/[0.08] hover:border-cyan-400/50 text-xs font-mono-tabular uppercase text-cyan-300 flex items-center justify-between transition-all cursor-pointer"
                >
                  <span>🔍 Duda &amp; Hart Pattern Deep-Dive</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* 4. INTERACTIVE DEEP-DIVE SIDE-DRAWER / MODAL (Duda & Hart Pattern Breakdown) */}
      {drawerPillar && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="duda-hart-drawer-title"
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
        >
          <div className="w-full max-w-2xl bg-[#07090E]/95 border-l border-white/[0.12] h-full overflow-y-auto p-6 lg:p-8 space-y-6 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/[0.08]">
              <div className="space-y-1.5">
                <span
                  style={{
                    color: DOMAIN_STYLE_MAP[drawerPillar.id].hex,
                    borderColor: DOMAIN_STYLE_MAP[drawerPillar.id].badgeBorder,
                    backgroundColor: DOMAIN_STYLE_MAP[drawerPillar.id].badgeBg,
                  }}
                  className="inline-block px-3 py-1 rounded-md border text-xs font-mono-tabular uppercase font-semibold"
                >
                  {drawerPillar.id} // DUDA &amp; HART PATTERN BREAKDOWN
                </span>
                <h2
                  id="duda-hart-drawer-title"
                  className="font-display text-2xl font-bold text-white"
                >
                  {drawerPillar.headline}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDrawerPillar(null)}
                aria-label="Close Deep-Dive Drawer"
                className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Core Concept Analogy (Thunglish) */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono-tabular uppercase text-amber-400">
                <Flame className="w-4 h-4" />
                <span>01. CORE CONCEPT ANALOGY · {drawerPillar.streetAnalogy.title}</span>
              </div>
              <p className="text-sm text-cyan-300 font-medium">
                “{drawerPillar.thunglishHook}”
              </p>
              <p className="text-sm text-slate-200 leading-relaxed">
                {drawerPillar.streetAnalogy.explanation}
              </p>
            </div>

            {/* 2. Duda & Hart Feature Extraction Vector x */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono-tabular uppercase text-cyan-400">
                <Cpu className="w-4 h-4" />
                <span>02. FEATURE EXTRACTION VECTOR x = [x₁, x₂, x₃]ᵀ</span>
              </div>
              <ul className="space-y-2 text-xs font-mono-tabular text-slate-200">
                {DOMAIN_STYLE_MAP[drawerPillar.id].dudaHartFeatures.map((feat, i) => (
                  <li
                    key={i}
                    className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06]"
                  >
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Discriminant Decision Rule g(x) */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono-tabular uppercase text-fuchsia-400">
                <Layers className="w-4 h-4" />
                <span>03. BAYESIAN DECISION RULE &amp; DISCRIMINANT BOUNDARY g(x)</span>
              </div>
              <div className="p-3 rounded-lg bg-black/50 border border-fuchsia-500/30 text-xs font-mono-tabular text-fuchsia-200">
                {DOMAIN_STYLE_MAP[drawerPillar.id].dudaHartDecisionRule}
              </div>
            </div>

            {/* 4. 3D Temporal Breakdown & Future Verdict */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono-tabular uppercase text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <span>04. FUTURE VERDICT &amp; ASYMMETRIC OPPORTUNITY</span>
              </div>
              <div className="space-y-2 text-xs text-slate-200 leading-relaxed">
                <p>
                  <strong className="text-white">🔸 [PAST]: </strong>
                  {drawerPillar.past.context}
                </p>
                <p>
                  <strong className="text-cyan-300">🔸 [PRESENT]: </strong>
                  {drawerPillar.present.triggerEvent}
                </p>
                <p>
                  <strong className="text-fuchsia-300">🔸 [FUTURE 1Y]: </strong>
                  {drawerPillar.future.year1}
                </p>
                <p>
                  <strong className="text-fuchsia-300">🔸 [FUTURE 5Y]: </strong>
                  {drawerPillar.future.year5}
                </p>
                <p>
                  <strong className="text-emerald-300">🔸 [FUTURE 10Y ENDGAME]: </strong>
                  {drawerPillar.future.year10}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Hidden Risk:</strong> {drawerPillar.future.hiddenRisk}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setDrawerPillar(null)}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono-tabular font-bold text-xs uppercase cursor-pointer"
              >
                Close Pattern Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
