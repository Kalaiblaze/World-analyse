export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  baseDelayMs = 600
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    if (response.ok) {
      return response;
    }
    if (
      (response.status === 429 || response.status >= 500) &&
      attempt < maxRetries
    ) {
      const retryAfter = Number(response.headers.get('Retry-After'));
      const delay =
        !Number.isNaN(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : baseDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `HTTP ${response.status} (${response.statusText}) from ${url}: ${errorBody.slice(0, 300)}`
    );
  }
  throw new Error(`Exhausted retries for ${url}`);
}

export interface BioscienceTargetExample {
  id: string;
  geneSymbol: string;
  uniprotAccession: string;
  pdbId: string;
  chemblTargetId: string;
  pubchemCid: number;
  compoundName: string;
  chrom: string;
  pos: number;
  refAllele: string;
  altAllele: string;
  clinicalSignificance: 'Pathogenic' | 'Likely Pathogenic' | 'Uncertain Significance' | 'Benign';
  plddtMean: number;
  thunglishBioBrief: string;
  crossDomainNexus: string;
}

export const CURATED_BIOSCIENCE_TARGETS: BioscienceTargetExample[] = [
  {
    id: 'tp53-p04637',
    geneSymbol: 'TP53',
    uniprotAccession: 'P04637',
    pdbId: '1TUP',
    chemblTargetId: 'CHEMBL4096',
    pubchemCid: 135398738,
    compoundName: 'Eprenetapopt (APR-246)',
    chrom: '17',
    pos: 7674220,
    refAllele: 'C',
    altAllele: 'T',
    clinicalSignificance: 'Pathogenic',
    plddtMean: 84.6,
    thunglishBioBrief:
      'Machi, TP53 dhaan human cell-oda "Guardian of the Genome"! DNA damage aana udane cell division-a niruthura chief security guard. R248Q mutation vandhaa guard thungiyliduvaaru.',
    crossDomainNexus:
      'Physics (Cryo-EM & AlphaFold 3D folding) -> Tech (AI drug docking) -> Defence (Radiation countermeasure biodefense for spaceflight crews) -> Money ($180B oncology market shift).',
  },
  {
    id: 'brca1-p38398',
    geneSymbol: 'BRCA1',
    uniprotAccession: 'P38398',
    pdbId: '1JM7',
    chemblTargetId: 'CHEMBL5990',
    pubchemCid: 23725625,
    compoundName: 'Olaparib (PARP Inhibitor)',
    chrom: '17',
    pos: 43094464,
    refAllele: 'G',
    altAllele: 'A',
    clinicalSignificance: 'Pathogenic',
    plddtMean: 76.2,
    thunglishBioBrief:
      'BRCA1 RING domain double-strand DNA break repair-ku main carpenter maadhiri. Synthetic lethality: BRCA1 fail aana cell-la PARP enzyme-ayum block panna cancer cell gaali!',
    crossDomainNexus:
      'Physics (X-ray crystallography) -> Tech (Genomic variant VEP pipelines) -> Geopolitics (National population biobanks & genomic sovereignty) -> Money (Precision medicine ETF flows).',
  },
  {
    id: 'egfr-p00533',
    geneSymbol: 'EGFR',
    uniprotAccession: 'P00533',
    pdbId: '1M17',
    chemblTargetId: 'CHEMBL203',
    pubchemCid: 71496458,
    compoundName: 'Osimertinib (AZD9291)',
    chrom: '7',
    pos: 55191822,
    refAllele: 'T',
    altAllele: 'G',
    clinicalSignificance: 'Pathogenic',
    plddtMean: 89.4,
    thunglishBioBrief:
      'EGFR kinase domain cell growth-ku accelerator pedal. L858R / T790M mutation vandhaa pedal jam aagi non-stop signalling pogum; Osimertinib covalent bond pottu lock pannum.',
    crossDomainNexus:
      'Physics (Quantum covalent bonding) -> Tech (Generative small-molecule design) -> Geopolitics (API chemical supply-chain reshoring) -> Money (Biotech M&A patent cliff arbitrage).',
  },
  {
    id: 'abl1-p00520',
    geneSymbol: 'ABL1',
    uniprotAccession: 'P00520',
    pdbId: '2HYY',
    chemblTargetId: 'CHEMBL1862',
    pubchemCid: 5291,
    compoundName: 'Imatinib (STI-571)',
    chrom: '9',
    pos: 130872896,
    refAllele: 'C',
    altAllele: 'T',
    clinicalSignificance: 'Likely Pathogenic',
    plddtMean: 91.8,
    thunglishBioBrief:
      'ABL1 tyrosine kinase ATP pocket-la Imatinib exact-a key lock-la porundhura maadhiri DFG-out conformation-a freeze pannum. Rational drug design-ku idhaan gold standard!',
    crossDomainNexus:
      'Physics (Thermodynamic free-energy perturbation) -> Tech (GPU molecular dynamics) -> Defence (Rapid pathogen & toxin countermeasure screening) -> Money (Royalty pharma cashflows).',
  },
];

export interface AlphaFoldPredictionSummary {
  entryId: string;
  gene: string;
  uniprotAccession: string;
  uniprotDescription: string;
  organismScientificName: string;
  sequenceLength: number;
  cifUrl: string;
  pdbUrl: string;
  paeDocUrl: string;
  plddtScore: number;
  plddtBand: {
    label: string;
    colorHex: string;
  };
  provenance: '[Predicted by model]';
}

export interface PubChemCompoundSummary {
  cid: number;
  molecularFormula: string;
  molecularWeight: string;
  canonicalSmiles: string;
  xlogp: number;
  tpsa: number;
  hBondDonors: number;
  hBondAcceptors: number;
  lipinskiPass: boolean;
  image2dUrl: string;
  provenance: '[Experimentally determined]';
}

export function classifyPlddtBand(plddt: number): { label: string; colorHex: string } {
  if (plddt > 90) {
    return { label: 'Very High (>90)', colorHex: '#0053D6' };
  }
  if (plddt >= 70) {
    return { label: 'Confident (70-90)', colorHex: '#65CBF3' };
  }
  if (plddt >= 50) {
    return { label: 'Low (50-70)', colorHex: '#FFDB13' };
  }
  return { label: 'Very Low (<50)', colorHex: '#FF7D45' };
}

export function buildAlphaGenomeVariantLink(params: {
  chrom: string;
  pos: number;
  ref: string;
  alt: string;
}): string {
  const cleanChrom = params.chrom.replace(/^chr/i, '');
  const queryVal = `chr${cleanChrom}:${params.pos}:${params.ref}>${params.alt}`;
  const searchParams = new URLSearchParams({
    q: queryVal,
    m: 'variant',
    lItems: 'avi,section:RNA_SEQ,section:DNASE,section:CHIP_TF',
  });
  return `https://deepmind.google.com/science/alphagenome/atlas?${searchParams.toString()}`;
}
