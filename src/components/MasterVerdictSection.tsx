import React, { useState } from 'react';
import { Sparkles, Compass } from 'lucide-react';
import {
  ALL_PILLARS,
  IntelligenceBriefing,
  PillarId,
  validateSynthesisInput,
} from '../utils/intelligenceEngine';

interface MasterVerdictSectionProps {
  briefing: IntelligenceBriefing;
  isSynthesizing: boolean;
  onSynthesizeCustomSignal: (query: string, focusPillar: PillarId | 'ALL') => Promise<void>;
  onSelectPillar: (pillar: PillarId | 'ALL') => void;
}

const SAMPLE_PROMPTS: Array<{ label: string; query: string; pillar: PillarId }> = [
  {
    label: 'Sub-Sea Cable vs. Lunar/LEO Laser Relay',
    query: 'Sovereign optical laser relay constellations bypassing Red Sea submarine cable cuts and repricing FX latency',
    pillar: PillarId.GEOPOLITICS,
  },
  {
    label: 'Sodium-Ion Grid Storage & Naval Submarines',
    query: 'High-density anode-free sodium-ion & solid-state batteries transforming diesel-electric submarines and grid transformers',
    pillar: PillarId.DEFENCE,
  },
  {
    label: 'Photonic Radar & Hypersonic Glider Defense',
    query: 'Microwave-photonic airborne radar detecting low-RCS hypersonic glide vehicles across the Indo-Pacific',
    pillar: PillarId.AEROSPACE,
  },
];

