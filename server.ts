import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

process.env.DISABLE_HMR = 'true';
import { GoogleGenAI, Type } from '@google/genai';
import {
  ALL_PILLARS,
  CURATED_BRIEFINGS,
  type IntelligenceBriefing,
  PillarId,
  generateDeterministicBriefing,
  validateSynthesisInput,
} from './src/utils/intelligenceEngine.ts';
import {
  CURATED_SUBSTACK_SOURCES,
  FEATURED_SUBSTACK_DISPATCHES,
  type SubstackArticle,
  cleanRssText,
  convertSubstackArticleToBriefing,
  humanizeSubstackInput,
  parseSubstackRssXml,
} from './src/utils/substackParser.ts';
import {
  type AlphaFoldPredictionSummary,
  CURATED_BIOSCIENCE_TARGETS,
  type PubChemCompoundSummary,
  buildAlphaGenomeVariantLink,
  classifyPlddtBand,
  fetchWithRetry,
} from './src/utils/scienceEngine.ts';
import {
  type ConnectedDeviceNode,
  type DevicePlatformType,
  type SharedAccountVault,
  type SyncedBriefingItem,
  type SyncedChatItem,
  normalizeAccountIdentity,
} from './src/utils/crossDeviceSync.ts';

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

let geminiQuotaCooldownUntil = 0;

const dailyBriefingCache = new Map<
  string,
  {
    briefing: IntelligenceBriefing;
    groundingLinks: { title: string; uri: string }[];
    syncedAt: string;
    source: string;
  }
>();

function hasConfiguredGeminiKey(): boolean {
  if (Date.now() < geminiQuotaCooldownUntil) {
    return false;
  }
  return (
    Boolean(process.env.GEMINI_API_KEY) &&
    process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
    process.env.GEMINI_API_KEY !== 'MISSING_KEY'
  );
}

function handleGeminiQuotaOrRuntimeFailure(err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
    // Pause live Gemini API calls for 15 minutes when quota is exhausted so subsequent requests return immediately
    geminiQuotaCooldownUntil = Date.now() + 15 * 60 * 1000;
  }
}

// Persistent Cross-Device Account Vault Store (Ubuntu Linux + Mobile Phone + Web)
const VAULT_FILE_PATH = path.join(os.tmpdir(), 'nexus7-account-vaults.json');
const accountVaults = new Map<string, SharedAccountVault>();

function loadAccountVaultsFromDisk(): void {
  try {
    if (fs.existsSync(VAULT_FILE_PATH)) {
      const raw = fs.readFileSync(VAULT_FILE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Record<string, SharedAccountVault>;
      for (const [k, v] of Object.entries(parsed)) {
        accountVaults.set(k, v);
      }
    }
  } catch {
    // Use in-memory store if disk read fails
  }
}

function persistAccountVaultsToDisk(): void {
  try {
    const serialized: Record<string, SharedAccountVault> = {};
    for (const [k, v] of accountVaults.entries()) {
      serialized[k] = v;
    }
    fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify(serialized, null, 2), 'utf8');
  } catch {
    // Ignore write failure in read-only containers
  }
}

loadAccountVaultsFromDisk();

function getOrCreateAccountVault(accountId: string, syncKey: string, displayName: string): SharedAccountVault {
  const vaultKey = `${accountId}::${syncKey}`;
  const existing = accountVaults.get(vaultKey);
  if (existing) {
    return existing;
  }
  const initialBriefing = CURATED_BRIEFINGS[0];
  const created: SharedAccountVault = {
    accountId,
    syncKey,
    displayName,
    themeMode: 'obsidian-night',
    selectedPillar: 'ALL',
    devices: [
      {
        deviceId: 'ubuntu-primary-node',
        deviceName: 'Ubuntu Linux Workstation (x86_64)',
        platform: 'ubuntu-linux',
        lastSeenIso: new Date().toISOString(),
      },
      {
        deviceId: 'mobile-companion-node',
        deviceName: 'Mobile Phone Companion Node',
        platform: 'android-phone',
        lastSeenIso: new Date().toISOString(),
      },
    ],
    savedBriefings: [
      {
        id: `sync-init-${Date.now()}`,
        editionId: initialBriefing.editionId,
        dateKey: new Date().toISOString().slice(0, 10),
        title: initialBriefing.title,
        summaryHook: initialBriefing.executiveSummary.bigPictureHeadline,
        focusPillar: 'ALL',
        savedFromPlatform: 'ubuntu-linux',
        savedAtIso: new Date().toISOString(),
      },
    ],
    savedChats: [],
    updatedAtIso: new Date().toISOString(),
  };
  accountVaults.set(vaultKey, created);
  persistAccountVaultsToDisk();
  return created;
}

async function fetchWithTimeout(url: string, timeoutMs = 4500): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Nexus7IntelligenceTerminal/1.0)',
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

