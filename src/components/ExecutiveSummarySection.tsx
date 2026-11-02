import React from 'react';
import {
  ALL_PILLARS,
  IntelligenceBriefing,
  PillarId,
} from '../utils/intelligenceEngine';

interface ExecutiveSummarySectionProps {
  briefing: IntelligenceBriefing;
  editions: IntelligenceBriefing[];
  onSelectEdition: (editionId: string) => void;
  selectedPillar: PillarId | 'ALL';
  onSelectPillar: (pillar: PillarId | 'ALL') => void;
}

const PILLAR_COORDS: Record<PillarId, { x: number; y: number; shortCode: string }> = {
  [PillarId.PHYSICS]: { x: 210, y: 48, shortCode: '01 · PHYSICS' },
  [PillarId.TECH]: { x: 355, y: 125, shortCode: '02 · TECH' },
  [PillarId.AEROSPACE]: { x: 355, y: 265, shortCode: '03 · AEROSPACE' },
  [PillarId.DEFENCE]: { x: 210, y: 342, shortCode: '04 · DEFENCE' },
  [PillarId.GEOPOLITICS]: { x: 65, y: 265, shortCode: '05 · GEOPOLITICS' },
  [PillarId.MONEY]: { x: 65, y: 125, shortCode: '06 · MONEY' },
};

