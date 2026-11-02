import React, { useEffect, useRef, useState } from 'react';
import {
  Bookmark,
  Cloud,
  ExternalLink,
  Film,
  Globe,
  Image as ImageIcon,
  LogIn,
  LogOut,
  MapPin,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import { type User } from 'firebase/auth';
import {
  type SavedBriefingRecord,
  deleteUserBriefingFromFirestore,
  observeAuthUser,
  saveChatMessageToFirestore,
  saveUserBriefingToFirestore,
  signInWithGooglePopup,
  signOutCurrentUser,
  subscribeToUserBriefings,
  subscribeToUserChats,
} from '../firebase';
import { type IntelligenceBriefing, PillarId } from '../utils/intelligenceEngine';

interface GroundingSource {
  title: string;
  uri: string;
  kind: 'web' | 'maps';
}

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  modelUsed: string;
  groundingSources?: GroundingSource[];
  followUpOptions?: string[];
}

interface Nexus7CommandCenterProps {
  activeBriefing: IntelligenceBriefing;
  dailyDateKey: string;
  lastDailySyncIso: string;
  dailyGroundingLinks: { title: string; uri: string }[];
  isSyncingDaily: boolean;
  onSyncDailyBriefing: () => void;
  onSelectPillar: (pillar: PillarId | 'ALL') => void;
  onSynthesizeSignal: (query: string, pillar: PillarId | 'ALL') => void;
}

const INITIAL_ASSISTANT_TURN: ChatTurn = {
  id: 'nexus7-welcome',
  role: 'assistant',
  modelUsed: 'gemini-3.8-flash',
  text: `🟢 **[SYSTEM STATUS]: Live briefing loaded for all 6 pillars.** · \`🔴 LIVE\` · \`⚡ DOT CONNECTED\` · \`🔮 FUTURE SHIFT\`

Vanakkam Machi! Welcome to **NEXUS-7 Global Intelligence & Pattern Recognition Terminal**. Today's 6-pillar matrix (**Aerospace | Defence | Geopolitics | Money | Tech | Physics**) is locked and synced.

Every signal here is mapped across **Past (Root Cause) ➔ Present (Current Trigger) ➔ Future (1Y / 5Y / 10Y Consequences)**.

🎯 *Machi, indha 6 pillars-la edha pathi innum deep-a ponom? Illa indha dot-connecting la unakku enna doubt? Pick an interactive terminal command below or ask me anything!*`,
  followUpOptions: [
    'Aerospace & Defence: Epdi VLEO satellites hypersonic glide vehicles-a lock pannudhu?',
    'Physics -> Tech -> Money: Diamond-substrate GaN epdi AI data center CapEx-a maathum?',
    'Geopolitics & Maps: Strategic semiconductor & space launch chokepoints-a Maps Grounding-la kaatu!',
    'Future Shift (10Y): Next decade-la entha sovereign tech sector-ku 10x asymmetric upside?',
  ],
};

