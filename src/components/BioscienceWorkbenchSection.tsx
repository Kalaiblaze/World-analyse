import React, { useEffect, useState } from 'react';
import { Dna, ExternalLink, FlaskConical, ShieldAlert } from 'lucide-react';
import {
  type AlphaFoldPredictionSummary,
  type BioscienceTargetExample,
  CURATED_BIOSCIENCE_TARGETS,
  type PubChemCompoundSummary,
  buildAlphaGenomeVariantLink,
  classifyPlddtBand,
} from '../utils/scienceEngine';

interface BioscienceApiResponse {
  target: BioscienceTargetExample;
  targetsCatalog: BioscienceTargetExample[];
  alphafold: AlphaFoldPredictionSummary;
  pubchem: PubChemCompoundSummary;
  alphaGenomeLink: string;
  externalLinks: {
    uniprot: string;
    alphafold: string;
    rcsbPdb: string;
    chembl: string;
    pubchem: string;
    clinvar: string;
  };
}

export const BioscienceWorkbenchSection: React.FC = () => {
  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    CURATED_BIOSCIENCE_TARGETS[0].id
  );
  const [data, setData] = useState<BioscienceApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedResidueDomain, setSelectedResidueDomain] = useState<
    'DNA-Binding / Core' | 'Kinase / Catalytic Pocket' | 'Regulatory Loop'
  >('DNA-Binding / Core');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch(`/api/science/target?id=${encodeURIComponent(selectedTargetId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: BioscienceApiResponse | null) => {
        if (!cancelled && json) {
          setData(json);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedTargetId]);

  const activeTarget =
    data?.target ??
    CURATED_BIOSCIENCE_TARGETS.find((t) => t.id === selectedTargetId) ??
    CURATED_BIOSCIENCE_TARGETS[0];

  const plddtBand = data?.alphafold?.plddtBand ?? classifyPlddtBand(activeTarget.plddtMean);
  const alphaGenomeUrl =
    data?.alphaGenomeLink ??
    buildAlphaGenomeVariantLink({
      chrom: activeTarget.chrom,
      pos: activeTarget.pos,
      ref: activeTarget.refAllele,
      alt: activeTarget.altAllele,
    });

  return (
    <section
      id="bioscience-workbench"
      aria-labelledby="bioscience-workbench-heading"
      className="my-12 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] p-6 lg:p-8 shadow-[0_6px_0_0_#1C1917]"
    >
      {/* Scientific Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular text-[#0B57D0] font-semibold">
            <Dna className="w-4 h-4" />
            <span>DEEPMIND &amp; EMBL-EBI BIOSCIENCE INTELLIGENCE WORKBENCH</span>
            <span className="px-2 py-0.5 rounded bg-[#0B57D0]/10 text-[#0B57D0]">
              ⚡ DOT CONNECTED TO PHYSICS &amp; DEFENCE
            </span>
          </div>
          <h2
            id="bioscience-workbench-heading"
            className="font-editorial text-2xl lg:text-3xl font-bold text-[#0F172A]"
          >
            Structural Biology, AlphaFold DB, ClinVar &amp; ChEMBL Biodefense Matrix
          </h2>
        </div>

        {/* Top Quick-Try Example Pill Bar (Mandatory Science Skill Pattern) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono-tabular text-slate-500">QUICK-TRY TARGETS:</span>
          {CURATED_BIOSCIENCE_TARGETS.map((item) => {
            const isActive = item.id === activeTarget.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedTargetId(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-tabular font-semibold border transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#0B57D0] text-white border-[#0B57D0]'
                    : 'bg-white text-slate-700 border-[#E2E8F0] hover:border-[#0B57D0]'
                }`}
              >
                {item.geneSymbol} ({item.uniprotAccession})
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-Pane Split Interactive Canvas + Synchronized Data Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Pane: 3D AlphaFold Structure Confidence Canvas + 2D Ligand Depiction */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-xl bg-[#0F172A] text-white p-5 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-mono-tabular text-sky-400">
                  ALPHAFOLD DB v6 // {activeTarget.uniprotAccession} · PDB: {activeTarget.pdbId}
                </span>
                <h3 className="text-base font-bold">
                  {activeTarget.geneSymbol} Macromolecular Fold &amp; Pocket Topology
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded text-[11px] font-mono-tabular font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                {data?.alphafold?.provenance ?? '[Predicted by model]'}
              </span>
            </div>

            {/* Interactive SVG 3D Macromolecular Fold Diagram Colored by Canonical pLDDT Scale */}
            <div className="relative rounded-lg bg-slate-950 border border-slate-800 p-4 flex flex-col items-center justify-center min-h-[230px]">
              <svg
                viewBox="0 0 520 210"
                className="w-full h-48"
                role="img"
                aria-label={`AlphaFold 3D ribbon diagram for ${activeTarget.geneSymbol}`}
              >
                <defs>
                  <linearGradient id="plddtGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0053D6" />
                    <stop offset="55%" stopColor="#65CBF3" />
                    <stop offset="85%" stopColor="#FFDB13" />
                    <stop offset="100%" stopColor="#FF7D45" />
                  </linearGradient>
                </defs>
                {/* Coordinate grid */}
                <line x1="20" y1="105" x2="500" y2="105" stroke="#1E293B" strokeWidth="1" />
                <line x1="260" y1="15" x2="260" y2="195" stroke="#1E293B" strokeWidth="1" />
                {/* AlphaFold Backbone Ribbon */}
                <path
                  d="M 45 140 C 95 35, 145 180, 195 75 C 245 -10, 295 190, 345 85 C 395 15, 435 165, 480 95"
                  fill="none"
                  stroke="url(#plddtGrad)"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                {/* Highlighted catalytic / DNA-binding nodes */}
                <circle
                  cx="195"
                  cy="75"
                  r="14"
                  fill="#0053D6"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                />
                <circle
                  cx="345"
                  cy="85"
                  r="13"
                  fill="#65CBF3"
                  stroke="#0F172A"
                  strokeWidth="2"
                />
                <circle
                  cx="265"
                  cy="115"
                  r="10"
                  fill="#F43F5E"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                <text
                  x="195"
                  y="46"
                  textAnchor="middle"
                  fill="#E2E8F0"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  {selectedResidueDomain}
                </text>
                <text
                  x="265"
                  y="145"
                  textAnchor="middle"
                  fill="#FDA4AF"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  Ligand: {activeTarget.compoundName}
                </text>
              </svg>

              {/* Domain Selector Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                {(
                  [
                    'DNA-Binding / Core',
                    'Kinase / Catalytic Pocket',
                    'Regulatory Loop',
                  ] as const
                ).map((dom) => (
                  <button
                    key={dom}
                    type="button"
                    onClick={() => setSelectedResidueDomain(dom)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono-tabular cursor-pointer border ${
                      selectedResidueDomain === dom
                        ? 'bg-[#0053D6] text-white border-sky-300'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    {dom}
                  </button>
                ))}
              </div>
            </div>

            {/* Canonical 4-Band AlphaFold pLDDT Confidence Scale */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono-tabular">
                <span className="text-slate-300">
                  ALPHAFOLD pLDDT CONFIDENCE: <strong>{activeTarget.plddtMean}</strong> (
                  {plddtBand.label})
                </span>
                <a
                  href={
                    data?.alphafold?.cifUrl ??
                    `https://alphafold.ebi.ac.uk/files/AF-${activeTarget.uniprotAccession}-F1-model_v6.cif`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-300 hover:underline inline-flex items-center gap-1"
                >
                  <span>Download mmCIF (_v6)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono-tabular">
                <div className="px-2 py-1 rounded bg-[#0053D6] text-white font-semibold">
                  &gt;90 Very High
                </div>
                <div className="px-2 py-1 rounded bg-[#65CBF3] text-slate-950 font-semibold">
                  70-90 Confident
                </div>
                <div className="px-2 py-1 rounded bg-[#FFDB13] text-slate-950 font-semibold">
                  50-70 Low
                </div>
                <div className="px-2 py-1 rounded bg-[#FF7D45] text-slate-950 font-semibold">
                  &lt;50 Very Low
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Synchronized Genomic, Clinical & Pharmacology Inspector */}
        <div className="lg:col-span-6 space-y-4">
          {/* Thunglish Bio-Intelligence & Cross-Domain Dot Card */}
          <div className="rounded-xl bg-white border border-[#E2E8F0] p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono-tabular font-bold text-[#0D9488] uppercase">
                🧬 NEXUS-7 THUNGLISH BIO-SYNTHESIS
              </span>
              <span className="px-2.5 py-0.5 rounded bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30 text-xs font-mono-tabular font-bold inline-flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                ClinVar: {activeTarget.clinicalSignificance}
              </span>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              {activeTarget.thunglishBioBrief}
            </p>
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-slate-700">
              <strong className="font-mono-tabular text-[#0B57D0]">
                🔗 CROSS-PILLAR DOT CONNECTION:
              </strong>{' '}
              {activeTarget.crossDomainNexus}
            </div>
          </div>

          {/* PubChem & ChEMBL Bioactivity + AlphaGenome Atlas Link */}
          <div className="rounded-xl bg-white border border-[#E2E8F0] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-[#0B57D0]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Ligand &amp; Genomic Variant Inspector: {activeTarget.compoundName}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 text-[11px] font-mono-tabular font-semibold">
                {data?.pubchem?.provenance ?? '[Experimentally determined]'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono-tabular">
              <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="text-slate-500 text-[10px]">PUBCHEM CID</div>
                <div className="font-bold text-slate-900">{activeTarget.pubchemCid}</div>
              </div>
              <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="text-slate-500 text-[10px]">FORMULA / MW</div>
                <div className="font-bold text-slate-900">
                  {data?.pubchem?.molecularFormula ?? 'C29H31N7O'} (
                  {data?.pubchem?.molecularWeight ?? '493.6'} g/mol)
                </div>
              </div>
              <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="text-slate-500 text-[10px]">XLOGP / TPSA</div>
                <div className="font-bold text-slate-900">
                  {data?.pubchem?.xlogp ?? 3.5} / {data?.pubchem?.tpsa ?? 86.3} Å²
                </div>
              </div>
              <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="text-slate-500 text-[10px]">LIPINSKI RO5</div>
                <div className="font-bold text-emerald-700">
                  {data?.pubchem?.lipinskiPass !== false ? 'PASS (Druglike)' : 'VIOLATION'}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] font-mono-tabular text-slate-700 truncate">
              <strong>SMILES:</strong>{' '}
              {data?.pubchem?.canonicalSmiles ??
                'CC1=C(C=C(C=C1)NC(=O)C2=CC=C(C=C2)CN3CCN(CC3)C)NC4=NC=CC(=N4)C5=CN=CC=C5'}
            </div>

            {/* Authoritative Provenance & Deep-Link Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E2E8F0] text-xs font-mono-tabular">
              <a
                href={alphaGenomeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#0B57D0] text-white font-semibold hover:bg-[#1A73E8]"
              >
                <span>AlphaGenome Atlas (chr{activeTarget.chrom}:{activeTarget.pos})</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={`https://www.uniprot.org/uniprotkb/${activeTarget.uniprotAccession}/entry`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-white border border-[#E2E8F0] text-slate-700 hover:border-[#0B57D0]"
              >
                <span>UniProtKB</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={`https://www.rcsb.org/structure/${activeTarget.pdbId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-white border border-[#E2E8F0] text-slate-700 hover:border-[#0B57D0]"
              >
                <span>RCSB PDB ({activeTarget.pdbId})</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={`https://www.ebi.ac.uk/chembl/target_report_card/${activeTarget.chemblTargetId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-white border border-[#E2E8F0] text-slate-700 hover:border-[#0B57D0]"
              >
                <span>ChEMBL ({activeTarget.chemblTargetId})</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              {isLoading && (
                <span className="text-slate-400 text-[11px]">Syncing live APIs...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