export const ExecutiveSummarySection: React.FC<ExecutiveSummarySectionProps> = ({
  briefing,
  editions,
  onSelectEdition,
  selectedPillar,
  onSelectPillar,
}) => {
  return (
    <section
      id="executive-summary"
      aria-labelledby="exec-summary-heading"
      className="py-10 border-b border-[#D6CEBE]"
    >
      {/* Edition Archive Switcher + Clean Unboxed Editorial Metadata */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#E7E2D8]">
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular uppercase tracking-widest text-[#57534E]">
          <span className="font-semibold text-[#9A3412]">{briefing.volumeCode}</span>
          <span aria-hidden="true">·</span>
          <span>{briefing.dateLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{briefing.readingTimeMinutes} MIN BRIEFING</span>
          <span aria-hidden="true">·</span>
          <span>THUNGLISH 3D PATTERN EDITION</span>
        </div>

        {/* Interactive Edition Selector (Functional Segmented Buttons) */}
        <div
          role="group"
          aria-label="Select Daily Briefing Edition"
          className="flex flex-wrap items-center gap-1 p-1 bg-[#F3EFE6] border border-[#D6CEBE] rounded-lg"
        >
          {editions.map((ed) => {
            const isActive = ed.editionId === briefing.editionId;
            return (
              <button
                key={ed.editionId}
                type="button"
                onClick={() => onSelectEdition(ed.editionId)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#1C1917] text-[#FBF9F5]'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                {ed.dateLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Editorial Hero Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch mb-10">
        {/* Left Column (7 cols): Lead Headline + 01. Executive Summary in Thunglish */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono-tabular uppercase tracking-widest text-[#9A3412] mb-3">
              01. EXECUTIVE SUMMARY · THE BIG PICTURE IN THUNGLISH
            </div>

            <h1
              id="exec-summary-heading"
              className="text-3xl sm:text-4xl lg:text-[2.65rem] font-editorial font-semibold text-[#1C1917] leading-[1.15] tracking-tight mb-4 text-balance"
            >
              {briefing.title}
            </h1>

            <p className="text-base text-[#57534E] leading-relaxed mb-6 max-w-2xl">
              {briefing.subtitle}
            </p>

            {/* Grounding / Substack Attribution Link if present */}
            {briefing.groundingSources && briefing.groundingSources.length > 0 && (
              <div className="mb-6 py-2.5 px-4 bg-[#F3EFE6] border border-[#D6CEBE] rounded text-xs font-mono-tabular text-[#44403C]">
                <span>Primary Source Dispatch: </span>
                <a
                  href={briefing.groundingSources[0].uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#9A3412] underline underline-offset-2"
                >
                  {briefing.groundingSources[0].title}
                </a>
              </div>
            )}

            <div className="pt-6 border-t border-[#D6CEBE]">
              <h2 className="text-xl font-editorial font-medium text-[#1C1917] leading-snug mb-4">
                “{briefing.executiveSummary.bigPictureHeadline}”
              </h2>

              <p className="text-base text-[#292524] leading-[1.8] max-w-prose mb-6 first-letter:text-5xl first-letter:font-editorial first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-[#9A3412]">
                {briefing.executiveSummary.openingThunglishNarrative}
              </p>
            </div>
          </div>

          {/* Street-Smart Analogy & Core Thesis Box (All-around 1px hairline border, no thick left bar) */}
          <div className="p-6 bg-[#F3EFE6] border border-[#D6CEBE] rounded-lg space-y-4">
            <div>
              <div className="text-xs font-mono-tabular uppercase tracking-widest text-[#9A3412] mb-1">
                STREET-SMART THUNGLISH ANALOGY (TL;DR)
              </div>
              <p className="text-sm text-[#1C1917] leading-relaxed font-medium">
                {briefing.executiveSummary.streetSmartTldr}
              </p>
            </div>

            <div className="pt-3 border-t border-[#D6CEBE]">
              <div className="text-xs font-mono-tabular uppercase tracking-widest text-[#57534E] mb-1">
                DIRECTOR’S CORE STRUCTURAL THESIS
              </div>
              <p className="text-xs text-[#44403C] leading-relaxed">
                {briefing.executiveSummary.coreThesis}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Interactive 6-Pillar Cross-Domain Pattern Atlas (SVG) + Trigger Index */}
        <div className="lg:col-span-5 surface-3d-card flex flex-col justify-between p-6 bg-[#F3EFE6] rounded-lg">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs font-mono-tabular uppercase tracking-widest text-[#57534E] mb-2">
              <span>FIG. 1 · 6-PILLAR COUPLING ATLAS</span>
              <span>INTERACTIVE NODE FILTER</span>
            </div>
            <p className="text-xs text-[#57534E] mb-3">
              Click any pillar node below to isolate its Past-Present-Future trajectory and trace its
              cross-domain transmission paths.
            </p>

            <div className="flex items-center justify-center py-2">
              <svg
                viewBox="0 0 420 390"
                className="w-full max-w-[360px] h-auto select-none"
                role="img"
                aria-label="Interactive 6-Pillar Pattern Recognition Network across Physics, Technology, Aerospace, Defence, Geopolitics, and Money"
              >
                {/* Outer orbital guidance rings */}
                <circle
                  cx="210"
                  cy="195"
                  r="148"
                  fill="none"
                  stroke="#D6CEBE"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <circle
                  cx="210"
                  cy="195"
                  r="92"
                  fill="none"
                  stroke="#E7E2D8"
                  strokeWidth="1"
                />

                {/* Cross-domain connection lines from briefing.dotConnections */}
                {briefing.dotConnections.map((conn) => {
                  const s = PILLAR_COORDS[conn.sourcePillar];
                  const m = PILLAR_COORDS[conn.intermediatePillar];
                  const t = PILLAR_COORDS[conn.targetPillar];
                  const isHighlighted =
                    selectedPillar === 'ALL' ||
                    conn.sourcePillar === selectedPillar ||
                    conn.intermediatePillar === selectedPillar ||
                    conn.targetPillar === selectedPillar;

                  return (
                    <g key={conn.id} opacity={isHighlighted ? 0.9 : 0.2}>
                      <line
                        x1={s.x}
                        y1={s.y}
                        x2={m.x}
                        y2={m.y}
                        stroke="#9A3412"
                        strokeWidth={isHighlighted ? '2.2' : '1'}
                      />
                      <line
                        x1={m.x}
                        y1={m.y}
                        x2={t.x}
                        y2={t.y}
                        stroke="#1E3A8A"
                        strokeWidth={isHighlighted ? '2.2' : '1'}
                      />
                    </g>
                  );
                })}

                {/* Center Pattern Hub */}
                <g
                  onClick={() => onSelectPillar('ALL')}
                  className="cursor-pointer"
                >
                  <circle
                    cx="210"
                    cy="195"
                    r="38"
                    fill={selectedPillar === 'ALL' ? '#1C1917' : '#FBF9F5'}
                    stroke="#1C1917"
                    strokeWidth="1.5"
                  />
                  <text
                    x="210"
                    y="191"
                    textAnchor="middle"
                    fill={selectedPillar === 'ALL' ? '#FBF9F5' : '#1C1917'}
                    fontSize="9"
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    3D MATRIX
                  </text>
                  <text
                    x="210"
                    y="204"
                    textAnchor="middle"
                    fill={selectedPillar === 'ALL' ? '#D6CEBE' : '#57534E'}
                    fontSize="8"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {selectedPillar === 'ALL' ? 'ALL 6 ACTIVE' : 'RESET ALL'}
                  </text>
                </g>

                {/* 6 Pillar Nodes */}
                {ALL_PILLARS.map((pillar) => {
                  const pos = PILLAR_COORDS[pillar];
                  const isSelected = selectedPillar === pillar;
                  return (
                    <g
                      key={pillar}
                      onClick={() =>
                        onSelectPillar(selectedPillar === pillar ? 'ALL' : pillar)
                      }
                      className="cursor-pointer"
                    >
                      <rect
                        x={pos.x - 56}
                        y={pos.y - 22}
                        width="112"
                        height="44"
                        rx="6"
                        fill={isSelected ? '#9A3412' : '#FBF9F5'}
                        stroke={isSelected ? '#9A3412' : '#1C1917'}
                        strokeWidth={isSelected ? '2' : '1.2'}
                      />
                      <text
                        x={pos.x}
                        y={pos.y - 4}
                        textAnchor="middle"
                        fill={isSelected ? '#FBF9F5' : '#9A3412'}
                        fontSize="8.5"
                        fontWeight="600"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {pos.shortCode}
                      </text>
                      <text
                        x={pos.x}
                        y={pos.y + 11}
                        textAnchor="middle"
                        fill={isSelected ? '#FBF9F5' : '#1C1917'}
                        fontSize="10.5"
                        fontWeight="600"
                        fontFamily="Plus Jakarta Sans, sans-serif"
                      >
                        {pillar}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Compact 6-Pillar Present Metric Ledger inside Atlas Card */}
          <div className="pt-4 border-t border-[#D6CEBE] space-y-2">
            <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-[#57534E]">
              PRESENT TRIGGER TELEMETRY BY PILLAR
            </div>
            <div className="divide-y divide-[#E7E2D8] text-xs">
              {briefing.pillars.map((p) => (
                <div
                  key={p.id}
                  className="py-1.5 flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    onClick={() => onSelectPillar(selectedPillar === p.id ? 'ALL' : p.id)}
                    className={`font-medium text-left hover:underline cursor-pointer ${
                      selectedPillar === p.id ? 'text-[#9A3412] font-semibold' : 'text-[#1C1917]'
                    }`}
                  >
                    {p.id}
                  </button>
                  <span className="font-mono-tabular text-[#9A3412] font-semibold shrink-0">
                    {p.present.keyMetric}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#D6CEBE] flex items-center justify-between text-xs font-mono-tabular text-[#57534E]">
              <span>Active Filter: {selectedPillar === 'ALL' ? 'All 6 Pillars' : selectedPillar}</span>
              {selectedPillar !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => onSelectPillar('ALL')}
                  className="text-[#9A3412] font-semibold underline cursor-pointer"
                >
                  Show All 6 Pillars
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width 4-Column Quantitative Macro & Physics Strip (Tabular Numerals) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-[#D6CEBE]">
        {briefing.executiveSummary.keyMacroIndicators.map((metric) => (
          <div
            key={metric.label}
            className="p-5 bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
          >
            <div className="text-xs font-medium text-[#57534E] mb-2">
              {metric.label}
            </div>
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <span className="text-2xl font-mono-tabular font-semibold text-[#1C1917]">
                {metric.value}
              </span>
              <span className="text-xs font-mono-tabular font-medium text-[#9A3412]">
                {metric.delta}
              </span>
            </div>
            <p className="text-xs text-[#78716C] leading-snug">{metric.context}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
