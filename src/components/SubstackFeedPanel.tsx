import React, { useState } from 'react';
import { ExternalLink, RefreshCw, ArrowUpRight, BookOpen } from 'lucide-react';
import {
  CURATED_SUBSTACK_SOURCES,
  SubstackArticle,
  SubstackSource,
} from '../utils/substackParser';

interface SubstackFeedPanelProps {
  articles: SubstackArticle[];
  activeArticleId: string | null;
  isSyncingRss: boolean;
  isDecodingUrl: boolean;
  onSelectArticle: (article: SubstackArticle) => void;
  onSyncLiveRss: (sourceId: string) => void;
  onDecodeCustomSubstackUrl: (urlOrTopic: string) => Promise<void>;
}

export const SubstackFeedPanel: React.FC<SubstackFeedPanelProps> = ({
  articles,
  activeArticleId,
  isSyncingRss,
  isDecodingUrl,
  onSelectArticle,
  onSyncLiveRss,
  onDecodeCustomSubstackUrl,
}) => {
  const [selectedSourceId, setSelectedSourceId] = useState<string>('ALL');
  const [customSubstackInput, setCustomSubstackInput] = useState<string>('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const visibleArticles =
    selectedSourceId === 'ALL'
      ? articles
      : articles.filter((a) => a.sourceId === selectedSourceId);

  const handleSourceFilter = (sourceId: string) => {
    setSelectedSourceId(sourceId);
  };

  const handleDecodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSubstackInput.trim();
    if (!trimmed) {
      setUrlError(
        'Substack URL or dispatch headline cannot be empty. Paste a Substack link (e.g. https://www.construction-physics.com) or article title.'
      );
      return;
    }
    if (trimmed.length < 6) {
      setUrlError('Please enter at least 6 characters for a valid Substack URL or dispatch title.');
      return;
    }
    setUrlError(null);
    await onDecodeCustomSubstackUrl(trimmed);
  };

  return (
    <section
      id="substack-wire"
      aria-labelledby="substack-wire-heading"
      className="py-10 border-b border-[#D6CEBE]"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-tabular uppercase tracking-widest text-[#9A3412] mb-2">
            <span>SUBSTACK INTELLIGENCE WIRE</span>
            <span aria-hidden="true">·</span>
            <span>6-PILLAR SOURCE INGESTION</span>
            <span aria-hidden="true">·</span>
            <span>LIVE RSS &amp; DISPATCH DECODER</span>
          </div>
          <h2
            id="substack-wire-heading"
            className="text-2xl lg:text-3xl font-editorial font-semibold text-[#1C1917] tracking-tight"
          >
            Substack Dispatches Decoded in Thunglish
          </h2>
          <p className="mt-2 text-sm text-[#57534E] max-w-2xl leading-relaxed">
            Select any dispatch from leading macro, semiconductor, aerospace, and physics Substack
            publications—or paste any Substack URL—to run it through the 3-Dimensional Pattern Matrix
            (Past, Present, Future) and connect the dots across all 6 pillars.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onSyncLiveRss(selectedSourceId)}
            disabled={isSyncingRss}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#1C1917] bg-[#F3EFE6] border border-[#D6CEBE] rounded-md hover:bg-[#EBE5D8] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingRss ? 'animate-spin' : ''}`} />
            <span>{isSyncingRss ? 'Fetching Substack RSS...' : 'Sync Live Substack RSS'}</span>
          </button>
        </div>
      </div>

      {/* Publication Filter Bar (Interactive Functional Segmented Controls) */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#F3EFE6] border border-[#D6CEBE] rounded-lg mb-8">
        <button
          type="button"
          onClick={() => handleSourceFilter('ALL')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            selectedSourceId === 'ALL'
              ? 'bg-[#1C1917] text-[#FBF9F5]'
              : 'text-[#57534E] hover:text-[#1C1917]'
          }`}
        >
          All Substack Sources ({articles.length})
        </button>
        {CURATED_SUBSTACK_SOURCES.map((source: SubstackSource) => (
          <button
            key={source.id}
            type="button"
            onClick={() => handleSourceFilter(source.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedSourceId === source.id
                ? 'bg-[#1C1917] text-[#FBF9F5]'
                : 'text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            {source.name}
          </button>
        ))}
      </div>

      {/* Substack Dispatch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {visibleArticles.map((article) => {
          const isSelected = activeArticleId === article.id;
          return (
            <article
              key={article.id}
              className={`surface-3d-card flex flex-col justify-between p-6 rounded-lg transition-colors ${
                isSelected
                  ? 'bg-[#F3EFE6] border-[#9A3412]'
                  : 'bg-[#FBF9F5] border-[#292524]'
              }`}
            >
              <div>
                {/* Unboxed metadata with typographic separators (Zero-Pill rule) */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono-tabular text-[#78716C] mb-3">
                  <span className="font-semibold text-[#9A3412]">{article.publicationName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{article.author}</span>
                  <span aria-hidden="true">·</span>
                  <span>{article.publishedAt}</span>
                </div>

                <h3 className="text-lg font-editorial font-semibold text-[#1C1917] leading-snug mb-2">
                  {article.title}
                </h3>

                <p className="text-xs font-mono-tabular text-[#57534E] mb-3">
                  Primary Vector: {article.primaryPillar} · Cross-Pillar Synthesis Ready
                </p>

                <p className="text-sm text-[#44403C] leading-relaxed mb-5">{article.excerpt}</p>
              </div>

              <div className="pt-4 border-t border-[#E7E2D8] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onSelectArticle(article)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#9A3412] text-[#FBF9F5]'
                      : 'bg-[#1C1917] text-[#FBF9F5] hover:bg-[#9A3412]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>
                    {isSelected ? 'Active in Briefing Below' : 'Decode in Thunglish Matrix'}
                  </span>
                </button>

                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Read original ${article.title} on Substack`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#57534E] hover:text-[#1C1917] whitespace-nowrap shrink-0"
                >
                  <span>Substack</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {/* Custom Substack URL / Dispatch Ingestion Form */}
      <form
        onSubmit={handleDecodeSubmit}
        noValidate
        className="p-6 bg-[#F3EFE6] border border-[#D6CEBE] rounded-lg"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="max-w-xl">
            <label
              htmlFor="substack-url-input"
              className="block text-sm font-semibold text-[#1C1917] mb-1"
            >
              Ingest Any Substack URL or Newsletter Headline
            </label>
            <p className="text-xs text-[#57534E]">
              Paste a Substack article link (e.g.{' '}
              <span className="font-mono-tabular">https://adamtooze.substack.com</span>) or a
              specific Substack post headline to generate a full 6-Pillar Thunglish briefing.
            </p>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              id="substack-url-input"
              type="text"
              value={customSubstackInput}
              onChange={(e) => {
                setCustomSubstackInput(e.target.value);
                if (urlError) setUrlError(null);
              }}
              placeholder="e.g., https://www.semianalysis.com or Substack headline..."
              className="flex-1 px-3.5 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#9A3412]"
            />
            <button
              type="submit"
              disabled={isDecodingUrl}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FBF9F5] bg-[#9A3412] rounded-md hover:bg-[#7C2D12] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              <span>{isDecodingUrl ? 'Decoding Substack...' : 'Decode Substack Post'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {urlError && (
          <p role="alert" className="mt-3 text-xs font-medium text-[#DC2626]">
            {urlError}
          </p>
        )}
      </form>
    </section>
  );
};