export const MasterVerdictSection: React.FC<MasterVerdictSectionProps> = ({
  briefing,
  isSynthesizing,
  onSynthesizeCustomSignal,
  onSelectPillar,
}) => {
  const [customQuery, setCustomQuery] = useState<string>('');
  const [focusPillar, setFocusPillar] = useState<PillarId | 'ALL'>('ALL');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateSynthesisInput(customQuery);
    if (!check.valid) {
      setValidationError(check.error ?? 'Invalid input.');
      return;
    }
    setValidationError(null);
    await onSynthesizeCustomSignal(check.normalizedQuery, focusPillar);
  };

  return (
    <section
      id="master-verdict"
      aria-labelledby="master-verdict-heading"
      className="py-12"
    >
      {/* Part 4: The Master Verdict / Takeaway */}
      <div className="mb-12">
        <div className="text-xs font-mono-tabular uppercase tracking-widest text-[#9A3412] mb-2">
          04. THE MASTER VERDICT &amp; TAKEAWAY · WHAT TO WATCH NEXT
        </div>
        <h2
          id="master-verdict-heading"
          className="text-2xl lg:text-3xl font-editorial font-semibold text-[#1C1917] tracking-tight mb-4"
        >
          Director’s Master Verdict &amp; Multi-Horizon Watchlist
        </h2>

        {/* Director's Closing Note */}
        <div className="p-6 lg:p-8 bg-[#F3EFE6] border border-[#D6CEBE] rounded-lg mb-8">
          <div className="text-xs font-mono-tabular uppercase tracking-widest text-[#9A3412] mb-2">
            GLOBAL INTELLIGENCE DIRECTOR’S VERDICT
          </div>
          <p className="text-base lg:text-lg font-editorial text-[#1C1917] leading-relaxed mb-6">
            “{briefing.masterVerdict.directorClosingNote}”
          </p>

          <div className="pt-4 border-t border-[#D6CEBE]">
            <div className="text-xs font-mono-tabular uppercase tracking-widest text-[#1E3A8A] mb-1">
              CONTRARIAN PATTERN WARNING (CONSENSUS BLINDSPOT)
            </div>
            <p className="text-sm text-[#292524] leading-relaxed">
              {briefing.masterVerdict.contrarianWarning}
            </p>
          </div>
        </div>

        {/* 1-Year, 5-Year, 10-Year Watch Items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {briefing.masterVerdict.watchItems.map((item, idx) => (
            <div
              key={item.horizon}
              className="surface-3d-card flex flex-col justify-between p-6 rounded-lg"
            >
              <div>
                <div className="text-xs font-mono-tabular uppercase tracking-wider text-[#9A3412] mb-2">
                  0{idx + 1} · {item.horizon}
                </div>
                <h3 className="text-base font-semibold text-[#1C1917] leading-snug mb-3">
                  {item.signalToWatch}
                </h3>
                <p className="text-sm text-[#44403C] leading-relaxed mb-4">
                  <strong className="font-semibold text-[#9A3412]">Thunglish Takeaway: </strong>
                  {item.thunglishActionableTakeaway}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E7E2D8] text-xs font-mono-tabular text-[#78716C]">
                <span>Pillars: </span>
                {item.affectedPillars.map((p, i) => (
                  <React.Fragment key={p}>
                    {i > 0 && <span aria-hidden="true"> · </span>}
                    <button
                      type="button"
                      onClick={() => onSelectPillar(p)}
                      className="text-[#1C1917] hover:text-[#9A3412] hover:underline cursor-pointer"
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Signal / Live Briefing Pattern Synthesizer */}
      <div
        id="custom-synthesizer"
        className="p-6 lg:p-8 bg-[#F3EFE6] border border-[#D6CEBE] rounded-lg"
      >
        <div className="max-w-3xl mb-6">
          <div className="flex items-center gap-2 text-xs font-mono-tabular uppercase tracking-widest text-[#9A3412] mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>INTERACTIVE 3D PATTERN RECOGNITION WORKBENCH</span>
          </div>
          <h3 className="text-xl lg:text-2xl font-editorial font-semibold text-[#1C1917] mb-2">
            Synthesize Custom Global Signal in Thunglish
          </h3>
          <p className="text-sm text-[#57534E] leading-relaxed">
            Enter any breaking news headline, Substack thesis, scientific breakthrough, or
            geopolitical event. The Pattern Recognition Engine will map it across all 6 pillars
            (Aerospace, Defence, Geopolitics, Money, Tech, Physics) through Past, Present, and
            Future layers.
          </p>
        </div>

        {/* Preset Prompt Templates */}
        <div className="mb-5">
          <span className="block text-xs font-mono-tabular text-[#57534E] mb-2">
            Load Sample Multi-Pillar Signal:
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setCustomQuery(preset.query);
                  setFocusPillar(preset.pillar);
                  setValidationError(null);
                }}
                className="px-3 py-1.5 text-xs font-medium text-[#1C1917] bg-[#FBF9F5] border border-[#D6CEBE] rounded hover:border-[#9A3412] transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8">
              <label
                htmlFor="custom-signal-input"
                className="block text-xs font-semibold text-[#1C1917] mb-1.5"
              >
                Global News Signal, Substack Thesis, or Technology Breakthrough
              </label>
              <input
                id="custom-signal-input"
                type="text"
                value={customQuery}
                onChange={(e) => {
                  setCustomQuery(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="e.g., Solid-state lithium-sulfur batteries in stratospheric pseudo-satellites..."
                className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#9A3412]"
              />
            </div>

            <div className="lg:col-span-4">
              <label
                htmlFor="focus-pillar-select"
                className="block text-xs font-semibold text-[#1C1917] mb-1.5"
              >
                Primary Origin Pillar
              </label>
              <select
                id="focus-pillar-select"
                value={focusPillar}
                onChange={(e) => setFocusPillar(e.target.value as PillarId | 'ALL')}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
              >
                <option value="ALL">All 6 Pillars (Balanced Synthesis)</option>
                {ALL_PILLARS.map((p) => (
                  <option key={p} value={p}>
                    {p} Primary Trigger
                  </option>
                ))}
              </select>
            </div>
          </div>

          {validationError && (
            <p role="alert" className="text-xs font-medium text-[#DC2626]">
              {validationError}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setCustomQuery('');
                setValidationError(null);
              }}
              className="px-4 py-2 text-xs font-medium text-[#57534E] hover:text-[#1C1917] transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isSynthesizing}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#FBF9F5] bg-[#1C1917] rounded-md hover:bg-[#9A3412] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isSynthesizing
                  ? 'Synthesizing 6-Pillar Briefing...'
                  : 'Run Pattern Synthesis'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