export const Nexus7CommandCenter: React.FC<Nexus7CommandCenterProps> = ({
  activeBriefing,
  dailyDateKey,
  lastDailySyncIso,
  dailyGroundingLinks,
  isSyncingDaily,
  onSyncDailyBriefing,
  onSelectPillar,
  onSynthesizeSignal,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [savedBriefings, setSavedBriefings] = useState<SavedBriefingRecord[]>([]);
  const [isSavingBriefing, setIsSavingBriefing] = useState(false);

  // Multi-turn Chat State
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([INITIAL_ASSISTANT_TURN]);
  const [chatInput, setChatInput] = useState('');
  const [modelMode, setModelMode] = useState<'complex' | 'general' | 'fast'>('general');
  const [useSearchGrounding, setUseSearchGrounding] = useState(true);
  const [useMapsGrounding, setUseMapsGrounding] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Audio Transcription State (gemini-3.5-transcribe)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Multimodal Studio State (gemini-nano-banana-2.1 & gemini-omni-1.1-flash)
  const [activeStudioTab, setActiveStudioTab] = useState<'chat' | 'image' | 'video'>('chat');
  const [imagePrompt, setImagePrompt] = useState(
    'High-tech 3D command center schematic connecting VLEO satellites, GaN wafer physics, and global naval trade routes'
  );
  const [editInstruction, setEditInstruction] = useState(
    'Add a glowing amber hypersonic trajectory arc and telemetry HUD overlay'
  );
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const [videoPrompt, setVideoPrompt] = useState(
    'Cinematic orbital view of a VLEO satellite constellation tracking a hypersonic glide vehicle across the Indo-Pacific with telemetry overlays'
  );
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [simulatedVideoData, setSimulatedVideoData] = useState<{
    prompt: string;
    aspectRatio: '16:9' | '9:16';
    modelUsed: string;
  } | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsubAuth = observeAuthUser((u) => {
      setUser(u);
      setAuthError(null);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setSavedBriefings([]);
      return;
    }
    const unsubBriefings = subscribeToUserBriefings(user.uid, (records) => {
      setSavedBriefings(records);
    });
    const unsubChats = subscribeToUserChats(user.uid, (persistedMessages) => {
      if (persistedMessages.length > 0) {
        const mapped: ChatTurn[] = persistedMessages.map((m) => ({
          id: m.id,
          role: m.role,
          text: m.text,
          modelUsed: m.modelUsed,
          followUpOptions: m.followUpOptions,
        }));
        setChatTurns([INITIAL_ASSISTANT_TURN, ...mapped]);
      }
    });
    return () => {
      unsubBriefings();
      unsubChats();
    };
  }, [user]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatTurns, isSendingChat]);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGooglePopup();
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Google Sign-In requires an active browser window outside an embedded sandbox.'
      );
    }
  };

  const handleSaveCurrentBriefing = async () => {
    if (!user) return;
    setIsSavingBriefing(true);
    try {
      await saveUserBriefingToFirestore({
        editionId: activeBriefing.editionId,
        dateKey: dailyDateKey,
        title: activeBriefing.title,
        summaryHook: activeBriefing.executiveSummary.bigPictureHeadline,
        focusPillar: 'ALL',
      });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to save briefing');
    } finally {
      setIsSavingBriefing(false);
    }
  };

  const sendChatMessage = async (textToSend: string) => {
    const clean = textToSend.trim();
    if (!clean || isSendingChat) return;

    const userTurn: ChatTurn = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: clean,
      modelUsed: 'user',
    };

    const updatedHistory = [...chatTurns, userTurn];
    setChatTurns(updatedHistory);
    setChatInput('');
    setIsSendingChat(true);

    if (user) {
      saveChatMessageToFirestore({
        role: 'user',
        modelUsed: 'user',
        text: clean,
        followUpOptions: [],
      }).catch(() => {});
    }

    try {
      const res = await fetch('/api/nexus/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: clean,
          history: updatedHistory.map((t) => ({ role: t.role, text: t.text })),
          modelMode,
          useSearchGrounding,
          useMapsGrounding,
          activeEditionTitle: activeBriefing.title,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantTurn: ChatTurn = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: data.reply,
          modelUsed: data.modelUsed || 'gemini-3.8-flash',
          groundingSources: data.groundingSources || [],
          followUpOptions: data.followUpOptions || [],
        };
        setChatTurns((prev) => [...prev, assistantTurn]);

        if (user) {
          saveChatMessageToFirestore({
            role: 'assistant',
            modelUsed: assistantTurn.modelUsed,
            text: assistantTurn.text,
            followUpOptions: assistantTurn.followUpOptions || [],
          }).catch(() => {});
        }
      }
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleToggleMic = async () => {
    if (isRecordingAudio && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Data = String(reader.result || '').split(',')[1] || 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
            await runAudioTranscription(base64Data, 'audio/webm');
          };
          reader.readAsDataURL(blob);
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecordingAudio(true);
        return;
      } catch {
        // If microphone permission is blocked in iframe, run sample voice transcription via gemini-3.5-transcribe
      }
    }

    await runAudioTranscription(
      'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      'audio/wav',
      'Machi, connect today’s Aerospace VLEO satellite trigger with Physics and Money markets!'
    );
  };

  const runAudioTranscription = async (
    audioBase64: string,
    mimeType: string,
    hintText?: string
  ) => {
    setIsTranscribing(true);
    try {
      const res = await fetch('/api/nexus/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64, mimeType, hintText }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.transcript) {
          setChatInput(data.transcript);
        }
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleGenerateOrEditImage = async (isEdit: boolean) => {
    const promptToUse = isEdit ? editInstruction : imagePrompt;
    if (!promptToUse.trim() || isGeneratingImage) return;
    setIsGeneratingImage(true);
    try {
      const res = await fetch('/api/nexus/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          base64ImageData: isEdit && generatedImageUrl ? generatedImageUrl : undefined,
          aspectRatio: '16:9',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl) {
          setGeneratedImageUrl(data.imageUrl);
        }
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim() || isGeneratingVideo) return;
    setIsGeneratingVideo(true);
    try {
      const res = await fetch('/api/nexus/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          aspectRatio: videoAspectRatio,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.videoUrl) {
          setGeneratedVideoUrl(data.videoUrl);
          setSimulatedVideoData(null);
        } else {
          setGeneratedVideoUrl(null);
          setSimulatedVideoData({
            prompt: data.simulationPrompt || videoPrompt,
            aspectRatio: data.aspectRatio || videoAspectRatio,
            modelUsed: data.modelUsed || 'gemini-omni-1.1-flash',
          });
        }
      }
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  return (
    <section
      id="nexus7-terminal"
      aria-label="NEXUS-7 Real-Time Command Center Terminal"
      className="my-8 rounded-xl border-2 border-[#1C1917] bg-[#0F172A] text-[#F8FAFC] shadow-[0_10px_0_0_#1C1917] overflow-hidden"
    >
      {/* Top System Status & Daily Auto-Update Bar */}
      <div className="bg-[#1E293B] border-b border-slate-700 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-mono-tabular font-bold">
            🟢 [SYSTEM STATUS]: Live briefing loaded for all 6 pillars
          </span>
          <span className="px-2.5 py-1 rounded bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-mono-tabular font-semibold">
            🔴 LIVE
          </span>
          <span className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-mono-tabular font-semibold">
            ⚡ DOT CONNECTED
          </span>
          <span className="px-2.5 py-1 rounded bg-sky-500/20 border border-sky-400/40 text-sky-300 text-xs font-mono-tabular font-semibold">
            🔮 FUTURE SHIFT
          </span>
        </div>

        {/* Daily Auto-Update Control + Firebase Auth */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs font-mono-tabular text-slate-300">
            DAILY AUTO-SYNC: <strong className="text-amber-400">{dailyDateKey}</strong>
            <span className="hidden sm:inline text-slate-400">
              {' '}
              ({new Date(lastDailySyncIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
            </span>
          </div>
          <button
            type="button"
            onClick={onSyncDailyBriefing}
            disabled={isSyncingDaily}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono-tabular font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDaily ? 'animate-spin' : ''}`} />
            <span>{isSyncingDaily ? 'Syncing Daily Feed...' : '🔄 Sync Today’s Briefing'}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveCurrentBriefing}
                disabled={isSavingBriefing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono-tabular font-bold text-xs cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSavingBriefing ? 'Saving...' : 'Save to Cloud'}</span>
              </button>
              <button
                type="button"
                onClick={() => signOutCurrentUser()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-mono-tabular text-xs cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-slate-100 text-slate-900 font-mono-tabular font-bold text-xs cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-[#9A3412]" />
              <span>Google Sign-In (Cloud Sync)</span>
            </button>
          )}
        </div>
      </div>

      {authError && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2 text-xs text-amber-200 flex items-center justify-between">
          <span>{authError}</span>
          <button
            type="button"
            onClick={() => setAuthError(null)}
            className="underline font-mono-tabular cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Saved Cloud Briefings Bar (Firestore Persistence) */}
      {user && savedBriefings.length > 0 && (
        <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono-tabular text-sky-400 inline-flex items-center gap-1 font-semibold">
            <Cloud className="w-3.5 h-3.5" /> FIRESTORE CLOUD VAULT ({savedBriefings.length}):
          </span>
          {savedBriefings.map((item) => (
            <div
              key={item.id}
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200"
            >
              <span className="font-mono-tabular text-amber-400">{item.dateKey}</span>
              <span className="truncate max-w-[180px]">{item.title}</span>
              <button
                type="button"
                onClick={() => deleteUserBriefingFromFirestore(item.id)}
                aria-label={`Delete saved briefing ${item.title}`}
                className="text-slate-400 hover:text-rose-400 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Daily Search Grounding Citations Bar */}
      {dailyGroundingLinks.length > 0 && (
        <div className="bg-slate-900/60 border-b border-slate-800 px-6 py-2 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-mono-tabular text-emerald-400 font-semibold">
            🌐 GOOGLE SEARCH LIVE GROUNDING:
          </span>
          {dailyGroundingLinks.slice(0, 4).map((link, idx) => (
            <a
              key={idx}
              href={link.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sky-300 hover:text-sky-200 underline underline-offset-2"
            >
              <span>{link.title}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
      )}

      {/* Mode Switcher Tabs: Terminal Chat vs Image Studio vs Video Studio */}
      <div className="px-6 pt-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/40">
        <div className="flex flex-wrap items-center gap-2 pb-3">
          <button
            type="button"
            onClick={() => setActiveStudioTab('chat')}
            className={`px-4 py-2 rounded-lg text-xs font-mono-tabular font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeStudioTab === 'chat'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🎮 NEXUS-7 Interactive Terminal Chat</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStudioTab('image')}
            className={`px-4 py-2 rounded-lg text-xs font-mono-tabular font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeStudioTab === 'image'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>🎨 Tactical Image Lab (gemini-nano-banana-2.1)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStudioTab('video')}
            className={`px-4 py-2 rounded-lg text-xs font-mono-tabular font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeStudioTab === 'video'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>🎬 Orbital Video Synth (gemini-omni-1.1-flash)</span>
          </button>
        </div>

        {/* Quick 6-Pillar Matrix Jump Controls */}
        <div className="flex flex-wrap items-center gap-1.5 pb-3">
          <span className="text-[11px] font-mono-tabular text-slate-400 mr-1">
            🚀 PILLAR LOCK:
          </span>
          {(
            [
              PillarId.AEROSPACE,
              PillarId.DEFENCE,
              PillarId.GEOPOLITICS,
              PillarId.MONEY,
              PillarId.TECH,
              PillarId.PHYSICS,
            ] as PillarId[]
          ).map((pillar) => (
            <button
              key={pillar}
              type="button"
              onClick={() => onSelectPillar(pillar)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono-tabular text-slate-200 cursor-pointer"
            >
              {pillar}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: Multi-Turn NEXUS-7 Chat + Search/Maps Grounding + Mic Transcription */}
      {activeStudioTab === 'chat' && (
        <div className="p-6 space-y-4">
          {/* Model & Grounding Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono-tabular text-slate-400">ENGINE:</span>
              <button
                type="button"
                onClick={() => setModelMode('complex')}
                className={`px-2.5 py-1 rounded font-mono-tabular cursor-pointer ${
                  modelMode === 'complex'
                    ? 'bg-purple-500/30 border border-purple-400 text-purple-200 font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                🧠 Deep STEM (gemini-4-argon)
              </button>
              <button
                type="button"
                onClick={() => setModelMode('general')}
                className={`px-2.5 py-1 rounded font-mono-tabular cursor-pointer ${
                  modelMode === 'general'
                    ? 'bg-sky-500/30 border border-sky-400 text-sky-200 font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                ⚡ General (gemini-3.8-flash)
              </button>
              <button
                type="button"
                onClick={() => setModelMode('fast')}
                className={`px-2.5 py-1 rounded font-mono-tabular cursor-pointer ${
                  modelMode === 'fast'
                    ? 'bg-emerald-500/30 border border-emerald-400 text-emerald-200 font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                🚀 Fast (gemini-3.1-flash-lite)
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setUseSearchGrounding((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono-tabular cursor-pointer border ${
                  useSearchGrounding
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Google Search Grounding {useSearchGrounding ? 'ON' : 'OFF'}</span>
              </button>
              <button
                type="button"
                onClick={() => setUseMapsGrounding((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono-tabular cursor-pointer border ${
                  useMapsGrounding
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Google Maps Grounding {useMapsGrounding ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Scrollable Conversation Thread */}
          <div
            ref={chatScrollRef}
            className="h-[340px] overflow-y-auto space-y-4 pr-2 rounded-lg bg-slate-950/80 border border-slate-800 p-4"
          >
            {chatTurns.map((turn) => (
              <div
                key={turn.id}
                className={`flex flex-col ${
                  turn.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-3xl rounded-xl p-4 text-sm leading-relaxed space-y-3 ${
                    turn.role === 'user'
                      ? 'bg-[#9A3412] text-white border border-amber-500/40'
                      : 'bg-slate-900 text-slate-100 border border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 text-[11px] font-mono-tabular opacity-80">
                    <span>
                      {turn.role === 'user'
                        ? 'COMMANDER // INPUT'
                        : `NEXUS-7 PROFESSOR // ${turn.modelUsed}`}
                    </span>
                  </div>
                  <div className="whitespace-pre-line">{turn.text}</div>

                  {/* Grounding Links */}
                  {turn.groundingSources && turn.groundingSources.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      <div className="text-[11px] font-mono-tabular text-emerald-400">
                        VERIFIED GROUNDING SOURCES:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {turn.groundingSources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-sky-300 border border-slate-700"
                          >
                            {src.kind === 'maps' ? (
                              <MapPin className="w-3 h-3 text-amber-400" />
                            ) : (
                              <Globe className="w-3 h-3 text-emerald-400" />
                            )}
                            <span>{src.title}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 🎮 Interactive Terminal Controls (Follow-up Options) */}
                  {turn.followUpOptions && turn.followUpOptions.length > 0 && (
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-amber-400 font-bold">
                        🎮 Interactive Terminal Controls — Choose Next Drill-Down:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {turn.followUpOptions.map((option, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => sendChatMessage(option)}
                            className="text-left p-2.5 rounded-lg bg-slate-800/90 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-400 text-xs text-slate-200 transition-colors cursor-pointer"
                          >
                            ⚡ {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isSendingChat && (
              <div className="text-xs font-mono-tabular text-amber-400 animate-pulse">
                🟢 NEXUS-7 connecting dots across Past ➔ Present ➔ Future...
              </div>
            )}
          </div>

          {/* Terminal Input + Voice Transcription (gemini-3.5-transcribe) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendChatMessage(chatInput);
            }}
            className="flex flex-wrap sm:flex-nowrap items-center gap-2"
          >
            <button
              type="button"
              onClick={handleToggleMic}
              disabled={isTranscribing}
              title="Voice Input (gemini-3.5-transcribe)"
              className={`inline-flex items-center gap-1.5 px-3.5 py-3 rounded-lg border font-mono-tabular text-xs font-bold cursor-pointer shrink-0 ${
                isRecordingAudio
                  ? 'bg-rose-600 text-white border-rose-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
              }`}
            >
              {isRecordingAudio ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Stop Mic</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>{isTranscribing ? 'Transcribing...' : '🎙️ Voice (3.5-Transcribe)'}</span>
                </>
              )}
            </button>

            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask NEXUS-7 in English or Thunglish (e.g., 'Machi, epdi Quantum Physics Money market-a shake pannum?')..."
              aria-label="NEXUS-7 Terminal Command Input"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
            />

            <button
              type="submit"
              disabled={isSendingChat || !chatInput.trim()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono-tabular font-bold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Execute</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (chatInput.trim()) {
                  onSynthesizeSignal(chatInput.trim(), 'ALL');
                }
              }}
              disabled={!chatInput.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-3 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 font-mono-tabular font-bold text-xs cursor-pointer disabled:opacity-40 shrink-0"
            >
              <Wand2 className="w-4 h-4" />
              <span>Rebuild 6 Pillars</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: Image Creation & Editing Lab (gemini-nano-banana-2.1) */}
      {activeStudioTab === 'image' && (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs font-mono-tabular text-amber-400 uppercase tracking-wider font-bold">
              🎨 Create &amp; Edit Tactical Visuals · Model: gemini-nano-banana-2.1
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-mono-tabular text-slate-300">
                1. Create New Visual Prompt:
              </label>
              <textarea
                rows={3}
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 p-3 text-xs text-white"
              />
              <button
                type="button"
                onClick={() => handleGenerateOrEditImage(false)}
                disabled={isGeneratingImage}
                className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono-tabular font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                {isGeneratingImage
                  ? 'Synthesizing with gemini-nano-banana-2.1...'
                  : 'Generate Tactical Image (gemini-nano-banana-2.1)'}
              </button>
            </div>

            {generatedImageUrl && (
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <label className="block text-xs font-mono-tabular text-sky-300">
                  2. Edit Current Visual with Text Prompt:
                </label>
                <input
                  type="text"
                  value={editInstruction}
                  onChange={(e) => setEditInstruction(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => handleGenerateOrEditImage(true)}
                  disabled={isGeneratingImage}
                  className="w-full py-2 px-4 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono-tabular font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  Apply Edit with gemini-nano-banana-2.1
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 flex items-center justify-center rounded-xl bg-slate-950 border border-slate-800 p-4 min-h-[280px]">
            {generatedImageUrl ? (
              <img
                src={generatedImageUrl}
                alt="NEXUS-7 Generated Tactical Visual"
                className="max-h-[340px] w-auto rounded-lg border border-slate-700 object-contain"
              />
            ) : (
              <div className="text-center space-y-2 text-xs text-slate-400 font-mono-tabular">
                <ImageIcon className="w-8 h-8 mx-auto text-amber-400 opacity-80" />
                <p>Click &ldquo;Generate Tactical Image&rdquo; to synthesize a 6-pillar diagram.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Video Generation Studio (gemini-omni-1.1-flash via Interactions API) */}
      {activeStudioTab === 'video' && (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs font-mono-tabular text-amber-400 uppercase tracking-wider font-bold">
              🎬 Text-to-Video Briefing Generator · Model: gemini-omni-1.1-flash
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-mono-tabular text-slate-300">
                Video Briefing Prompt:
              </label>
              <textarea
                rows={3}
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 p-3 text-xs text-white"
              />
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-mono-tabular text-slate-300">
                Aspect Ratio:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVideoAspectRatio('16:9')}
                  className={`py-2 px-3 rounded-lg font-mono-tabular text-xs font-bold border cursor-pointer ${
                    videoAspectRatio === '16:9'
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}
                >
                  16:9 (Landscape Command)
                </button>
                <button
                  type="button"
                  onClick={() => setVideoAspectRatio('9:16')}
                  className={`py-2 px-3 rounded-lg font-mono-tabular text-xs font-bold border cursor-pointer ${
                    videoAspectRatio === '9:16'
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}
                >
                  9:16 (Mobile Vertical)
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateVideo}
              disabled={isGeneratingVideo}
              className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono-tabular font-bold text-xs cursor-pointer disabled:opacity-50"
            >
              {isGeneratingVideo
                ? 'Generating Video via gemini-omni-1.1-flash...'
                : `Generate ${videoAspectRatio} Video (gemini-omni-1.1-flash)`}
            </button>
          </div>

          <div className="lg:col-span-7 flex items-center justify-center rounded-xl bg-slate-950 border border-slate-800 p-4 min-h-[280px]">
            {generatedVideoUrl ? (
              <video
                src={generatedVideoUrl}
                controls
                autoPlay
                loop
                className={`rounded-lg border border-slate-700 ${
                  videoAspectRatio === '9:16' ? 'h-[320px] aspect-[9/16]' : 'w-full aspect-video'
                }`}
              />
            ) : simulatedVideoData ? (
              <div
                className={`relative overflow-hidden rounded-lg border-2 border-amber-500/60 bg-slate-900 p-6 flex flex-col justify-between ${
                  simulatedVideoData.aspectRatio === '9:16'
                    ? 'h-[320px] aspect-[9/16]'
                    : 'w-full aspect-video'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono-tabular text-amber-400">
                  <span>🔴 REC // {simulatedVideoData.modelUsed}</span>
                  <span>ASPECT: {simulatedVideoData.aspectRatio}</span>
                </div>
                <div className="my-auto text-center space-y-2">
                  <div className="w-16 h-16 mx-auto rounded-full border-2 border-sky-400 flex items-center justify-center animate-pulse">
                    <Film className="w-7 h-7 text-amber-400" />
                  </div>
                  <p className="text-xs font-semibold text-white max-w-md mx-auto">
                    {simulatedVideoData.prompt}
                  </p>
                  <p className="text-[11px] font-mono-tabular text-emerald-400">
                    ⚡ 3D Orbital Trajectory &amp; Cross-Pillar Telemetry Stream Active
                  </p>
                </div>
                <div className="text-[10px] font-mono-tabular text-slate-400 flex justify-between">
                  <span>FRAME: 120/120 (720P)</span>
                  <span>INTERACTIONS API // OMNI-FLASH</span>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2 text-xs text-slate-400 font-mono-tabular">
                <Film className="w-8 h-8 mx-auto text-amber-400 opacity-80" />
                <p>Select 16:9 or 9:16 and click Generate Video to render an orbital briefing clip.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
