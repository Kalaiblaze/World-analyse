import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  ALL_PILLARS,
  DotConnection,
  PillarId,
  buildCrossDomainAdjacencyCount,
  traceCausalChain,
} from '../utils/intelligenceEngine';

interface DotConnectingSectionProps {
  connections: DotConnection[];
  selectedPillar: PillarId | 'ALL';
  onSelectPillar: (pillar: PillarId | 'ALL') => void;
}

export const DotConnectingSection: React.FC<DotConnectingSectionProps> = ({
  connections,
  selectedPillar,
  onSelectPillar,
}) => {
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);

  const visibleConnections = traceCausalChain(connections, selectedPillar);
  const adjacencyCounts = buildCrossDomainAdjacencyCount(connections);

  return (
    <section
      id="dot-matrix"
      aria-labelledby="dot-matrix-heading"
      className="py-12 border-b border-[#D6CEBE]"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <div className="text-xs font-mono-tabular uppercase tracking-widest text-[#9A3412] mb-2">
            03. DOT-CONNECTING MATRIX · CROSS-DOMAIN SYNTHESIS ENGINE
          </div>
          <h2
            id="dot-matrix-heading"
            className="text-2xl lg:text-3xl font-editorial font-semibold text-[#1C1917] tracking-tight"
          >
            How Pillar A Links to Pillar B &amp; Pillar C
          </h2>
          <p className="mt-2 text-sm text-[#57534E] max-w-2xl leading-relaxed">
            No domain operates in isolation. Inspect the active second- and third-order transmission
            chains below to see how breakthroughs in Physics or Tech cascade through Aerospace and
            Defence to reshape Geopolitics and Global Capital Markets.
          </p>
        </div>

        {/* Pillar Coupling Density Summary */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono-tabular text-[#57534E]">
          <span>Coupling Density:</span>
          {ALL_PILLARS.map((p, idx) => (
            <React.Fragment key={p}>
              {idx > 0 && <span aria-hidden="true">·</span>}
              <button
                type="button"
                onClick={() => onSelectPillar(selectedPillar === p ? 'ALL' : p)}
                className={`cursor-pointer hover:underline ${
                  selectedPillar === p ? 'font-bold text-[#9A3412]' : 'text-[#1C1917]'
                }`}
              >
                {p}: {adjacencyCounts[p]}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Causal Chain Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {visibleConnections.map((conn, index) => {
          const isExpanded = selectedChainId === conn.id;
          return (
            <article
              key={conn.id}
              className={`surface-3d-card p-6 rounded-lg transition-colors ${
                isExpanded ? 'bg-[#F3EFE6]' : 'bg-[#FBF9F5]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tabular text-[#78716C] mb-3">
                <span>CHAIN 0{index + 1}</span>
                <span>VELOCITY: {conn.velocityHorizon}</span>
              </div>

              <h3 className="text-xl font-editorial font-semibold text-[#1C1917] mb-4">
                {conn.title}
              </h3>

              {/* 3-Hop Pillar Flow Strip: Pillar A -> Pillar B -> Pillar C */}
              <div className="flex flex-wrap items-center gap-2 p-3.5 bg-[#F3EFE6] border border-[#D6CEBE] rounded-md mb-5 text-xs font-mono-tabular">
                <button
                  type="button"
                  onClick={() => onSelectPillar(conn.sourcePillar)}
                  className="font-semibold text-[#9A3412] hover:underline cursor-pointer"
                >
                  [A] {conn.sourcePillar}
                </button>
                <ArrowRight className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
                <button
                  type="button"
                  onClick={() => onSelectPillar(conn.intermediatePillar)}
                  className="font-semibold text-[#1E3A8A] hover:underline cursor-pointer"
                >
                  [B] {conn.intermediatePillar}
                </button>
                <ArrowRight className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
                <button
                  type="button"
                  onClick={() => onSelectPillar(conn.targetPillar)}
                  className="font-semibold text-[#14532D] hover:underline cursor-pointer"
                >
                  [C] {conn.targetPillar}
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs font-mono-tabular uppercase tracking-wider text-[#9A3412] mb-1">
                    Thunglish Dot-Connection:
                  </div>
                  <p className="text-[#1C1917] font-medium leading-relaxed">
                    “{conn.thunglishBreakdown}”
                  </p>
                </div>

                <div>
                  <div className="text-xs font-mono-tabular uppercase tracking-wider text-[#57534E] mb-1">
                    Structural Transmission Mechanism:
                  </div>
                  <p className="text-[#44403C] leading-relaxed">{conn.transmissionMechanism}</p>
                </div>

                <div className="pt-3 border-t border-[#E7E2D8] flex items-center justify-between gap-4">
                  <p className="text-xs text-[#57534E]">
                    <strong className="font-semibold text-[#1C1917]">Strategic / Market Impact: </strong>
                    {conn.marketOrStrategicImpact}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedChainId(isExpanded ? null : conn.id)
                    }
                    className="text-xs font-mono-tabular font-semibold text-[#9A3412] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {isExpanded ? 'Hide Trace' : 'Pin Chain'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Tabular Cross-Domain Transmission Matrix Table */}
      <div className="overflow-x-auto border border-[#D6CEBE] rounded-lg bg-[#FBF9F5]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#D6CEBE] bg-[#F3EFE6] font-mono-tabular text-[#57534E]">
              <th className="py-3 px-4 font-semibold">Chain ID</th>
              <th className="py-3 px-4 font-semibold">Pillar A (Origin)</th>
              <th className="py-3 px-4 font-semibold">Pillar B (Amplifier)</th>
              <th className="py-3 px-4 font-semibold">Pillar C (Endgame)</th>
              <th className="py-3 px-4 font-semibold">Transmission Velocity</th>
              <th className="py-3 px-4 font-semibold">Primary Capital / Strategic Consequence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E2D8]">
            {connections.map((conn, idx) => (
              <tr
                key={conn.id}
                className="hover:bg-[#F3EFE6]/50 transition-colors"
              >
                <td className="py-3 px-4 font-mono-tabular font-medium text-[#9A3412] whitespace-nowrap">
                  M-0{idx + 1}
                </td>
                <td className="py-3 px-4 font-medium text-[#1C1917] whitespace-nowrap">
                  {conn.sourcePillar}
                </td>
                <td className="py-3 px-4 font-medium text-[#1E3A8A] whitespace-nowrap">
                  {conn.intermediatePillar}
                </td>
                <td className="py-3 px-4 font-medium text-[#14532D] whitespace-nowrap">
                  {conn.targetPillar}
                </td>
                <td className="py-3 px-4 font-mono-tabular text-[#57534E] whitespace-nowrap">
                  {conn.velocityHorizon}
                </td>
                <td className="py-3 px-4 text-[#44403C]">{conn.marketOrStrategicImpact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
