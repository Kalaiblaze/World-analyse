import {
  type IntelligenceBriefing,
  PillarId,
  generateDeterministicBriefing,
} from './intelligenceEngine.ts';

export interface SubstackSource {
  id: string;
  name: string;
  author: string;
  handle: string;
  feedUrl: string;
  siteUrl: string;
  primaryPillar: PillarId;
  secondaryPillar: PillarId;
  description: string;
}

export interface SubstackArticle {
  id: string;
  sourceId: string;
  publicationName: string;
  author: string;
  title: string;
  subtitle: string;
  publishedAt: string;
  url: string;
  primaryPillar: PillarId;
  excerpt: string;
  briefingId?: string;
}

export const CURATED_SUBSTACK_SOURCES: SubstackSource[] = [
  {
    id: 'construction-physics',
    name: 'Construction Physics',
    author: 'Brian Potter',
    handle: 'constructionphysics.substack.com',
    feedUrl: 'https://www.construction-physics.com/feed',
    siteUrl: 'https://www.construction-physics.com',
    primaryPillar: PillarId.PHYSICS,
    secondaryPillar: PillarId.AEROSPACE,
    description: 'Deep dives into materials physics, titanium forging, jet turbines, and why industrial hardware scales or stalls.',
  },
  {
    id: 'semianalysis',
    name: 'SemiAnalysis',
    author: 'Dylan Patel & Team',
    handle: 'semianalysis.substack.com',
    feedUrl: 'https://www.semianalysis.com/feed',
    siteUrl: 'https://www.semianalysis.com',
    primaryPillar: PillarId.TECH,
    secondaryPillar: PillarId.MONEY,
    description: 'Semiconductor supply chains, CoWoS packaging, EUV lithography physics, and AI datacenter gigawatt bottlenecks.',
  },
  {
    id: 'chartbook',
    name: 'Chartbook',
    author: 'Adam Tooze',
    handle: 'adamtooze.substack.com',
    feedUrl: 'https://adamtooze.substack.com/feed',
    siteUrl: 'https://adamtooze.substack.com',
    primaryPillar: PillarId.GEOPOLITICS,
    secondaryPillar: PillarId.MONEY,
    description: 'Geopolitical economy, sovereign debt flows, industrial policy wars, and multi-polar trade realignments.',
  },
  {
    id: 'noahpinion',
    name: 'Noahpinion',
    author: 'Noah Smith',
    handle: 'noahpinion.substack.com',
    feedUrl: 'https://www.noahpinion.blog/feed',
    siteUrl: 'https://www.noahpinion.blog',
    primaryPillar: PillarId.MONEY,
    secondaryPillar: PillarId.GEOPOLITICS,
    description: 'Techno-industrial macroeconomics, allied manufacturing capacity, defense industrial base, and Asian supply chains.',
  },
  {
    id: 'phillips-obrien',
    name: 'Phillips’s Newsletter',
    author: 'Prof. Phillips P. O’Brien',
    handle: 'phillipspobrien.substack.com',
    feedUrl: 'https://phillipspobrien.substack.com/feed',
    siteUrl: 'https://phillipspobrien.substack.com',
    primaryPillar: PillarId.DEFENCE,
    secondaryPillar: PillarId.AEROSPACE,
    description: 'Strategic studies, autonomous drone/missile attrition warfare, air-denial campaigns, and modern C4ISR doctrine.',
  },
  {
    id: 'doomberg',
    name: 'Doomberg',
    author: 'Doomberg Collective',
    handle: 'doomberg.substack.com',
    feedUrl: 'https://doomberg.substack.com/feed',
    siteUrl: 'https://doomberg.substack.com',
    primaryPillar: PillarId.PHYSICS,
    secondaryPillar: PillarId.GEOPOLITICS,
    description: 'Hard-nosed thermodynamic reality checks on global energy grids, nuclear/fusion physics, LNG, and commodity markets.',
  },
];

