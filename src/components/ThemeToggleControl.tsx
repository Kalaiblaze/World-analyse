import React from 'react';
import { Moon, Terminal } from 'lucide-react';
import { type ThemeMode, THEME_SPECS } from '../utils/themeEngine';

interface ThemeToggleControlProps {
  themeMode: ThemeMode;
  onToggleTheme: (nextMode?: ThemeMode) => void;
}

export const ThemeToggleControl: React.FC<ThemeToggleControlProps> = ({
  themeMode,
  onToggleTheme,
}) => {
  const isTerminalGreen = themeMode === 'terminal-green';
  const activeSpec = THEME_SPECS[themeMode];

  return (
    <div
      role="group"
      aria-label="Global High-Contrast Theme Switcher"
      className="inline-flex items-center p-0.5 rounded-lg border transition-all"
      style={{
        backgroundColor: 'var(--nexus-surface-recessed)',
        borderColor: 'var(--nexus-border)',
      }}
    >
      <button
        type="button"
        data-testid="theme-btn-obsidian-night"
        aria-pressed={!isTerminalGreen}
        onClick={() => onToggleTheme('obsidian-night')}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono-tabular uppercase transition-all cursor-pointer ${
          !isTerminalGreen ? 'font-semibold' : 'opacity-70 hover:opacity-100'
        }`}
        style={
          !isTerminalGreen
            ? {
                backgroundColor: 'var(--nexus-accent-soft)',
                color: 'var(--nexus-accent)',
                border: '1px solid var(--nexus-border-strong)',
              }
            : {
                color: 'var(--nexus-text-muted)',
                border: '1px solid transparent',
              }
        }
        title={THEME_SPECS['obsidian-night'].description}
      >
        <Moon className="w-3.5 h-3.5" />
        <span>Obsidian Night</span>
      </button>

      <button
        type="button"
        data-testid="theme-btn-terminal-green"
        aria-pressed={isTerminalGreen}
        onClick={() => onToggleTheme('terminal-green')}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono-tabular uppercase transition-all cursor-pointer ${
          isTerminalGreen ? 'font-semibold' : 'opacity-70 hover:opacity-100'
        }`}
        style={
          isTerminalGreen
            ? {
                backgroundColor: 'var(--nexus-accent-soft)',
                color: 'var(--nexus-accent)',
                border: '1px solid var(--nexus-border-strong)',
              }
            : {
                color: 'var(--nexus-text-muted)',
                border: '1px solid transparent',
              }
        }
        title={THEME_SPECS['terminal-green'].description}
      >
        <Terminal className="w-3.5 h-3.5" />
        <span>Terminal Green</span>
      </button>

      <span className="sr-only">Active theme: {activeSpec.label}</span>
    </div>
  );
};
