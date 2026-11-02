import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  ALL_PILLARS,
  CURATED_BRIEFINGS,
  IntelligenceBriefing,
  PillarId,
  generateDeterministicBriefing,
  validateSynthesisInput,
} from './src/utils/intelligenceEngine';
import {
  CURATED_SUBSTACK_SOURCES,
  FEATURED_SUBSTACK_DISPATCHES,
  SubstackArticle,
  cleanRssText,
  convertSubstackArticleToBriefing,
  humanizeSubstackInput,
  parseSubstackRssXml,
} from './src/utils/substackParser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'MISSING_KEY',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function fetchWithTimeout(url: string, timeoutMs = 4500): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VetriCheckIntelligenceDesk/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml, text/html, */*',
      },
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  // 1. Live Substack RSS & Curated Substack Intelligence Feed Endpoint
  app.get('/api/substack/feed', async (req, res) => {
    const sourceFilter = typeof req.query.sourceId === 'string' ? req.query.sourceId : 'ALL';
    const refreshLive = req.query.live === 'true';

    const targetSources =
      sourceFilter === 'ALL'
        ? CURATED_SUBSTACK_SOURCES
        : CURATED_SUBSTACK_SOURCES.filter((s) => s.id === sourceFilter);

    const liveArticles: SubstackArticle[] = [];

    if (refreshLive) {
      await Promise.all(
        targetSources.slice(0, 3).map(async (source) => {
          const xml = await fetchWithTimeout(source.feedUrl, 3500);
          if (xml) {
            const parsed = parseSubstackRssXml(xml, source, 2);
            liveArticles.push(...parsed);
          }
        })
      );
    }

    const fallbackArticles =
      sourceFilter === 'ALL'
        ? FEATURED_SUBSTACK_DISPATCHES
        : FEATURED_SUBSTACK_DISPATCHES.filter((a) => a.sourceId === sourceFilter);

    // Combine any live RSS items with curated Substack dispatches, deduplicating by title
    const seenTitles = new Set<string>();
    const combined: SubstackArticle[] = [];

    for (const item of [...liveArticles, ...fallbackArticles]) {
      const key = item.title.toLowerCase();
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        combined.push(item);
      }
    }

    res.json({
      sources: CURATED_SUBSTACK_SOURCES,
      articles: combined,
      liveFetchedCount: liveArticles.length,
    });
  });

  // 2. Fetch & Decode a Specific Substack URL or Publication Handle
  app.post('/api/substack/decode', async (req, res) => {
    const { substackUrl, article } = req.body as {
      substackUrl?: string;
      article?: SubstackArticle;
    };

    if (article && article.title) {
      // Check if it maps to one of our rich curated briefings or synthesize via Gemini/deterministic engine
      const baseBriefing = convertSubstackArticleToBriefing(article, CURATED_BRIEFINGS);
      return res.json({
        briefing: baseBriefing,
        sourceArticle: article,
        mode: 'substack-dispatch',
      });
    }

    const rawInput = (substackUrl ?? '').trim();
    if (!rawInput) {
      return res.status(400).json({
        error: 'Please enter a valid Substack URL, publication name, or article headline.',
      });
    }

    // Check if the user entered a Substack domain/URL so we can try fetching its RSS or HTML title
    const humanized = humanizeSubstackInput(rawInput);
    let extractedTitle = humanized.title;
    let extractedExcerpt = `Substack dispatch analysis from ${humanized.publicationName} by ${humanized.author}`;
    let resolvedUrl = rawInput.startsWith('http') ? rawInput : `https://${rawInput}`;

    if (rawInput.includes('substack.com') || rawInput.startsWith('http')) {
      const feedCandidate = resolvedUrl.includes('/p/')
        ? resolvedUrl
        : `${resolvedUrl.replace(/\/$/, '')}/feed`;
      const bodyText = await fetchWithTimeout(feedCandidate, 3000);
      if (bodyText) {
        if (bodyText.includes('<item>')) {
          const parsed = parseSubstackRssXml(
            bodyText,
            {
              id: 'custom-substack',
              name: humanized.publicationName.replace(' (Substack)', ''),
              author: humanized.author,
              handle: rawInput,
              feedUrl: feedCandidate,
              siteUrl: resolvedUrl,
              primaryPillar: PillarId.GEOPOLITICS,
              secondaryPillar: PillarId.MONEY,
              description: 'Custom Substack feed',
            },
            1
          );
          if (parsed.length > 0) {
            const firstPost = parsed[0];
            const briefing = convertSubstackArticleToBriefing(firstPost, CURATED_BRIEFINGS);
            return res.json({
              briefing,
              sourceArticle: firstPost,
              mode: 'live-substack-rss',
            });
          }
        } else {
          const htmlTitle = bodyText.match(/<title>([\s\S]*?)<\/title>/i);
          const metaDesc = bodyText.match(
            /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
          );
          if (htmlTitle?.[1]) {
            extractedTitle = cleanRssText(htmlTitle[1]);
          }
          if (metaDesc?.[1]) {
            extractedExcerpt = cleanRssText(metaDesc[1]);
          }
        }
      }
    }

    const syntheticArticle: SubstackArticle = {
      id: `custom-sub-${Date.now()}`,
      sourceId: 'custom-substack',
      publicationName: humanized.publicationName,
      author: humanized.author,
      title: extractedTitle,
      subtitle: extractedExcerpt,
      publishedAt: 'Nov 2, 2026',
      url: resolvedUrl,
      primaryPillar: PillarId.GEOPOLITICS,
      excerpt: extractedExcerpt,
    };

    const briefing = convertSubstackArticleToBriefing(syntheticArticle, CURATED_BRIEFINGS);
    return res.json({
      briefing,
      sourceArticle: syntheticArticle,
      mode: 'substack-url-synthesis',
    });
  });

  // 3. Server-Side Gemini 3D Pattern Matrix Synthesis Endpoint
  app.post('/api/intelligence/synthesize', async (req, res) => {
    const { query, focusPillar = 'ALL' } = req.body as {
      query?: string;
      focusPillar?: PillarId | 'ALL';
    };

    const validation = validateSynthesisInput(query ?? '');
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const normalizedQuery = validation.normalizedQuery;
    const validFocus: PillarId | 'ALL' =
      focusPillar && ALL_PILLARS.includes(focusPillar as PillarId)
        ? (focusPillar as PillarId)
        : 'ALL';

    // Attempt live Gemini synthesis if API key is present
    const hasApiKey =
      Boolean(process.env.GEMINI_API_KEY) &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      process.env.GEMINI_API_KEY !== 'MISSING_KEY';

    if (hasApiKey) {
      try {
        const systemPrompt = `You are an elite Global Intelligence Director and Pattern Recognition Professor.
Analyze the user's global news signal or Substack topic across ALL 6 mandatory pillars:
1. Aerospace
2. Defence
3. Geopolitics
4. Money & Economy
5. Technology
6. Physics

Tone & Language Style:
- Use sharp, conversational, engaging "Thunglish" (a natural mix of Tamil and English words/slang used by Chennai/Bengaluru tech professionals) for hooks, executive narratives, and street-smart analogies.
- Explain complex quantum/aerospace/geopolitical concepts using relatable real-world analogies.
- Map every single pillar across Past (Historical Context), Present (Current Trigger), and Future (1-Year, 5-Year, and 10-Year consequences + hidden risk + asymmetric opportunity).
- Actively connect the dots across pillars in dotConnections.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Synthesize a complete 6-Pillar 3D Global Intelligence Briefing in Thunglish for this signal/topic (Primary Focus: ${validFocus}): "${normalizedQuery}"`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                subtitle: { type: Type.STRING },
                bigPictureHeadline: { type: Type.STRING },
                openingThunglishNarrative: { type: Type.STRING },
                coreThesis: { type: Type.STRING },
                streetSmartTldr: { type: Type.STRING },
                directorClosingNote: { type: Type.STRING },
                contrarianWarning: { type: Type.STRING },
              },
              required: [
                'title',
                'subtitle',
                'bigPictureHeadline',
                'openingThunglishNarrative',
                'coreThesis',
                'streetSmartTldr',
                'directorClosingNote',
                'contrarianWarning',
              ],
            },
          },
        });

        const parsedText = (response.text ?? '').trim();
        if (parsedText) {
          const aiSummary = JSON.parse(parsedText) as Record<string, string>;
          const base = generateDeterministicBriefing(normalizedQuery, validFocus);
          const mergedBriefing: IntelligenceBriefing = {
            ...base,
            title: aiSummary.title || base.title,
            subtitle: aiSummary.subtitle || base.subtitle,
            executiveSummary: {
              ...base.executiveSummary,
              bigPictureHeadline:
                aiSummary.bigPictureHeadline || base.executiveSummary.bigPictureHeadline,
              openingThunglishNarrative:
                aiSummary.openingThunglishNarrative ||
                base.executiveSummary.openingThunglishNarrative,
              coreThesis: aiSummary.coreThesis || base.executiveSummary.coreThesis,
              streetSmartTldr: aiSummary.streetSmartTldr || base.executiveSummary.streetSmartTldr,
            },
            masterVerdict: {
              ...base.masterVerdict,
              directorClosingNote:
                aiSummary.directorClosingNote || base.masterVerdict.directorClosingNote,
              contrarianWarning:
                aiSummary.contrarianWarning || base.masterVerdict.contrarianWarning,
            },
          };
          return res.json({
            briefing: mergedBriefing,
            synthesizedBy: 'gemini-3.8-flash',
          });
        }
      } catch (err) {
        // Fall through to deterministic pattern synthesis engine so the user always gets a complete 6-pillar briefing
        console.warn('Gemini live synthesis fallback triggered:', (err as Error)?.message);
      }
    }

    const fallbackBriefing = generateDeterministicBriefing(normalizedQuery, validFocus);
    return res.json({
      briefing: fallbackBriefing,
      synthesizedBy: 'pattern-matrix-engine',
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VetriCheck Global Intelligence Desk running on http://localhost:${PORT}`);
  });
}

startServer();
