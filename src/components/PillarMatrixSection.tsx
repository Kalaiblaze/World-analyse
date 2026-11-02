import React, { useState } from 'react';
import { Search } from 'lucide-react';
import {
  ALL_PILLARS,
  PillarAnalysis,
  PillarId,
  filterPillars,
} from '../utils/intelligenceEngine';

interface PillarMatrixSectionProps {
  pillars: PillarAnalysis[];
  selectedPillar: PillarId | 'ALL';
  onSelectPillar: (pillar: PillarId | 'ALL') => void;
}

type TemporalViewMode = 'ALL' | 'PAST' | 'PRESENT' | 'FUTURE';

export const PillarMatrixSection: React.FC<PillarMatrixSectionProps> = ({
  pillars,
  selectedPillar,
  onSelectPillar,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [temporalMode, setTemporalMode] = useState<TemporalViewMode>('ALL');

  const visiblePillars = filterPillars(pillars, selectedPillar, searchQuery);

  return (
    <section
      id="pillar-breakdown"
      aria-labelledby="pillar-breakdown-heading"
      className="py-12 border-b border-[#D6CEBE]"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <div className="text-xs font-mono-tabular uppercase tracking-widest text-[#9A3412] mb-2">
            02. PILLAR-BY-PILLAR BREAKDOWN · THE 3-DIMENSIONAL PATTERN MATRIX
          </div>
          <h2
            id="pillar-breakdown-heading"
            className="text-2xl lg:text-3xl font-editorial font-semibold text-[#1C1917] tracking-tight"
          >
            Six Critical Pillars Mapped Across Past, Present &amp; Future
          </h2>
          <p className="mt-2 text-sm text-[#57534E] max-w-2xl leading-relaxed">
            Every domain update is dissected through three temporal layers—Historical Root Cause
            (Past), Current Trigger (Present), and 1, 5 &amp; 10-Year Second/Third-Order Consequences
            (Future)—paired with a street-smart Thunglish analogy.
          </p>
        </div>

        {/* Temporal Dimension Focus Switcher */}
        <div
          role="group"
          aria-label="Filter Temporal Layers"
          className="flex items-center gap-1 p-1 bg-[#F3EFE6] border border-[#D6CEBE] rounded-lg self-start lg:self-auto"
        >
          {(
            [
              { id: 'ALL', label: 'All 3 Layers' },
              { id: 'PAST', label: '1. Past' },
              { id: 'PRESENT', label: '2. Present' },
              { id: 'FUTURE', label: '3. Future (1–10Y)' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTemporalMode(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                temporalMode === tab.id
                  ? 'bg-[#1C1917] text-[#FBF9F5]'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pillar Filter Controls + Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8">
        <div
          role="group"
          aria-label="Filter by Pillar"
          className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#F3EFE6] border border-[#D6CEBE] rounded-lg"
        >
          <button
            type="button"
            onClick={() => onSelectPillar('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedPillar === 'ALL'
                ? 'bg-[#9A3412] text-[#FBF9F5]'
                : 'text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            All 6 Pillars
          </button>
          {ALL_PILLARS.map((pillarId) => (
            <button
              key={pillarId}
              type="button"
              onClick={() => onSelectPillar(pillarId)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedPillar === pillarId
                  ? 'bg-[#9A3412] text-[#FBF9F5]'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              {pillarId}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <label htmlFor="pillar-search-input" className="sr-only">
            Search across 6 pillars
          </label>
          <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="pillar-search-input"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts, analogies, or metrics..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#9A3412]"
          />
        </div>
      </div>

      {/* Empty State if search filters out all items */}
      {visiblePillars.length === 0 ? (
        <div className="p-10 text-center bg-[#F3EFE6] border border-[#D6CEBE] rounded-lg">
          <p className="text-base font-editorial font-medium text-[#1C1917] mb-2">
            No pillars matched “{searchQuery}” under {selectedPillar}.
          </p>
          <p className="text-xs text-[#57534E] mb-4">
            Reset the pillar filter or clear your search term to inspect all 6 intelligence pillars.
          </p>
          <button
            type="button"
            onClick={() => {
              onSelectPillar('ALL');
              setSearchQuery('');
            }}
            className="px-4 py-2 text-xs font-semibold text-[#FBF9F5] bg-[#1C1917] rounded-md hover:bg-[#9A3412] transition-colors cursor-pointer"
          >
            Reset Pillar Filters
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {visiblePillars.map((pillar) => (
            <article
              key={pillar.id}
              className="surface-3d-card p-6 lg:p-8 rounded-lg"
            >
              {/* Pillar Header Row */}
              <div className="pb-6 mb-6 border-b border-[#E7E2D8]">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tabular text-[#78716C] mb-2">
                  <div>
                    <span className="font-semibold text-[#9A3412]">{pillar.code}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="font-semibold text-[#1C1917]">{pillar.id}</span>
                  </div>
                  <div>
                    <span>Connected Vectors: </span>
                    {pillar.linkedPillars.map((lp, i) => (
                      <React.Fragment key={lp}>
                        {i > 0 && <span aria-hidden="true"> / </span>}
                        <button
                          type="button"
                          onClick={() => onSelectPillar(lp)}
                          className="text-[#1E3A8A] hover:underline cursor-pointer"
                        >
                          {lp}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <h3 className="text-2xl font-editorial font-semibold text-[#1C1917] leading-snug mb-3">
                  {pillar.headline}
                </h3>

                <p className="text-base font-medium text-[#9A3412] leading-relaxed mb-5">
                  Thunglish Hook: “{pillar.thunglishHook}”
                </p>

                {/* Street-Smart Analogy Box */}
                <div className="p-5 bg-[#F3EFE6] border border-[#D6CEBE] rounded-md">
                  <div className="text-xs font-mono-tabular uppercase tracking-widest text-[#1E3A8A] mb-1">
                    REAL-WORLD ANALOGY · {pillar.streetAnalogy.title}
                  </div>
                  <p className="text-sm text-[#292524] leading-relaxed">
                    {pillar.streetAnalogy.explanation}
                  </p>
                </div>
              </div>

              {/* 3-Dimensional Temporal Matrix: Past -> Present -> Future */}
              <div
                className={`grid grid-cols-1 ${
                  temporalMode === 'ALL' ? 'lg:grid-cols-3' : 'lg:grid-cols-1'
                } gap-6`}
              >
                {/* 1. PAST (Historical Context) */}
                {(temporalMode === 'ALL' || temporalMode === 'PAST') && (
                  <div className="flex flex-col justify-between p-5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-md">
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono-tabular uppercase tracking-wider text-[#57534E] mb-3 pb-2 border-b border-[#E7E2D8]">
                        <span className="font-semibold text-[#1C1917]">01. PAST (ROOT CONTEXT)</span>
                        <span>{pillar.past.era}</span>
                      </div>
                      <p className="text-sm text-[#44403C] leading-relaxed mb-4">
                        {pillar.past.context}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-[#E7E2D8]">
                      <div className="text-xs font-mono-tabular text-[#78716C] mb-1">
                        Historical Catalyst / Policy Trigger:
                      </div>
                      <p className="text-xs text-[#1C1917] leading-relaxed font-medium">
                        {pillar.past.rootTrigger}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. PRESENT (Current Trigger) */}
                {(temporalMode === 'ALL' || temporalMode === 'PRESENT') && (
                  <div className="flex flex-col justify-between p-5 bg-[#F3EFE6]/60 border border-[#D6CEBE] rounded-md">
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono-tabular uppercase tracking-wider text-[#9A3412] mb-3 pb-2 border-b border-[#D6CEBE]">
                        <span className="font-semibold">02. PRESENT (CURRENT TRIGGER)</span>
                        <span>{pillar.present.dateMarker}</span>
                      </div>
                      <p className="text-sm font-medium text-[#1C1917] leading-relaxed mb-3">
                        {pillar.present.triggerEvent}
                      </p>
                      <p className="text-sm text-[#44403C] leading-relaxed mb-4">
                        <strong className="font-semibold text-[#1C1917]">Why It Matters Today: </strong>
                        {pillar.present.whyItMattersToday}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#D6CEBE] flex items-baseline justify-between gap-2">
                      <span className="text-xs text-[#57534E]">{pillar.present.metricLabel}</span>
                      <span className="text-lg font-mono-tabular font-bold text-[#9A3412]">
                        {pillar.present.keyMetric}
                      </span>
                    </div>
                  </div>
                )}

                {/* 3. FUTURE (1, 5 & 10-Year Consequences) */}
                {(temporalMode === 'ALL' || temporalMode === 'FUTURE') && (
                  <div className="flex flex-col justify-between p-5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-md">
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono-tabular uppercase tracking-wider text-[#1E3A8A] mb-3 pb-2 border-b border-[#E7E2D8]">
                        <span className="font-semibold">03. FUTURE (2ND &amp; 3RD ORDER)</span>
                        <span>1Y · 5Y · 10Y HORIZON</span>
                      </div>

                      <dl className="space-y-3 text-xs leading-relaxed mb-4">
                        <div>
                          <dt className="font-mono-tabular font-semibold text-[#1C1917]">
                            +1 Year Trajectory:
                          </dt>
                          <dd className="text-[#44403C] mt-0.5">{pillar.future.year1}</dd>
                        </div>
                        <div>
                          <dt className="font-mono-tabular font-semibold text-[#1C1917]">
                            +5 Year Trajectory:
                          </dt>
                          <dd className="text-[#44403C] mt-0.5">{pillar.future.year5}</dd>
                        </div>
                        <div>
                          <dt className="font-mono-tabular font-semibold text-[#1C1917]">
                            +10 Year Endgame:
                          </dt>
                          <dd className="text-[#44403C] mt-0.5">{pillar.future.year10}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="pt-3 border-t border-[#E7E2D8] space-y-2 text-xs">
                      <div>
                        <span className="font-mono-tabular font-semibold text-[#9A3412]">
                          Hidden Risk:{' '}
                        </span>
                        <span className="text-[#44403C]">{pillar.future.hiddenRisk}</span>
                      </div>
                      <div>
                        <span className="font-mono-tabular font-semibold text-[#14532D]">
                          Asymmetric Opportunity:{' '}
                        </span>
                        <span className="text-[#44403C]">{pillar.future.asymmetricOpportunity}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
