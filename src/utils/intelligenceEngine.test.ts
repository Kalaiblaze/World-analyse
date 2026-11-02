import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_PILLARS,
  CURATED_BRIEFINGS,
  PillarId,
  buildCrossDomainAdjacencyCount,
  filterPillars,
  generateDeterministicBriefing,
  traceCausalChain,
  validateSynthesisInput,
} from './intelligenceEngine.ts';
import {
  CURATED_SUBSTACK_SOURCES,
  FEATURED_SUBSTACK_DISPATCHES,
  cleanRssText,
  convertSubstackArticleToBriefing,
  humanizeSubstackInput,
  parseSubstackRssXml,
} from './substackParser.ts';

test('CURATED_BRIEFINGS includes all 6 mandatory pillars with Past-Present-Future layers in every edition', () => {
  assert.ok(CURATED_BRIEFINGS.length >= 3, 'Should ship at least 3 complete editions');

  for (const briefing of CURATED_BRIEFINGS) {
    assert.equal(briefing.pillars.length, 6, `Edition ${briefing.editionId} must have all 6 pillars`);
    const pillarIds = briefing.pillars.map((p) => p.id);
    for (const requiredPillar of ALL_PILLARS) {
      assert.ok(
        pillarIds.includes(requiredPillar),
        `Edition ${briefing.editionId} missing pillar ${requiredPillar}`
      );
    }

    for (const pillar of briefing.pillars) {
      assert.ok(pillar.past.context.length > 20, 'Past layer must be substantive');
      assert.ok(pillar.present.triggerEvent.length > 20, 'Present layer must be substantive');
      assert.ok(pillar.future.year1.length > 15, 'Future 1Y layer must be substantive');
      assert.ok(pillar.future.year5.length > 15, 'Future 5Y layer must be substantive');
      assert.ok(pillar.future.year10.length > 15, 'Future 10Y layer must be substantive');
      assert.ok(pillar.streetAnalogy.explanation.length > 20, 'Street-smart analogy must be present');
    }
  }
});

test('validateSynthesisInput rejects empty or overly short inputs and accepts valid signals', () => {
  const emptyResult = validateSynthesisInput('   ');
  assert.equal(emptyResult.valid, false);
  assert.ok(emptyResult.error?.includes('cannot be empty'));

  const shortResult = validateSynthesisInput('chip');
  assert.equal(shortResult.valid, false);
  assert.ok(shortResult.error?.includes('at least 8 characters'));

  const validResult = validateSynthesisInput('  Quantum radar breakthrough in Indo-Pacific  ');
  assert.equal(validResult.valid, true);
  assert.equal(validResult.normalizedQuery, 'Quantum radar breakthrough in Indo-Pacific');
});

test('filterPillars filters by pillar category and search query accurately', () => {
  const samplePillars = CURATED_BRIEFINGS[0].pillars;

  const all = filterPillars(samplePillars, 'ALL', '');
  assert.equal(all.length, 6);

  const physicsOnly = filterPillars(samplePillars, PillarId.PHYSICS, '');
  assert.equal(physicsOnly.length, 1);
  assert.equal(physicsOnly[0].id, PillarId.PHYSICS);

  const diamondQuery = filterPillars(samplePillars, 'ALL', 'Kapitza');
  assert.equal(diamondQuery.length, 1);
  assert.equal(diamondQuery[0].id, PillarId.PHYSICS);
});

test('traceCausalChain and buildCrossDomainAdjacencyCount connect dots across pillars', () => {
  const connections = CURATED_BRIEFINGS[0].dotConnections;
  const allChains = traceCausalChain(connections, 'ALL');
  assert.equal(allChains.length, connections.length);

  const defenceChains = traceCausalChain(connections, PillarId.DEFENCE);
  assert.ok(defenceChains.length >= 2);
  for (const chain of defenceChains) {
    const involvesDefence =
      chain.sourcePillar === PillarId.DEFENCE ||
      chain.intermediatePillar === PillarId.DEFENCE ||
      chain.targetPillar === PillarId.DEFENCE;
    assert.equal(involvesDefence, true);
  }

  const adjacency = buildCrossDomainAdjacencyCount(connections);
  assert.ok(adjacency[PillarId.PHYSICS] >= 1);
  assert.ok(adjacency[PillarId.MONEY] >= 1);
});

