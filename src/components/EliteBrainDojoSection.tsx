import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  Compass,
  Flame,
  Link2,
  MessageSquareQuote,
  AlertTriangle,
  Sparkles,
  Target,
} from 'lucide-react';
import { type IntelligenceBriefing, PillarId } from '../utils/intelligenceEngine';

interface EliteBrainDojoSectionProps {
  briefing: IntelligenceBriefing;
  onSelectPillar: (pillar: PillarId) => void;
}

interface DojoScenarioContent {
  bigPictureVibe: string;
  pillars: {
    icon: string;
    pillar: PillarId;
    headline: string;
    analogy: string;
    past: string;
    present: string;
    future: string;
  }[];
  dotChainFormula: string;
  dotChainExplanation: string;
  mentalModelName: string;
  mentalModelExplanation: string;
  bookTitle: string;
  bookAuthor: string;
  bookPrinciple: string;
  titanWinner: string;
  titanWhatTheySaw: string;
  titanicLoser: string;
  titanicMistake: string;
  charismaBook: string;
  charismaRuleTitle: string;
  charismaRuleAction: string;
  brainChallengeQuestion: string;
  brainChallengeOptions: {
    id: string;
    label: string;
    verdict: string;
    isOptimal: boolean;
  }[];
}

const DOJO_SCENARIOS: Record<string, DojoScenarioContent> = {
  default: {
    bigPictureVibe:
      'Machi, ulagam ippo "Software Hype" lendhu "Hard-Tech Physics" ku shift aagiduchu! Yaru chip-ku ulla irukira heat-ayum 265km low-orbit satellites-ayum control panrangalo, avanga dhaan next 10 years-ku global economy & defence-oda Boss.',
    pillars: [
      {
        icon: '⚛️',
        pillar: PillarId.PHYSICS,
        headline: 'Direct-Bonded GaN-on-Diamond Breaks the Kapitza Heat Wall',
        analogy:
          'Gaming laptop-la fan-eh illama direct-ah ice-cube highway-la processor-ah weld panna eppadi irukumo, adhaan GaN-on-Diamond!',
        past: 'Silicon Carbide chips hit a 350 W/m·K heat bottleneck because the glue layer trapped acoustic phonons.',
        present:
          '2.1nm atomic surface bonding fuses Gallium Nitride directly to synthetic diamond (1,850 W/m·K), tripling radar power.',
        future:
          'Next 5 years-la liquid cooling illama satellites & 6G towers 3x range-la operate aagum.',
      },
      {
        icon: '💻',
        pillar: PillarId.TECH,
        headline: 'Radiation-Hardened 3D Chiplets Bring 14.2ms AI Brain to Orbit',
        analogy:
          'CCTV footage-ah server-ku anuppama, camera-kullaye inspector ukkandhu 14 milliseconds-la thief-ah pidikira maari!',
        past: 'Satellites were dumb cameras waiting 45 minutes to downlink raw data to ground stations.',
        present:
          'Diamond-cooled 3D NPU chiplets classify SAR radar targets in orbit in 14.2ms, cutting bandwidth by 99.4%.',
        future:
          'Autonomous orbital clouds will route naval and financial telemetry without touching Earth fiber.',
      },
      {
        icon: '🚀',
        pillar: PillarId.AEROSPACE,
        headline: 'Atmosphere-Breathing VLEO Swarms Skim Earth at 265km',
        analogy:
          'Petrol bunk-eh pogama highway kaathaye fuel-ah ulla izhuthu odura electric superbike maari!',
        past: 'Below 300km, thick air drag burned satellites within weeks once xenon fuel ran out.',
        present:
          'Scoop-intake Hall thrusters ionize upper-atmosphere N₂/O₂ to fly indefinitely at 265km with +12.4 dB sharper radar.',
        future:
          '265km VLEO becomes the prime real-estate of space—and dead satellites self-clean in 21 days.',
      },
      {
        icon: '🛡️',
        pillar: PillarId.DEFENCE,
        headline: 'Space-Based Bistatic X-Band Radar Exposes Mach-8 Hypersonic Gliders',
        analogy:
          'Compound wall pinnadi olinjirukira thief-ah mela irundhu stadium floodlight adichu kaatura maari!',
        past: 'Hypersonic missiles flew at 55km inside the Earth-curvature blindspot of ground radars.',
        present:
          '265km VLEO satellites shine X-band beams straight down, locking 94.8% track custody on Mach-8 gliders.',
        future:
          'Cheap interceptors guided from space will make $100M offensive hypersonic missiles obsolete.',
      },
      {
        icon: '🌍',
        pillar: PillarId.GEOPOLITICS,
        headline: 'The Equatorial Launch & CVD Diamond Reactor Alliance',
        analogy:
          '1970s-la Crude Oil vachirundhavan Raja; 2026-la Synthetic Diamond Reactors + Equatorial Launchpad vachirukavan dhaan Superpower!',
        past: 'Geopolitics revolved around Middle East oil straits and single-island silicon foundries.',
        present:
          '38% of global CVD diamond wafer capacity and equatorial VLEO corridors are locking into Indo-Pacific pacts.',
        future:
          'Nations trading "Clean Gigawatts + Wafer Foundries + Orbit Access" will set global security terms.',
      },
      {
        icon: '💰',
        pillar: PillarId.MONEY,
        headline: '$418B Sovereign Capital Rotates from Pure SaaS to Hard-Tech Atoms',
        analogy:
          'AI-eh code eludha kattrukittadhum, smart money verum software-ah vittutu power grid & wafer factories-ku odudhu!',
        past: 'For 12 years, Wall Street gave 30x valuations to simple CRUD software while starving factories.',
        present:
          'Deep-tech industrial EV/EBITDA multiples (22.4x) just flipped higher than legacy SaaS (14.8x) on $418B inflows.',
        future:
          '80% of AI-era profits will accrue to physical bottleneck owners: specialty materials, transformers, and orbital sensors.',
      },
    ],
    dotChainFormula:
      '⚛️ Physics (GaN-on-Diamond) ➔ 💻 Tech (14ms Orbital AI) ➔ 🚀 Aerospace (265km VLEO) ➔ 🛡️ Defence (Hypersonic Lock) ➔ 🌍 Geopolitics (Foundry Pacts) ➔ 💰 Money ($418B Hard-Tech Boom)',
    dotChainExplanation:
      'Oru 2.1nm atomic diamond weld chip-oda heat-ah kuraikkudhu ➔ adhanaala 265km VLEO satellite-la high-power radar + AI poda mudiyudhu ➔ adhu hypersonic stealth-ah gaali panni $418B Wall Street panatha hard-tech factories-ku thiruppudhu!',
    mentalModelName:
      'First-Principles Bottleneck Inversion (Feynman + Munger + Musk Synthesis)',
    mentalModelExplanation:
      'Ellarum "AI-ku adutha chatbot enna?" nu yosikkum podhu, First-Principles thinker "Andha AI chip urugama irukka heat enga pogum? Current enga irundhu varum?" nu physical bottleneck-ah invert panni paapaan. Crowd chases the shiny frontend; legends buy the unavoidable physical toll-gate!',
    bookTitle: 'Poor Charlie’s Almanack & Zero to One',
    bookAuthor: 'Charlie Munger & Peter Thiel',
    bookPrinciple:
      'Munger’s "Invert, Always Invert" + Thiel’s "Secrets in Atoms": When software marginal cost drops toward zero via AI, durable monopoly rent shifts to the hardest physical constraint in the supply chain (thermal physics, energy, and orbital geometry).',
    titanWinner: 'Elon Musk (SpaceX Starlink VLEO + Tesla Megapack) & Jensen Huang (NVIDIA Co-Packaged Optics)',
    titanWhatTheySaw:
      'Instead of renting legacy telecom satellites or buying off-the-shelf chips, they went down to raw physics—building in-house thrusters, custom thermal packaging, and vertical power infrastructure before the market realized hardware was the bottleneck.',
    titanicLoser: 'Intel (2015–2021 Foundry Complacency) & Iridium’s 1998 First-Gen Constellation',
    titanicMistake:
      'MBA spreadsheets-ah mattum paathutu physics R&D-ah delay pannaanga! Intel skipped extreme ultraviolet (EUV) lithography early to protect short-term quarterly margins, while 1990s Iridium built heavy, un-upgradable satellites without ground-cost physics—both got crushed when the technology curve shifted.',
    charismaBook: 'Never Split the Difference (Chris Voss) & The Charisma Myth (Olivia Fox Cabane)',
    charismaRuleTitle: 'The "2-Second Feynman Pause" + Low-Vocal Inflection',
    charismaRuleAction:
      'Meeting-la yaaravadhu complex question ketta udane avasara-pattu badhil solladhinga. Take a calm 2-second pause, lower your voice pitch at the end of your sentence, and start with a 1-line physical analogy: "Idha simple-ah sollanum na..." — Instantly room-la unga status 10x uyarum!',
    brainChallengeQuestion:
      'Suppose you are managing a $100M sovereign tech fund in 2026. Everyone is pitching you "AI Wrapper Apps" at 40x revenue. Using today’s 6-Pillar First-Principles Matrix, where do you deploy your capital for maximum 5-year asymmetric upside?',
    brainChallengeOptions: [
      {
        id: 'opt-a',
        label: 'A) Invest in another consumer AI wrapper app with viral marketing',
        verdict:
          '❌ Careful Machi! AI itself writes wrapper code in minutes now—zero moat, high churn. You are buying the Titanic at peak hype.',
        isOptimal: false,
      },
      {
        id: 'opt-b',
        label: 'B) Buy the "Physical Toll-Gates": CVD Diamond wafer tooling, solid-state grid transformers & VLEO optical subsystems',
        verdict:
          '🏆 Spot-on Titan Move! Like Munger & Musk, you inverted the hype and bought the physical bottlenecks that every AI datacenter and defense satellite MUST pay rent to!',
        isOptimal: true,
      },
      {
        id: 'opt-c',
        label: 'C) Hold 100% cash and wait 5 years for all tech uncertainty to settle',
        verdict:
          '⚠️ Too defensive! By the time consensus is 100% certain in 5 years, sovereign pacts will have locked up the 22.4x multiple expansion.',
        isOptimal: false,
      },
    ],
  },
};

