import React from 'react';

interface TopBarProps {
  onNavigate: (sectionId: string) => void;
  onOpenSynthesizer: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onNavigate, onOpenSynthesizer }) => {
  return (
    <header
      className="nexus-theme-header sticky top-0 z-30 flex items-center justify-between gap-3 sm:gap-8 px-4 sm:px-6 lg:px-12 py-3.5 sm:py-4 backdrop-blur-xl border-b transition-colors"
      style={{
        backgroundColor: 'var(--nexus-header-bg)',
        borderColor: 'var(--nexus-border)',
      }}
    >
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#top"
        onClick={(e) => {
          e.preventDefault();
          onNavigate('top');
        }}
        className="text-sm sm:text-xl font-display font-bold tracking-tight truncate max-w-[200px] sm:max-w-none transition-colors"
        style={{ color: 'var(--nexus-text-primary)' }}
      >
        NEXUS-7 // Global Pattern Intelligence
      </a>

      {/* Zone 2: 5 concise single-line text navigation links */}
      <nav
        aria-label="Primary Briefing Navigation"
        className="hidden md:flex items-center gap-7 text-sm font-medium"
        style={{ color: 'var(--nexus-text-secondary)' }}
      >
        <a
          href="#obsidian-bento-matrix"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('obsidian-bento-matrix');
          }}
          className="hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Bento Matrix
        </a>
        <a
          href="#nexus7-terminal"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('nexus7-terminal');
          }}
          className="hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          NEXUS-7 Terminal
        </a>
        <a
          href="#spatial-observatory"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('spatial-observatory');
          }}
          className="hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          3D Observatory
        </a>
        <a
          href="#dot-matrix"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('dot-matrix');
          }}
          className="hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Dot-Connecting Web
        </a>
        <a
          href="#bioscience-workbench"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('bioscience-workbench');
          }}
          className="hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Bioscience Lab
        </a>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onOpenSynthesizer}
          style={{
            backgroundColor: 'var(--nexus-accent)',
            color: 'var(--nexus-accent-contrast)',
          }}
          className="px-4 py-2 text-xs font-mono-tabular uppercase font-semibold rounded-lg hover:brightness-110 transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          Synthesize Signal
        </button>
      </div>
    </header>
  );
};