export const FEATURED_SUBSTACK_DISPATCHES: SubstackArticle[] = [
  {
    id: 'sub-dispatch-1',
    sourceId: 'semianalysis',
    publicationName: 'SemiAnalysis (Substack)',
    author: 'Dylan Patel',
    title: 'The Thermal Wall & GaN-on-Diamond: Why Next-Gen Radars and AI Pods Are Melting Silicon',
    subtitle: 'Inside the heterogeneous integration race where synthetic diamond wafers and 265km VLEO edge chiplets rewrite defense and cloud capex.',
    publishedAt: 'Nov 2, 2026',
    url: 'https://www.semianalysis.com',
    primaryPillar: PillarId.TECH,
    excerpt:
      'As transistor density hits physical phonon limits, packaging engineers in Tokyo,新竹 (Hsinchu), and Bengaluru are turning to low-temperature direct-bonded CVD diamond substrates—unlocking 3x continuous-wave RF power for orbital AESA radars and sub-15ms edge inference.',
    briefingId: '2026-11-02-diamond-hypersonic',
  },
  {
    id: 'sub-dispatch-2',
    sourceId: 'chartbook',
    publicationName: 'Chartbook by Adam Tooze (Substack)',
    author: 'Adam Tooze',
    title: 'Chartbook #412: Sub-Sea Cable Chokepoints vs. The New Vacuum-Optical Sovereignty',
    subtitle: 'When 98% of intercontinental clearing passes through contested narrow straits, 1.6-Terabit free-space laser meshes become central bank policy.',
    publishedAt: 'Oct 30, 2026',
    url: 'https://adamtooze.substack.com',
    primaryPillar: PillarId.GEOPOLITICS,
    excerpt:
      'From Bab-el-Mandeb to the Luzon Strait, submarine fiber optic cables have become the soft underbelly of global financial plumbing. Now, coherent 1550nm inter-satellite laser links are routing high-value FX and naval telemetry through vacuum at 47% faster speed than silica glass.',
    briefingId: '2026-10-30-orbital-optical-chokepoints',
  },
  {
    id: 'sub-dispatch-3',
    sourceId: 'construction-physics',
    publicationName: 'Construction Physics (Substack)',
    author: 'Brian Potter',
    title: 'How 22-Tesla REBCO Superconducting Tape Escaped the Fusion Lab',
    subtitle: 'Why thirty-five years of thin-film crystallography is suddenly paying off in megawatt aircraft motors, naval destroyers, and AI datacenter busbars.',
    publishedAt: 'Oct 26, 2026',
    url: 'https://www.construction-physics.com',
    primaryPillar: PillarId.PHYSICS,
    excerpt:
      'High-temperature superconductors were long dismissed as brittle laboratory curiosities. By doping REBCO tape with nanoscale Hafnium pinning centers on Hastelloy steel ribbons, manufacturers have crossed 16,500 km/yr output—slashing Dysprosium rare-earth magnet needs by 94%.',
    briefingId: '2026-10-26-hts-magnetics-fusion-grid',
  },
  {
    id: 'sub-dispatch-4',
    sourceId: 'phillips-obrien',
    publicationName: 'Phillips’s Newsletter (Substack)',
    author: 'Prof. Phillips P. O’Brien',
    title: 'The Death of the Unseen Glider: Space-Based Bistatic Radar and Attritable Interceptors',
    subtitle: 'Why expensive crewed AWACS aircraft are yielding to distributed VLEO illuminators and cold-atom quantum navigation swarms.',
    publishedAt: 'Nov 1, 2026',
    url: 'https://phillipspobrien.substack.com',
    primaryPillar: PillarId.DEFENCE,
    excerpt:
      'Air-denial warfare has shifted from platform prestige to sensor custody. When a 265km VLEO constellation shines high-duty-cycle X-band energy down on a Mach-8 glide vehicle, stealth shaping designed against ground radars becomes a giant top-side reflector.',
  },
  {
    id: 'sub-dispatch-5',
    sourceId: 'noahpinion',
    publicationName: 'Noahpinion (Substack)',
    author: 'Noah Smith',
    title: 'The Great Industrial Capex Rotation: Why Sovereign Wealth Is Dumping SaaS for Foundries',
    subtitle: 'In a world of 4.2% real rates and fragmented supply chains, physical bottlenecks in metallurgy, power grids, and propulsion capture all the economic rent.',
    publishedAt: 'Oct 29, 2026',
    url: 'https://www.noahpinion.blog',
    primaryPillar: PillarId.MONEY,
    excerpt:
      'For twelve years, venture and pension capital treated atoms as toxic and software bits as infinite-margin gold. Now AI itself has made software cheap to write while making transformers, specialty wafers, and launch capacity the scarcest assets on Earth.',
  },
  {
    id: 'sub-dispatch-6',
    sourceId: 'doomberg',
    publicationName: 'Doomberg (Substack)',
    author: 'Doomberg',
    title: 'Copper Trench Gridlock and the Cryogenic Datacenter Spine',
    subtitle: 'You cannot plug a 1-Gigawatt AI cluster into a 1970s suburban substation without rewriting Ohm’s Law via superconducting MVDC conduits.',
    publishedAt: 'Oct 27, 2026',
    url: 'https://doomberg.substack.com',
    primaryPillar: PillarId.PHYSICS,
    excerpt:
      'Physics does not negotiate with hyperscaler earnings calls. With high-voltage transformer lead times stretching past 40 months, medium-voltage superconducting DC busbars are emerging as the only viable right-of-way bypass for urban gigawatt compute hubs.',
  },
];

/**
 * Strips CDATA wrappers and HTML tags from RSS XML fields cleanly.
 */
export function cleanRssText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses a raw Substack RSS XML string into structured SubstackArticle items.
 */