export const EliteBrainDojoSection: React.FC<EliteBrainDojoSectionProps> = ({
  briefing,
  onSelectPillar,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const dojo = DOJO_SCENARIOS.default;

  return (
    <section
      id="elite-brain-dojo"
      aria-label="Elite Pattern Recognition Professor & Brain Dojo"
      className="my-10 space-y-6"
    >
      {/* Top Mentor Header Banner */}
      <div className="obsidian-bento-card rounded-2xl p-6 lg:p-8 border">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-mono-tabular uppercase text-cyan-400">
              <Brain className="w-4 h-4" />
              <span>
                ELITE PATTERN PROFESSOR // MUSK × MUNGER × FEYNMAN × NAVAL MENTORSHIP DECK
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Daily 6-Pillar Pulse, First-Principles Brain Dojo &amp; Executive Charisma
            </h2>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-mono-tabular uppercase font-semibold">
            ⚡ BRAIN-FRIENDLY THUNGLISH EDITION · {briefing.dateLabel}
          </span>
        </div>

        {/* PART 1: TODAY'S GLOBAL PULSE & 6-PILLAR BREAKDOWN */}
        <div className="mt-6 space-y-6">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <div className="text-xs font-mono-tabular uppercase text-amber-300 mb-1.5 flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>🎯 PART 1: TODAY&apos;S GLOBAL PULSE &amp; 6-PILLAR BREAKDOWN</span>
            </div>
            <p className="text-sm sm:text-base text-white font-medium leading-relaxed">
              <strong className="text-cyan-300">Big Picture Vibe:</strong> {dojo.bigPictureVibe}
            </p>
          </div>

          {/* 6-Pillar Compact Analogy + Past->Present->Future Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {dojo.pillars.map((item) => (
              <article
                key={item.pillar}
                onClick={() => onSelectPillar(item.pillar)}
                className="p-4 rounded-xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.08] hover:border-cyan-400/40 transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono-tabular uppercase font-bold text-cyan-300">
                    {item.icon} {item.pillar}
                  </span>
                  <span className="text-[10px] font-mono-tabular uppercase text-slate-400">
                    Click to Filter
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-white leading-snug">
                  {item.headline}
                </h3>
                <p className="text-xs text-amber-200/95 bg-amber-500/10 border border-amber-400/25 rounded-lg p-2.5 leading-relaxed">
                  <strong>💡 Simple Analogy:</strong> {item.analogy}
                </p>
                <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
                  <li>
                    <strong className="text-slate-100">⏪ Past:</strong> {item.past}
                  </li>
                  <li>
                    <strong className="text-cyan-300">⏺️ Present:</strong> {item.present}
                  </li>
                  <li>
                    <strong className="text-fuchsia-300">⏩ Future:</strong> {item.future}
                  </li>
                </ul>
              </article>
            ))}
          </div>

          {/* The Dot-Connector Chain */}
          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-400/30 space-y-2">
            <div className="text-xs font-mono-tabular uppercase text-cyan-300 font-semibold flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              <span>🔗 THE DOT-CONNECTOR CHAIN</span>
            </div>
            <p className="text-xs sm:text-sm font-mono-tabular text-white font-semibold">
              {dojo.dotChainFormula}
            </p>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {dojo.dotChainExplanation}
            </p>
          </div>
        </div>
      </div>

      {/* PART 2 & PART 3: ELITE BRAIN DOJO + THE TITAN VS. THE TITANIC */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PART 2: ELITE BRAIN DOJO */}
        <div className="obsidian-bento-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono-tabular uppercase text-violet-300 font-semibold">
            <Compass className="w-4 h-4 text-violet-400" />
            <span>🧠 PART 2: ELITE BRAIN DOJO (CRITICAL THINKING &amp; BOOK WISDOM)</span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
            <div className="text-xs font-mono-tabular uppercase text-cyan-300">
              🔍 First-Principles Mental Model
            </div>
            <h3 className="font-display text-lg font-bold text-white">{dojo.mentalModelName}</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {dojo.mentalModelExplanation}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-400/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono-tabular uppercase text-violet-300">
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                📚 Top Book Reference: {dojo.bookTitle} ({dojo.bookAuthor})
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {dojo.bookPrinciple}
            </p>
          </div>
        </div>

        {/* PART 3: THE TITAN VS. THE TITANIC */}
        <div className="obsidian-bento-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono-tabular uppercase text-emerald-300 font-semibold">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>⚖️ PART 3: THE TITAN VS. THE TITANIC (SUCCESS VS. FAILURE AUTOPSY)</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/30 space-y-1.5">
            <div className="text-xs font-mono-tabular uppercase text-emerald-300 font-semibold">
              🏆 How the Greats Won: {dojo.titanWinner}
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              <strong>What they saw:</strong> {dojo.titanWhatTheySaw}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-400/30 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-mono-tabular uppercase text-rose-300 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>💥 Why the Others Failed: {dojo.titanicLoser}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              <strong>Exact Mistake (Why they crashed):</strong> {dojo.titanicMistake}
            </p>
          </div>
        </div>
      </div>

      {/* PART 4: DAILY CHARISMA & HIGH-STATUS UPGRADE + INTERACTIVE BRAIN CHALLENGE */}
      <div className="obsidian-bento-card rounded-2xl p-6 lg:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono-tabular uppercase text-amber-300 font-semibold">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>⚡ PART 4: DAILY CHARISMA &amp; HIGH-STATUS UPGRADE</span>
          </div>
          <span className="text-xs font-mono-tabular uppercase text-slate-400">
            Source: {dojo.charismaBook}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/30 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono-tabular uppercase text-amber-300 font-semibold">
            <MessageSquareQuote className="w-4 h-4" />
            <span>🗣️ The Charisma Rule: {dojo.charismaRuleTitle}</span>
          </div>
          <p className="text-sm text-white leading-relaxed">{dojo.charismaRuleAction}</p>
        </div>

        {/* Interactive Brain Challenge */}
        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.1] space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono-tabular uppercase text-cyan-300 font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>🎯 TODAY&apos;S BRAIN CHALLENGE (TEST YOUR EXECUTIVE DECISION-MAKING)</span>
          </div>
          <p className="text-sm sm:text-base font-medium text-white">
            {dojo.brainChallengeQuestion}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {dojo.brainChallengeOptions.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedOptionId(opt.id)}
                  className={`text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer ${
                    isSelected
                      ? opt.isOptimal
                        ? 'bg-emerald-500/20 border-emerald-400 text-white font-semibold'
                        : 'bg-rose-500/20 border-rose-400 text-white font-semibold'
                      : 'bg-black/40 border-white/[0.08] text-slate-300 hover:border-cyan-400/40 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {selectedOptionId && (
            <div className="p-4 rounded-xl bg-black/50 border border-cyan-400/40 flex items-start gap-3 text-xs sm:text-sm text-cyan-100">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                {
                  dojo.brainChallengeOptions.find((o) => o.id === selectedOptionId)
                    ?.verdict
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