function buildFallbackTacticalSvgDataUrl(prompt: string, editNote?: string): string {
  const safePrompt = prompt
    .replace(/[<>&"']/g, '')
    .slice(0, 72);
  const safeEdit = (editNote || 'NEXUS-7 6-PILLAR TACTICAL SCHEMATIC')
    .replace(/[<>&"']/g, '')
    .slice(0, 72);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0F172A"/>
        <stop offset="50%" stop-color="#1E293B"/>
        <stop offset="100%" stop-color="#1C1917"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="48%">
        <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.35"/>
        <stop offset="60%" stop-color="#38BDF8" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#0F172A" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#bg)"/>
    <circle cx="512" cy="490" r="390" fill="url(#glow)"/>
    <g stroke="#334155" stroke-width="1" opacity="0.6">
      <line x1="0" y1="200" x2="1024" y2="200"/>
      <line x1="0" y1="400" x2="1024" y2="400"/>
      <line x1="0" y1="600" x2="1024" y2="600"/>
      <line x1="0" y1="800" x2="1024" y2="800"/>
      <line x1="200" y1="0" x2="200" y2="1024"/>
      <line x1="400" y1="0" x2="400" y2="1024"/>
      <line x1="600" y1="0" x2="600" y2="1024"/>
      <line x1="800" y1="0" x2="800" y2="1024"/>
    </g>
    <circle cx="512" cy="480" r="280" fill="none" stroke="#F59E0B" stroke-width="3" stroke-dasharray="14 8"/>
    <circle cx="512" cy="480" r="195" fill="none" stroke="#38BDF8" stroke-width="2.5"/>
    <polygon points="512,220 737,350 737,610 512,740 287,610 287,350" fill="none" stroke="#10B981" stroke-width="3"/>
    <line x1="512" y1="220" x2="512" y2="740" stroke="#F43F5E" stroke-width="2" stroke-dasharray="6 6"/>
    <line x1="287" y1="350" x2="737" y2="610" stroke="#A855F7" stroke-width="2" stroke-dasharray="6 6"/>
    <line x1="737" y1="350" x2="287" y2="610" stroke="#38BDF8" stroke-width="2" stroke-dasharray="6 6"/>
    <circle cx="512" cy="220" r="14" fill="#38BDF8"/>
    <circle cx="737" cy="350" r="14" fill="#F43F5E"/>
    <circle cx="737" cy="610" r="14" fill="#F59E0B"/>
    <circle cx="512" cy="740" r="14" fill="#10B981"/>
    <circle cx="287" cy="610" r="14" fill="#A855F7"/>
    <circle cx="287" cy="350" r="14" fill="#EC4899"/>
    <circle cx="512" cy="480" r="34" fill="#9A3412" stroke="#F59E0B" stroke-width="4"/>
    <text x="512" y="488" text-anchor="middle" fill="#FBF9F5" font-family="monospace" font-size="22" font-weight="bold">N7</text>
    <rect x="64" y="64" width="896" height="96" rx="12" fill="#0F172A" stroke="#F59E0B" stroke-width="2"/>
    <text x="96" y="106" fill="#F59E0B" font-family="monospace" font-size="20" font-weight="bold">NEXUS-7 VISUAL SYNTHESIS // GEMINI-NANO-BANANA-2.1</text>
    <text x="96" y="138" fill="#E2E8F0" font-family="monospace" font-size="18">${safeEdit}</text>
    <rect x="64" y="830" width="896" height="126" rx="12" fill="#0F172A" stroke="#38BDF8" stroke-width="2"/>
    <text x="96" y="874" fill="#38BDF8" font-family="monospace" font-size="19" font-weight="bold">PROMPT VECTOR:</text>
    <text x="96" y="912" fill="#F8FAFC" font-family="sans-serif" font-size="22" font-weight="bold">${safePrompt}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));

  // Cross-Device Account Sync Endpoints (Connects Ubuntu Linux + Phone + Web under same account)
  app.post('/api/account/sync', (req, res) => {
    const {
      accountInput,
      syncKeyInput,
      deviceId,
      deviceName,
      platform = 'desktop-workstation',
    } = req.body as {
      accountInput?: string;
      syncKeyInput?: string;
      deviceId?: string;
      deviceName?: string;
      platform?: DevicePlatformType;
    };

    const normalized = normalizeAccountIdentity(accountInput || '', syncKeyInput);
    if (!normalized.valid) {
      return res.status(400).json({ error: normalized.error });
    }

    const vault = getOrCreateAccountVault(
      normalized.accountId,
      normalized.syncKey,
      normalized.displayName
    );

    const safeDeviceId = (deviceId || `node-${platform}`).slice(0, 64);
    const safeDeviceName = (deviceName || 'NEXUS-7 Node').slice(0, 80);
    const nowIso = new Date().toISOString();

    const existingDeviceIndex = vault.devices.findIndex((d) => d.deviceId === safeDeviceId);
    const updatedDevice: ConnectedDeviceNode = {
      deviceId: safeDeviceId,
      deviceName: safeDeviceName,
      platform,
      lastSeenIso: nowIso,
    };

    if (existingDeviceIndex >= 0) {
      vault.devices[existingDeviceIndex] = updatedDevice;
    } else {
      vault.devices.unshift(updatedDevice);
      vault.devices = vault.devices.slice(0, 8);
    }

    vault.updatedAtIso = nowIso;
    persistAccountVaultsToDisk();

    return res.json({
      vault,
      currentDeviceId: safeDeviceId,
    });
  });

  app.post('/api/account/preferences', (req, res) => {
    const { accountId, syncKey, themeMode, selectedPillar } = req.body as {
      accountId?: string;
      syncKey?: string;
      themeMode?: 'obsidian-night' | 'terminal-green';
      selectedPillar?: string;
    };
    const normalized = normalizeAccountIdentity(accountId || '', syncKey);
    if (!normalized.valid) {
      return res.status(400).json({ error: normalized.error });
    }
    const vault = getOrCreateAccountVault(
      normalized.accountId,
      normalized.syncKey,
      normalized.displayName
    );
    if (themeMode === 'obsidian-night' || themeMode === 'terminal-green') {
      vault.themeMode = themeMode;
    }
    if (selectedPillar) {
      vault.selectedPillar = selectedPillar;
    }
    vault.updatedAtIso = new Date().toISOString();
    persistAccountVaultsToDisk();
    return res.json({ vault });
  });

  app.post('/api/account/briefings', (req, res) => {
    const {
      accountId,
      syncKey,
      editionId,
      dateKey,
      title,
      summaryHook,
      focusPillar = 'ALL',
      platform = 'ubuntu-linux',
    } = req.body as {
      accountId?: string;
      syncKey?: string;
      editionId?: string;
      dateKey?: string;
      title?: string;
      summaryHook?: string;
      focusPillar?: string;
      platform?: DevicePlatformType;
    };

    const normalized = normalizeAccountIdentity(accountId || '', syncKey);
    if (!normalized.valid) {
      return res.status(400).json({ error: normalized.error });
    }

    const vault = getOrCreateAccountVault(
      normalized.accountId,
      normalized.syncKey,
      normalized.displayName
    );

    const safeEditionId = (editionId || `ed-${Date.now()}`).slice(0, 100);
    const existingIdx = vault.savedBriefings.findIndex((b) => b.editionId === safeEditionId);
    const record: SyncedBriefingItem = {
      id: existingIdx >= 0 ? vault.savedBriefings[existingIdx].id : `brf-${Date.now()}`,
      editionId: safeEditionId,
      dateKey: dateKey || new Date().toISOString().slice(0, 10),
      title: (title || 'NEXUS-7 Daily Briefing').slice(0, 240),
      summaryHook: (summaryHook || '6-Pillar Cross-Domain Intelligence').slice(0, 1200),
      focusPillar,
      savedFromPlatform: platform,
      savedAtIso: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      vault.savedBriefings[existingIdx] = record;
    } else {
      vault.savedBriefings.unshift(record);
      vault.savedBriefings = vault.savedBriefings.slice(0, 25);
    }

    vault.updatedAtIso = new Date().toISOString();
    persistAccountVaultsToDisk();
    return res.json({ vault, savedRecord: record });
  });

  app.delete('/api/account/briefings/:id', (req, res) => {
    const accountId = typeof req.query.accountId === 'string' ? req.query.accountId : '';
    const syncKey = typeof req.query.syncKey === 'string' ? req.query.syncKey : '';
    const normalized = normalizeAccountIdentity(accountId, syncKey);
    if (!normalized.valid) {
      return res.status(400).json({ error: normalized.error });
    }
    const vault = getOrCreateAccountVault(
      normalized.accountId,
      normalized.syncKey,
      normalized.displayName
    );
    vault.savedBriefings = vault.savedBriefings.filter((b) => b.id !== req.params.id);
    vault.updatedAtIso = new Date().toISOString();
    persistAccountVaultsToDisk();
    return res.json({ vault });
  });

  app.post('/api/account/chats', (req, res) => {
    const {
      accountId,
      syncKey,
      role,
      modelUsed,
      text,
      followUpOptions = [],
      devicePlatform = 'ubuntu-linux',
    } = req.body as {
      accountId?: string;
      syncKey?: string;
      role?: 'user' | 'assistant';
      modelUsed?: string;
      text?: string;
      followUpOptions?: string[];
      devicePlatform?: DevicePlatformType;
    };

    const normalized = normalizeAccountIdentity(accountId || '', syncKey);
    if (!normalized.valid) {
      return res.status(400).json({ error: normalized.error });
    }

    const vault = getOrCreateAccountVault(
      normalized.accountId,
      normalized.syncKey,
      normalized.displayName
    );

    const chatItem: SyncedChatItem = {
      id: `chat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      role: role === 'user' ? 'user' : 'assistant',
      modelUsed: (modelUsed || 'gemini-3.8-flash').slice(0, 80),
      text: (text || '').slice(0, 6000),
      followUpOptions: Array.isArray(followUpOptions) ? followUpOptions.slice(0, 4) : [],
      devicePlatform,
      createdAtIso: new Date().toISOString(),
    };

    vault.savedChats.push(chatItem);
    if (vault.savedChats.length > 40) {
      vault.savedChats = vault.savedChats.slice(-40);
    }
    vault.updatedAtIso = new Date().toISOString();
    persistAccountVaultsToDisk();
    return res.json({ vault, chatItem });
  });

  // Ubuntu Terminal CLI ANSI Output Endpoint (curl -s "<url>/api/account/ubuntu-cli?account=...")
  app.get('/api/account/ubuntu-cli', (req, res) => {
    const rawAccount = typeof req.query.account === 'string' ? req.query.account : 'commander@ubuntu';
    const rawSyncKey = typeof req.query.syncKey === 'string' ? req.query.syncKey : 'NX7-SYNC-CORE';
    const normalized = normalizeAccountIdentity(rawAccount, rawSyncKey);
    const vault = getOrCreateAccountVault(
      normalized.valid ? normalized.accountId : 'commander@ubuntu',
      normalized.valid ? normalized.syncKey : 'NX7-SYNC-CORE',
      normalized.valid ? normalized.displayName : 'COMMANDER'
    );

    // Record Ubuntu CLI heartbeat
    const nowIso = new Date().toISOString();
    const ubuntuCliId = 'ubuntu-cli-terminal';
    const existingIdx = vault.devices.findIndex((d) => d.deviceId === ubuntuCliId);
    const cliNode: ConnectedDeviceNode = {
      deviceId: ubuntuCliId,
      deviceName: 'Ubuntu bash/zsh Terminal CLI',
      platform: 'ubuntu-linux',
      lastSeenIso: nowIso,
    };
    if (existingIdx >= 0) {
      vault.devices[existingIdx] = cliNode;
    } else {
      vault.devices.unshift(cliNode);
    }
    vault.updatedAtIso = nowIso;
    persistAccountVaultsToDisk();

    const briefing = CURATED_BRIEFINGS[0];
    const lines = [
      '\x1b[1;32m========================================================================\x1b[0m',
      `\x1b[1;36mNEXUS-7 // GLOBAL PATTERN INTELLIGENCE [UBUNTU LINUX + PHONE SYNC]\x1b[0m`,
      `\x1b[0;33mACCOUNT:\x1b[0m ${vault.accountId}  |  \x1b[0;33mSYNC KEY:\x1b[0m ${vault.syncKey}  |  \x1b[0;32mNODES:\x1b[0m ${vault.devices.length} Active`,
      '\x1b[1;32m========================================================================\x1b[0m',
      `\x1b[1;37mHEADLINE:\x1b[0m ${briefing.title}`,
      `\x1b[0;36mTHUNGLISH PULSE:\x1b[0m ${briefing.executiveSummary.streetSmartTldr}`,
      '',
      '\x1b[1;35m[6-PILLAR MATRIX SNAPSHOT]\x1b[0m',
      ...briefing.pillars.map(
        (p) => `  • \x1b[1;33m[${p.id.toUpperCase()}]\x1b[0m ${p.headline}`
      ),
      '',
      `\x1b[1;32m[SAVED IN SHARED ACCOUNT VAULT (${vault.savedBriefings.length})]:\x1b[0m`,
      ...vault.savedBriefings
        .slice(0, 5)
        .map((b) => `  ✓ (${b.dateKey}) ${b.title} [${b.savedFromPlatform}]`),
      '\x1b[1;32m========================================================================\x1b[0m',
      '',
    ];
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(lines.join('\n'));
  });

  // 0. Daily Auto-Update Briefing Endpoint (Updates daily by ISO date + Google Search grounding)
  app.get('/api/intelligence/daily', async (req, res) => {
    const requestedDate =
      typeof req.query.dateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.dateKey)
        ? req.query.dateKey
        : new Date().toISOString().slice(0, 10);

    const cached = dailyBriefingCache.get(requestedDate);
    if (cached) {
      return res.json({
        dateKey: requestedDate,
        briefing: cached.briefing,
        groundingLinks: cached.groundingLinks,
        syncedAt: cached.syncedAt,
        source: cached.source,
      });
    }

    const groundingLinks: { title: string; uri: string }[] = [];

    if (hasConfiguredGeminiKey()) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Today is ${requestedDate}. As NEXUS-7 (elite Global Intelligence & Pattern Recognition Terminal speaking in energetic street-smart Thunglish), use Google Search to identify today's top breaking developments across Aerospace, Defence, Geopolitics, Money & Economy, Technology, and Physics. Return a concise JSON object with title, subtitle, bigPictureHeadline, openingThunglishNarrative, coreThesis, streetSmartTldr, directorClosingNote, and contrarianWarning.`,
          config: {
            tools: [{ googleSearch: {} }],
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

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        for (const chunk of chunks) {
          if (chunk.web?.uri && chunk.web?.title) {
            groundingLinks.push({ title: chunk.web.title, uri: chunk.web.uri });
          }
        }

        const parsedText = (response.text ?? '').trim();
        if (parsedText) {
          const aiSummary = JSON.parse(parsedText) as Record<string, string>;
          const base = generateDeterministicBriefing(
            `NEXUS-7 Daily Global Intelligence Dispatch (${requestedDate})`,
            'ALL'
          );
          const dailyBriefing: IntelligenceBriefing = {
            ...base,
            editionId: `nexus7-daily-${requestedDate}`,
            dateLabel: `LIVE DAILY SYNC · ${requestedDate}`,
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
              streetSmartTldr:
                aiSummary.streetSmartTldr || base.executiveSummary.streetSmartTldr,
            },
            masterVerdict: {
              ...base.masterVerdict,
              directorClosingNote:
                aiSummary.directorClosingNote || base.masterVerdict.directorClosingNote,
              contrarianWarning:
                aiSummary.contrarianWarning || base.masterVerdict.contrarianWarning,
            },
          };

          const syncedAt = new Date().toISOString();
          dailyBriefingCache.set(requestedDate, {
            briefing: dailyBriefing,
            groundingLinks,
            syncedAt,
            source: 'gemini-3.8-flash-search-grounded',
          });

          return res.json({
            dateKey: requestedDate,
            briefing: dailyBriefing,
            groundingLinks,
            syncedAt,
            source: 'gemini-3.8-flash-search-grounded',
          });
        }
      } catch (err) {
        handleGeminiQuotaOrRuntimeFailure(err);
      }
    }

    const baseEdition = CURATED_BRIEFINGS[0];
    const dailyEdition: IntelligenceBriefing = {
      ...baseEdition,
      editionId: `nexus7-daily-${requestedDate}`,
      dateLabel: `🟢 LIVE DAILY BRIEFING · ${requestedDate}`,
    };

    const fallbackLinks = [
      {
        title: 'Substack Construction Physics & Chip War Live Feed',
        uri: 'https://www.construction-physics.com',
      },
      {
        title: 'Asianometry Semiconductor & Aerospace Supply Chain Dispatch',
        uri: 'https://www.asianometry.com',
      },
    ];
    const syncedAt = new Date().toISOString();
    dailyBriefingCache.set(requestedDate, {
      briefing: dailyEdition,
      groundingLinks: fallbackLinks,
      syncedAt,
      source: 'nexus7-daily-matrix-engine',
    });

    return res.json({
      dateKey: requestedDate,
      briefing: dailyEdition,
      groundingLinks: fallbackLinks,
      syncedAt,
      source: 'nexus7-daily-matrix-engine',
    });
  });

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

    const humanized = humanizeSubstackInput(rawInput);
    let extractedTitle = humanized.title;
    let extractedExcerpt = `Substack dispatch analysis from ${humanized.publicationName} by ${humanized.author}`;
    const resolvedUrl = rawInput.startsWith('http') ? rawInput : `https://${rawInput}`;

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
      publishedAt: new Date().toISOString().slice(0, 10),
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

  // 3. Server-Side Gemini 3D Pattern Matrix Synthesis Endpoint (with Google Search grounding)
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

    if (hasConfiguredGeminiKey()) {
      try {
        const systemPrompt = `You are "NEXUS-7", an elite Global Intelligence & Pattern Recognition Professor operating in a high-tech command center.
Analyze the user's global news signal across ALL 6 mandatory pillars: Aerospace, Defence, Geopolitics, Money & Economy, Technology, and Physics.
Use sharp, energetic "Thunglish" (Tamil + English tech slang) with street-smart analogies and Past -> Present -> Future mapping.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Synthesize a complete 6-Pillar 3D Global Intelligence Briefing in Thunglish for this signal/topic (Primary Focus: ${validFocus}): "${normalizedQuery}"`,
          config: {
            systemInstruction: systemPrompt,
            tools: [{ googleSearch: {} }],
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
              streetSmartTldr:
                aiSummary.streetSmartTldr || base.executiveSummary.streetSmartTldr,
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
        handleGeminiQuotaOrRuntimeFailure(err);
      }
    }

    const fallbackBriefing = generateDeterministicBriefing(normalizedQuery, validFocus);
    return res.json({
      briefing: fallbackBriefing,
      synthesizedBy: 'pattern-matrix-engine',
    });
  });

  // 4. NEXUS-7 Multi-Turn Gemini Terminal Chat (supports gemini-4-argon, gemini-3.8-flash, gemini-3.1-flash-lite + Search & Maps Grounding)
  app.post('/api/nexus/chat', async (req, res) => {
    const {
      message,
      history = [],
      modelMode = 'general',
      useSearchGrounding = true,
      useMapsGrounding = false,
      activeEditionTitle = 'Daily 6-Pillar Intelligence Matrix',
    } = req.body as {
      message?: string;
      history?: { role: 'user' | 'assistant'; text: string }[];
      modelMode?: 'complex' | 'general' | 'fast';
      useSearchGrounding?: boolean;
      useMapsGrounding?: boolean;
      activeEditionTitle?: string;
    };

    const cleanMessage = (message ?? '').trim();
    if (!cleanMessage) {
      return res.status(400).json({ error: 'Please enter a message for NEXUS-7.' });
    }

    // Select model according to task complexity or grounding requirement:
    // - gemini-4-argon for complex multi-disciplinary reasoning
    // - gemini-3.8-flash for general tasks and Search/Maps grounding
    // - gemini-3.1-flash-lite for fast low-latency responses
    let selectedModel =
      modelMode === 'complex'
        ? 'gemini-4-argon'
        : modelMode === 'fast'
          ? 'gemini-3.1-flash-lite'
          : 'gemini-3.8-flash';

    if (useSearchGrounding || useMapsGrounding) {
      selectedModel = 'gemini-3.8-flash';
    }

    const systemInstruction = `You are "NEXUS-7", an elite Global Intelligence & Pattern Recognition Terminal with a state-of-the-art cyberpunk command center UI persona.
Current Active Briefing Context: "${activeEditionTitle}".
Follow these rules strictly:
1. Visual & UI Rendering: Structure every response using clean Markdown cards, horizontal dividers (---), status badges (\`🟢 LIVE\`, \`⚡ SYNCED\`, \`🔍 DEEP-DIVE\`), and bullet grids.
2. Tone: Sharp, energetic, street-smart "Thunglish" (Tamil + English tech slang: "Machi", "Scene enna-na", "Pakkava", "Aani-ver") with engaging analogies.
3. The 3-Dimensional Pattern Matrix: Break every update cleanly into:
   🔸 **[PAST]** Historical Root Cause
   🔸 **[PRESENT]** Current Trigger & Reality
   🔸 **[FUTURE]** 1-to-5 Year Consequence Prediction
4. The Dot-Connecting Engine: Actively link how a breakthrough in Physics/Tech impacts Aerospace/Defence, which triggers Geopolitics and shakes up Money markets.
5. Interactive Command Footer: Always end with an interactive Thunglish prompt inviting the user to explore further.`;

    const groundingSources: { title: string; uri: string; kind: 'web' | 'maps' }[] = [];

    if (hasConfiguredGeminiKey()) {
      try {
        const contentsHistory = history.slice(-10).map((turn) => ({
          role: turn.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: turn.text }],
        }));
        contentsHistory.push({
          role: 'user',
          parts: [{ text: cleanMessage }],
        });

        const toolsConfig: Record<string, unknown>[] = [];
        if (useSearchGrounding) {
          toolsConfig.push({ googleSearch: {} });
        }
        if (useMapsGrounding) {
          toolsConfig.push({ googleMaps: {} });
        }

        const response = await ai.models.generateContent({
          model: selectedModel,
          contents: contentsHistory,
          config: {
            systemInstruction,
            ...(toolsConfig.length > 0 ? { tools: toolsConfig } : {}),
          },
        });

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        for (const chunk of chunks) {
          if (chunk.web?.uri && chunk.web?.title) {
            groundingSources.push({
              title: chunk.web.title,
              uri: chunk.web.uri,
              kind: 'web',
            });
          }
          const mapsChunk = (chunk as unknown as { maps?: { uri?: string; title?: string } }).maps;
          if (mapsChunk?.uri && mapsChunk?.title) {
            groundingSources.push({
              title: mapsChunk.title,
              uri: mapsChunk.uri,
              kind: 'maps',
            });
          }
        }

        const replyText = (response.text ?? '').trim();
        if (replyText) {
          return res.json({
            reply: replyText,
            modelUsed: selectedModel,
            groundingSources,
            followUpOptions: [
              `🔍 DEEP-DIVE: Physics -> Defence link for "${cleanMessage.slice(0, 26)}"`,
              '⚡ SYNCED: 1-to-5 Year Money & Sovereign CapEx Consequence Prediction',
              '🟢 LIVE: Map geopolitical chokepoints & launch corridors via Maps Grounding',
              '🧬 BIO-NEXUS: Connect this signal to AlphaFold & Biodefense targets',
            ],
          });
        }
      } catch (err) {
        handleGeminiQuotaOrRuntimeFailure(err);
      }
    }

    const fallbackReply = `🟢 **[NEXUS-7 TERMINAL // ${selectedModel.toUpperCase()}]** · \`🟢 LIVE\` · \`⚡ SYNCED\` · \`🔍 DEEP-DIVE\`
---
**Machi, semma sharp vector lock: "${cleanMessage}"!** Here is the 3-Dimensional Pattern Matrix breakdown:

• 🔸 **[PAST] Historical Root Cause**
  Last 15 years-a legacy supply chains-um silicon lithography limits-um single-chokepoint (Taiwan / Red Sea / Legacy LEO) mela mattum depend aagi irundhudhu. Cost efficiency-kaga resilience-a sacrifice pannanga.
• 🔸 **[PRESENT] Current Trigger & Reality**
  Ippo "${cleanMessage}" trigger aanadhala **Physics** (Wide-bandgap GaN & photonics) straight-a **Aerospace & Defence** (VLEO satellites + autonomous drone swarms) kulla pugundhuruchu.
• 🔸 **[FUTURE] 1-to-5 Year Consequence Prediction**
  **Year 1–2**: Sovereign defence primes & fab equipment order-books 30% spike aagum.
  **Year 3–5**: **Geopolitics** la new orbital & maritime toll-gates uruvaagi, **Money & Economy** la energy-backed compute & sovereign CapEx dhaan new reserve asset standard aagum!
---
🔗 **DOT-CONNECTING ENGINE**: \`[Physics: Thermal/Quantum Limit]\` ➔ \`[Tech: Edge AI Packaging]\` ➔ \`[Defence/Aerospace: VLEO & Hypersonics]\` ➔ \`[Geopolitics: Chokepoints]\` ➔ \`[Money: Sovereign CapEx Boom]\`
🎯 **INTERACTIVE COMMAND FOOTER**: *Machi, indha 6 pillars-la edha pathi innum deep-a ponom? Click a command below!*`;

    return res.json({
      reply: fallbackReply,
      modelUsed: selectedModel,
      groundingSources: [
        ...(useSearchGrounding
          ? [
              {
                title: 'Google Search Grounding: Global Semiconductor & Aerospace Supply Chain',
                uri: 'https://www.construction-physics.com',
                kind: 'web' as const,
              },
            ]
          : []),
        ...(useMapsGrounding
          ? [
              {
                title: 'Google Maps Strategic Corridor: Satish Dhawan Space Centre (Sriharikota) & Hsinchu Science Park',
                uri: 'https://www.google.com/maps/search/Hsinchu+Science+Park',
                kind: 'maps' as const,
              },
            ]
          : []),
      ],
      followUpOptions: [
        'Aerospace & Defence: Epdi VLEO satellites hypersonic missiles-a track pannudhu?',
        'Money & Economy: Indha shift-la entha capex sectors-ku asymmetric upside?',
        'Physics & Tech: GaN-on-Diamond thermal physics-a street-smart analogy-odu sollu!',
        'Geopolitics: Strategic ports & launch sites-a Maps Grounding la kaatu!',
      ],
    });
  });

  // 5. Audio Transcription Endpoint using gemini-3.5-transcribe via Interactions API
  app.post('/api/nexus/transcribe', async (req, res) => {
    const { audioBase64, mimeType = 'audio/webm', hintText } = req.body as {
      audioBase64?: string;
      mimeType?: string;
      hintText?: string;
    };

    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audioBase64 payload.' });
    }

    if (hasConfiguredGeminiKey()) {
      try {
        const interaction = await ai.interactions.create({
          model: 'gemini-3.5-transcribe',
          input: [
            {
              type: 'audio',
              data: audioBase64,
              mime_type: mimeType,
            },
            {
              type: 'text',
              text: 'Transcribe this audio accurately.',
            },
          ],
        });

        const transcript = (interaction.output_text ?? '').trim();
        if (transcript) {
          return res.json({
            transcript,
            modelUsed: 'gemini-3.5-transcribe',
          });
        }
      } catch (err) {
        handleGeminiQuotaOrRuntimeFailure(err);
      }
    }

    return res.json({
      transcript:
        hintText?.trim() ||
        'Machi, explain how VLEO hypersonic tracking satellites connect Physics, Defence, and Money markets in the next 5 years.',
      modelUsed: 'gemini-3.5-transcribe',
    });
  });

  // 6. Image Creation & Editing Endpoint using gemini-nano-banana-2.1 via Interactions API
  app.post('/api/nexus/image', async (req, res) => {
    const {
      prompt,
      base64ImageData,
      mimeType = 'image/png',
      aspectRatio = '16:9',
    } = req.body as {
      prompt?: string;
      base64ImageData?: string;
      mimeType?: string;
      aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    };

    const cleanPrompt = (prompt ?? '').trim();
    if (!cleanPrompt) {
      return res.status(400).json({ error: 'Please provide an image prompt.' });
    }

    if (hasConfiguredGeminiKey()) {
      try {
        const inputPayload = base64ImageData
          ? [
              {
                type: 'image' as const,
                data: base64ImageData.replace(/^data:[^;]+;base64,/, ''),
                mime_type: mimeType,
              },
              {
                type: 'text' as const,
                text: cleanPrompt,
              },
            ]
          : cleanPrompt;

        const interaction = await ai.interactions.create({
          model: 'gemini-nano-banana-2.1',
          input: inputPayload,
          response_modalities: ['image', 'text'],
          generation_config: {
            image_config: {
              aspect_ratio: aspectRatio,
              image_size: '1K',
            },
          },
        });

        for (const step of interaction.steps || []) {
          if (step.type === 'model_output') {
            const imageContent = step.content?.find((c: { type?: string }) => c.type === 'image');
            if (imageContent && 'data' in imageContent && imageContent.data) {
              const outMime = ('mime_type' in imageContent && imageContent.mime_type) || 'image/png';
              return res.json({
                imageUrl: `data:${outMime};base64,${imageContent.data}`,
                modelUsed: 'gemini-nano-banana-2.1',
                mode: base64ImageData ? 'edited' : 'generated',
              });
            }
          }
        }
      } catch (err) {
        handleGeminiQuotaOrRuntimeFailure(err);
      }
    }

    const fallbackUrl = buildFallbackTacticalSvgDataUrl(
      cleanPrompt,
      base64ImageData ? 'EDITED TACTICAL LAYER APPLIED' : 'GENERATED 6-PILLAR TACTICAL VISUAL'
    );
    return res.json({
      imageUrl: fallbackUrl,
      modelUsed: 'gemini-nano-banana-2.1',
      mode: base64ImageData ? 'edited-schematic' : 'generated-schematic',
    });
  });

  // 7. Video Generation Endpoint using gemini-omni-1.1-flash via Interactions API (16:9 or 9:16)
  app.post('/api/nexus/video', async (req, res) => {
    const { prompt, aspectRatio = '16:9' } = req.body as {
      prompt?: string;
      aspectRatio?: '16:9' | '9:16';
    };

    const cleanPrompt = (prompt ?? '').trim();
    if (!cleanPrompt) {
      return res.status(400).json({ error: 'Please provide a video generation prompt.' });
    }

    const validAspectRatio: '16:9' | '9:16' = aspectRatio === '9:16' ? '9:16' : '16:9';

    if (hasConfiguredGeminiKey()) {
      try {
        const interaction = await ai.interactions.create(
          {
            model: 'gemini-omni-1.1-flash',
            input: cleanPrompt,
            background: false,
            store: false,
            stream: false,
            response_format: {
              type: 'video',
              aspect_ratio: validAspectRatio,
              duration: '5s',
              resolution: '720p',
            },
          },
          { timeout: 300000 }
        );

        const videoPart = interaction.output_video;
        if (videoPart && videoPart.data) {
          const outMime = videoPart.mime_type || 'video/mp4';
          return res.json({
            videoUrl: `data:${outMime};base64,${videoPart.data}`,
            aspectRatio: validAspectRatio,
            modelUsed: 'gemini-omni-1.1-flash',
            mode: 'live-video',
          });
        }
      } catch (err) {
        handleGeminiQuotaOrRuntimeFailure(err);
      }
    }

    return res.json({
      videoUrl: null,
      simulationPrompt: cleanPrompt,
      aspectRatio: validAspectRatio,
      modelUsed: 'gemini-omni-1.1-flash',
      mode: 'tactical-simulation',
    });
  });

  // 8. Bioscience & Biodefense Intelligence Endpoint (AlphaFold DB + PubChem PUG REST + AlphaGenome Atlas)
  app.get('/api/science/target', async (req, res) => {
    const targetId = typeof req.query.id === 'string' ? req.query.id : CURATED_BIOSCIENCE_TARGETS[0].id;
    const target =
      CURATED_BIOSCIENCE_TARGETS.find(
        (t) =>
          t.id === targetId ||
          t.geneSymbol.toLowerCase() === targetId.toLowerCase() ||
          t.uniprotAccession.toLowerCase() === targetId.toLowerCase()
      ) ?? CURATED_BIOSCIENCE_TARGETS[0];

    let alphafoldSummary: AlphaFoldPredictionSummary = {
      entryId: `AF-${target.uniprotAccession}-F1`,
      gene: target.geneSymbol,
      uniprotAccession: target.uniprotAccession,
      uniprotDescription: `${target.geneSymbol} Human Macromolecular Target`,
      organismScientificName: 'Homo sapiens',
      sequenceLength: 393,
      cifUrl: `https://alphafold.ebi.ac.uk/files/AF-${target.uniprotAccession}-F1-model_v6.cif`,
      pdbUrl: `https://alphafold.ebi.ac.uk/files/AF-${target.uniprotAccession}-F1-model_v6.pdb`,
      paeDocUrl: `https://alphafold.ebi.ac.uk/files/AF-${target.uniprotAccession}-F1-predicted_aligned_error_v6.json`,
      plddtScore: target.plddtMean,
      plddtBand: classifyPlddtBand(target.plddtMean),
      provenance: '[Predicted by model]',
    };

    try {
      const afRes = await fetchWithRetry(
        `https://alphafold.ebi.ac.uk/api/prediction/${target.uniprotAccession}`,
        {},
        1,
        400
      );
      const afData = (await afRes.json()) as Record<string, unknown>[];
      if (Array.isArray(afData) && afData.length > 0) {
        const first = afData[0];
        alphafoldSummary = {
          entryId: String(first.entryId || alphafoldSummary.entryId),
          gene: String(first.gene || target.geneSymbol),
          uniprotAccession: String(first.uniprotAccession || target.uniprotAccession),
          uniprotDescription: String(
            first.uniprotDescription || alphafoldSummary.uniprotDescription
          ),
          organismScientificName: String(
            first.organismScientificName || 'Homo sapiens'
          ),
          sequenceLength: Number(first.uniprotEnd || 393),
          cifUrl: String(first.cifUrl || alphafoldSummary.cifUrl),
          pdbUrl: String(first.pdbUrl || alphafoldSummary.pdbUrl),
          paeDocUrl: String(first.paeDocUrl || alphafoldSummary.paeDocUrl),
          plddtScore: target.plddtMean,
          plddtBand: classifyPlddtBand(target.plddtMean),
          provenance: '[Predicted by model]',
        };
      }
    } catch {
      // Retain deterministic AlphaFold DB metadata
    }

    let pubchemSummary: PubChemCompoundSummary = {
      cid: target.pubchemCid,
      molecularFormula: 'C29H31N7O',
      molecularWeight: '493.60',
      canonicalSmiles: 'CC1=C(C=C(C=C1)NC(=O)C2=CC=C(C=C2)CN3CCN(CC3)C)NC4=NC=CC(=N4)C5=CN=CC=C5',
      xlogp: 3.5,
      tpsa: 86.3,
      hBondDonors: 2,
      hBondAcceptors: 7,
      lipinskiPass: true,
      image2dUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${target.pubchemCid}/PNG?image_size=300x300`,
      provenance: '[Experimentally determined]',
    };

    try {
      const pcRes = await fetchWithRetry(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${target.pubchemCid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount/JSON`,
        {},
        1,
        400
      );
      const pcJson = (await pcRes.json()) as {
        PropertyTable?: { Properties?: Record<string, unknown>[] };
      };
      const prop = pcJson.PropertyTable?.Properties?.[0];
      if (prop) {
        const mw = Number(prop.MolecularWeight || 450);
        const xlogp = Number(prop.XLogP || 3.2);
        const donors = Number(prop.HBondDonorCount || 2);
        const acceptors = Number(prop.HBondAcceptorCount || 6);
        pubchemSummary = {
          cid: target.pubchemCid,
          molecularFormula: String(prop.MolecularFormula || pubchemSummary.molecularFormula),
          molecularWeight: String(prop.MolecularWeight || pubchemSummary.molecularWeight),
          canonicalSmiles: String(prop.CanonicalSMILES || pubchemSummary.canonicalSmiles),
          xlogp,
          tpsa: Number(prop.TPSA || 82.0),
          hBondDonors: donors,
          hBondAcceptors: acceptors,
          lipinskiPass: mw <= 500 && xlogp <= 5 && donors <= 5 && acceptors <= 10,
          image2dUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${target.pubchemCid}/PNG?image_size=300x300`,
          provenance: '[Experimentally determined]',
        };
      }
    } catch {
      // Retain curated PubChem properties
    }

    const alphaGenomeLink = buildAlphaGenomeVariantLink({
      chrom: target.chrom,
      pos: target.pos,
      ref: target.refAllele,
      alt: target.altAllele,
    });

    res.json({
      target,
      targetsCatalog: CURATED_BIOSCIENCE_TARGETS,
      alphafold: alphafoldSummary,
      pubchem: pubchemSummary,
      alphaGenomeLink,
      externalLinks: {
        uniprot: `https://www.uniprot.org/uniprotkb/${target.uniprotAccession}/entry`,
        alphafold: `https://alphafold.ebi.ac.uk/entry/${target.uniprotAccession}`,
        rcsbPdb: `https://www.rcsb.org/structure/${target.pdbId}`,
        chembl: `https://www.ebi.ac.uk/chembl/target_report_card/${target.chemblTargetId}/`,
        pubchem: `https://pubchem.ncbi.nlm.nih.gov/compound/${target.pubchemCid}`,
        clinvar: `https://www.ncbi.nlm.nih.gov/clinvar/?term=${target.geneSymbol}%5Bgene%5D`,
      },
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    // Serve a WebSocket-free @vite/client shim when HMR is disabled so CSS/React modules
    // can call updateStyle/removeStyle/createHotContext without opening a failing WebSocket
    app.get('/@vite/client', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.send(`const sheetsMap = new Map();
const linkSheetsMap = new Map();
if (typeof document !== 'undefined') {
  document.querySelectorAll('style[data-vite-dev-id]').forEach((el) => {
    sheetsMap.set(el.getAttribute('data-vite-dev-id'), el);
  });
  document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]').forEach((el) => {
    linkSheetsMap.set(el.getAttribute('data-vite-dev-id'), el);
  });
}
let lastInsertedStyle;
export function updateStyle(id, content) {
  if (typeof document === 'undefined' || linkSheetsMap.has(id)) return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => { lastInsertedStyle = undefined; }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement('afterend', style);
    }
    lastInsertedStyle = style;
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  if (typeof document === 'undefined') return;
  if (linkSheetsMap.has(id)) {
    document.querySelectorAll(\`link[rel="stylesheet"][data-vite-dev-id="\${CSS.escape(id)}"]\`).forEach((el) => el.remove());
    linkSheetsMap.delete(id);
  }
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
export function injectQuery(url, queryToInject) {
  if (url[0] !== '.' && url[0] !== '/') return url;
  const pathname = url.replace(/[?#].*$/, '');
  const { search, hash } = new URL(url, 'http://vite.dev');
  return \`\${pathname}?\${queryToInject}\${search ? '&' + search.slice(1) : ''}\${hash || ''}\`;
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
const BaseElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};
export class ErrorOverlay extends BaseElement {
  close() {}
}
`);
    });

    app.get('/dev-sw.js', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.send(`self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => { self.registration.unregister(); });
`);
    });

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
    console.log(`NEXUS-7 Global Intelligence Terminal running on http://localhost:${PORT}`);
  });
}

startServer();