test('generateDeterministicBriefing produces a complete 6-pillar Thunglish briefing and throws on invalid input', () => {
  assert.throws(() => generateDeterministicBriefing(''), /cannot be empty/);

  const custom = generateDeterministicBriefing(
    'Sub-sea lithium brine extraction and sovereign naval battery supply chains',
    PillarId.MONEY
  );
  assert.equal(custom.pillars.length, 6);
  assert.ok(custom.title.includes('Sub-sea lithium brine extraction'));
  assert.equal(custom.masterVerdict.watchItems.length, 3);
});

test('parseSubstackRssXml and convertSubstackArticleToBriefing parse Substack XML and build 6-pillar briefings', () => {
  const mockRss = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <channel>
        <item>
          <title><![CDATA[Why Titanium Forging Presses Dictate Hypersonic Airframe Output]]></title>
          <link>https://www.construction-physics.com/p/titanium-forging</link>
          <pubDate>Sun, 01 Nov 2026 12:00:00 GMT</pubDate>
          <dc:creator><![CDATA[Brian Potter]]></dc:creator>
          <description><![CDATA[<p>Fifty-thousand-ton hydraulic closed-die forging presses remain the ultimate industrial bottleneck for modern aerospace.</p>]]></description>
        </item>
      </channel>
    </rss>`;

  const parsed = parseSubstackRssXml(mockRss, CURATED_SUBSTACK_SOURCES[0]);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].title, 'Why Titanium Forging Presses Dictate Hypersonic Airframe Output');
  assert.equal(parsed[0].author, 'Brian Potter');
  assert.ok(parsed[0].excerpt.includes('Fifty-thousand-ton hydraulic'));
  assert.equal(cleanRssText('<![CDATA[<b>Hello &amp; World</b>]]>'), 'Hello & World');

  const briefing = convertSubstackArticleToBriefing(
    FEATURED_SUBSTACK_DISPATCHES[3],
    CURATED_BRIEFINGS
  );
  assert.equal(briefing.pillars.length, 6);
  assert.ok(briefing.groundingSources && briefing.groundingSources.length === 1);

  const humanized = humanizeSubstackInput('https://www.construction-physics.com/p/titanium-forging');
  assert.equal(humanized.title, 'Titanium Forging');
  assert.equal(humanized.publicationName, 'Construction Physics (Substack)');
  assert.equal(humanized.author, 'Brian Potter');
});

import {
  CURATED_BIOSCIENCE_TARGETS,
  buildAlphaGenomeVariantLink,
  classifyPlddtBand,
} from './scienceEngine.ts';

test('scienceEngine classifies 4-band AlphaFold pLDDT confidence scores and constructs AlphaGenome Atlas deep-links', () => {
  assert.ok(CURATED_BIOSCIENCE_TARGETS.length >= 4);
  assert.deepEqual(classifyPlddtBand(94.2), {
    label: 'Very High (>90)',
    colorHex: '#0053D6',
  });
  assert.deepEqual(classifyPlddtBand(82.0), {
    label: 'Confident (70-90)',
    colorHex: '#65CBF3',
  });
  assert.deepEqual(classifyPlddtBand(61.5), {
    label: 'Low (50-70)',
    colorHex: '#FFDB13',
  });
  assert.deepEqual(classifyPlddtBand(38.0), {
    label: 'Very Low (<50)',
    colorHex: '#FF7D45',
  });

  const link = buildAlphaGenomeVariantLink({
    chrom: '17',
    pos: 7674220,
    ref: 'C',
    alt: 'T',
  });
  assert.ok(link.startsWith('https://deepmind.google.com/science/alphagenome/atlas?'));
  assert.ok(link.includes('chr17%3A7674220%3AC%3ET'));
  assert.ok(link.includes('m=variant'));
});

