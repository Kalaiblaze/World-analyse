import React from 'react';

interface TopBarProps {
  onNavigate: (sectionId: string) => void;
  onOpenSynthesizer: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onNavigate, onOpenSynthesizer }) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 lg:px-12 py-4 bg-[#FBF9F5]/95 backdrop-blur-sm border-b border-[#D6CEBE]">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#top"
        onClick={(e) => {
          e.preventDefault();
          onNavigate('top');
        }}
        className="text-xl font-editorial font-bold tracking-tight text-[#1C1917] whitespace-nowrap shrink-0"
      >
        NEXUS-7 // VetriCheck
      </a>

      {/* Zone 2: 5 concise single-line text navigation links */}
      <nav
        aria-label="Primary Briefing Navigation"
        className="hidden md:flex items-center gap-7 text-sm font-medium text-[#57534E]"
      >
        <a
          href="#nexus7-terminal"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('nexus7-terminal');
          }}
          className="hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          NEXUS-7 Terminal
        </a>
        <a
          href="#executive-summary"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('executive-summary');
          }}
          className="hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Executive Briefing
        </a>
        <a
          href="#pillar-breakdown"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('pillar-breakdown');
          }}
          className="hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Six Pillars
        </a>
        <a
          href="#dot-matrix"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('dot-matrix');
          }}
          className="hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Dot-Connecting Web
        </a>
        <a
          href="#bioscience-workbench"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('bioscience-workbench');
          }}
          className="hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Bioscience Lab
        </a>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onOpenSynthesizer}
          className="px-4 py-2 text-xs font-semibold text-[#FBF9F5] bg-[#1C1917] rounded-md hover:bg-[#9A3412] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Synthesize Signal
        </button>
      </div>
    </header>
  );
};
