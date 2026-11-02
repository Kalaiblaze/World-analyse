export type ThemeMode = 'obsidian-night' | 'terminal-green';

export interface ThemeSpec {
  id: ThemeMode;
  label: string;
  shortLabel: string;
  description: string;
  cssVariables: Record<string, string>;
}

export const THEME_SPECS: Record<ThemeMode, ThemeSpec> = {
  'obsidian-night': {
    id: 'obsidian-night',
    label: 'Obsidian Night',
    shortLabel: 'OBSIDIAN NIGHT',
    description: 'Linear / Raycast Deep Space Obsidian (#07090E) with Sky Cyan & Violet mesh glow',
    cssVariables: {
      '--nexus-bg': '#07090E',
      '--nexus-bg-gradient':
        'radial-gradient(circle at 16% 12%, rgba(56, 189, 248, 0.08), transparent 45%), radial-gradient(circle at 84% 22%, rgba(139, 92, 246, 0.07), transparent 48%), radial-gradient(circle at 50% 85%, rgba(16, 185, 129, 0.05), transparent 50%)',
      '--nexus-header-bg': 'rgba(7, 9, 14, 0.88)',
      '--nexus-surface': 'rgba(255, 255, 255, 0.03)',
      '--nexus-surface-elevated': 'rgba(255, 255, 255, 0.055)',
      '--nexus-surface-recessed': 'rgba(0, 0, 0, 0.42)',
      '--nexus-card-solid-bg': '#FBF9F5',
      '--nexus-card-solid-recessed': '#F3EFE6',
      '--nexus-card-solid-text': '#1C1917',
      '--nexus-card-solid-border': '#292524',
      '--nexus-border': 'rgba(255, 255, 255, 0.08)',
      '--nexus-border-strong': 'rgba(56, 189, 248, 0.42)',
      '--nexus-text-primary': '#F8FAFC',
      '--nexus-text-secondary': '#CBD5E1',
      '--nexus-text-muted': '#94A3B8',
      '--nexus-accent': '#38BDF8',
      '--nexus-accent-secondary': '#8B5CF6',
      '--nexus-accent-contrast': '#020617',
      '--nexus-accent-soft': 'rgba(56, 189, 248, 0.14)',
      '--nexus-glow': '0 0 28px -6px rgba(56, 189, 248, 0.32)',
      '--nexus-scanline-opacity': '0',
    },
  },
  'terminal-green': {
    id: 'terminal-green',
    label: 'Terminal Green',
    shortLabel: 'TERMINAL GREEN',
    description: 'High-Contrast Phosphor Command Matrix (#020A04) with CRT Vector Green (#00FF66)',
    cssVariables: {
      '--nexus-bg': '#020A04',
      '--nexus-bg-gradient':
        'radial-gradient(circle at 18% 14%, rgba(0, 255, 102, 0.14), transparent 46%), radial-gradient(circle at 82% 24%, rgba(16, 185, 129, 0.12), transparent 50%), radial-gradient(circle at 50% 85%, rgba(0, 255, 102, 0.08), transparent 55%)',
      '--nexus-header-bg': 'rgba(2, 10, 4, 0.94)',
      '--nexus-surface': 'rgba(0, 255, 102, 0.055)',
      '--nexus-surface-elevated': 'rgba(0, 255, 102, 0.11)',
      '--nexus-surface-recessed': 'rgba(1, 6, 2, 0.78)',
      '--nexus-card-solid-bg': '#041409',
      '--nexus-card-solid-recessed': '#020B05',
      '--nexus-card-solid-text': '#E2FFE9',
      '--nexus-card-solid-border': '#00FF66',
      '--nexus-border': 'rgba(0, 255, 102, 0.34)',
      '--nexus-border-strong': '#00FF66',
      '--nexus-text-primary': '#E2FFE9',
      '--nexus-text-secondary': '#86EFAC',
      '--nexus-text-muted': '#4ADE80',
      '--nexus-accent': '#00FF66',
      '--nexus-accent-secondary': '#10B981',
      '--nexus-accent-contrast': '#010803',
      '--nexus-accent-soft': 'rgba(0, 255, 102, 0.2)',
      '--nexus-glow': '0 0 32px -4px rgba(0, 255, 102, 0.5)',
      '--nexus-scanline-opacity': '0.18',
    },
  },
};

export const THEME_STORAGE_KEY = 'nexus7_global_theme_mode';

export function getThemeCssVariables(mode: ThemeMode): Record<string, string> {
  return THEME_SPECS[mode]?.cssVariables ?? THEME_SPECS['obsidian-night'].cssVariables;
}

export function getNextThemeMode(current: ThemeMode): ThemeMode {
  return current === 'obsidian-night' ? 'terminal-green' : 'obsidian-night';
}

export function applyThemeToRoot(mode: ThemeMode, rootElement?: HTMLElement | null): void {
  const target =
    rootElement ?? (typeof document !== 'undefined' ? document.documentElement : null);
  if (!target) return;

  const spec = THEME_SPECS[mode] ?? THEME_SPECS['obsidian-night'];
  target.setAttribute('data-theme', spec.id);

  for (const [propName, propValue] of Object.entries(spec.cssVariables)) {
    target.style.setProperty(propName, propValue);
  }
}