export function parseSubstackRssXml(
  xml: string,
  source: SubstackSource,
  maxItems = 4
): SubstackArticle[] {
  if (!xml || !xml.includes('<item>')) {
    return [];
  }

  const itemBlocks = xml.split('<item>').slice(1, maxItems + 1);
  const articles: SubstackArticle[] = [];

  itemBlocks.forEach((block, idx) => {
    const endIdx = block.indexOf('</item>');
    const content = endIdx !== -1 ? block.slice(0, endIdx) : block;

    const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = content.match(/<link>([\s\S]*?)<\/link>/i);
    const pubDateMatch = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const descMatch = content.match(/<description>([\s\S]*?)<\/description>/i);
    const creatorMatch = content.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/i);

    const title = cleanRssText(titleMatch?.[1] ?? '');
    const link = cleanRssText(linkMatch?.[1] ?? source.siteUrl);
    const rawDesc = cleanRssText(descMatch?.[1] ?? '');
    const author = cleanRssText(creatorMatch?.[1] ?? source.author);

    let formattedDate = 'Recent Dispatch';
    if (pubDateMatch?.[1]) {
      const parsedDate = new Date(cleanRssText(pubDateMatch[1]));
      if (!Number.isNaN(parsedDate.getTime())) {
        formattedDate = parsedDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    }

    if (title) {
      articles.push({
        id: `${source.id}-rss-${idx}-${Date.now()}`,
        sourceId: source.id,
        publicationName: `${source.name} (Substack)`,
        author: author || source.author,
        title,
        subtitle: rawDesc.slice(0, 140) + (rawDesc.length > 140 ? '...' : ''),
        publishedAt: formattedDate,
        url: link,
        primaryPillar: source.primaryPillar,
        excerpt: rawDesc.slice(0, 280) + (rawDesc.length > 280 ? '...' : ''),
      });
    }
  });

  return articles;
}

/**
 * Extracts a clean human-readable article title and publication name from a raw Substack URL or headline.
 */
export function humanizeSubstackInput(rawInput: string): {
  title: string;
  publicationName: string;
  author: string;
} {
  const trimmed = (rawInput ?? '').trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.includes('.substack.com')) {
    return {
      title: trimmed,
      publicationName: 'Substack Dispatch',
      author: 'Substack Intelligence Desk',
    };
  }

  try {
    const normalized = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    const parsedUrl = new URL(normalized);
    const host = parsedUrl.hostname.replace(/^www\./, '');
    const matchedSource = CURATED_SUBSTACK_SOURCES.find(
      (s) => s.siteUrl.includes(host) || s.handle.includes(host)
    );

    const hostBase = host.split('.')[0].replace(/-/g, ' ');
    const publicationName = matchedSource
      ? `${matchedSource.name} (Substack)`
      : `${hostBase.replace(/\b\w/g, (c) => c.toUpperCase())} (Substack)`;
    const author = matchedSource ? matchedSource.author : 'Substack Columnist';

    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
    const slugCandidate =
      pathParts[0] === 'p' && pathParts[1]
        ? pathParts[1]
        : pathParts[pathParts.length - 1] || '';

    if (slugCandidate && slugCandidate !== 'feed') {
      const cleanTitle = slugCandidate
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        title: cleanTitle,
        publicationName,
        author,
      };
    }

    return {
      title: `${publicationName.replace(' (Substack)', '')} Macro & Deep-Tech Dispatch`,
      publicationName,
      author,
    };
  } catch {
    return {
      title: trimmed,
      publicationName: 'Substack Dispatch',
      author: 'Substack Intelligence Desk',
    };
  }
}

/**
 * Converts a SubstackArticle into a full 6-Pillar Thunglish Intelligence Briefing.
 */
export function convertSubstackArticleToBriefing(
  article: SubstackArticle,
  curatedBriefings: IntelligenceBriefing[]
): IntelligenceBriefing {
  if (article.briefingId) {
    const matched = curatedBriefings.find((b) => b.editionId === article.briefingId);
    if (matched) {
      return {
        ...matched,
        groundingSources: [
          {
            title: `${article.publicationName} — ${article.title} (${article.author})`,
            uri: article.url,
          },
        ],
      };
    }
  }

  const baseBriefing = generateDeterministicBriefing(
    `${article.title} (${article.publicationName} by ${article.author})`,
    article.primaryPillar
  );

  return {
    ...baseBriefing,
    volumeCode: `SUBSTACK INTEL · ${article.publicationName.toUpperCase()}`,
    subtitle: `${article.subtitle} — Decoded across Aerospace, Defence, Geopolitics, Money, Technology & Physics in Thunglish.`,
    executiveSummary: {
      ...baseBriefing.executiveSummary,
      bigPictureHeadline: `Substack Dispatch Decode (${article.publicationName}): "${article.title}" — Indha கட்டுரைக்கு பின்னாடி இருக்குற 6-Pillar Pattern Matrix என்ன சொல்றதுன்னா...`,
      openingThunglishNarrative: `Vanakkam makkale! ${article.author} ezhudhina "${article.title}" (${article.publicationName}) Substack post ippo global tech & macro circles-la periya discussion-ah கிளப்பியிருக்கு. Original excerpt enna solludhu-na: "${article.excerpt}" — Idha verum single-domain கட்டுரையா படிக்காம, நம்ம 3D Past-Present-Future lens போட்டு 6 தூண்கள்ல (Aerospace, Defence, Geopolitics, Money, Tech, Physics) கனெக்ட் பண்ணி பார்த்தா செம பிக்சர் கிடைக்குது!`,
    },
    groundingSources: [
      {
        title: `${article.publicationName}: ${article.title}`,
        uri: article.url,
      },
    ],
  };
}
