import type { CSSProperties } from 'react';
import type { ThemeMode, ThemeSettings, ThemeTokens } from '../types';

export const THEME_TOKEN_FIELDS: Array<{ key: keyof ThemeTokens; label: string; description: string }> = [
  { key: 'background', label: 'Background', description: 'Main page background' },
  { key: 'surface', label: 'Surface', description: 'Card and section surface' },
  { key: 'surfaceElevated', label: 'Surface Elevated', description: 'Raised panels and overlays' },
  { key: 'textPrimary', label: 'Text Primary', description: 'Main headings and body text' },
  { key: 'textSecondary', label: 'Text Secondary', description: 'Secondary copy and helper text' },
  { key: 'accent', label: 'Accent', description: 'Primary interactive accent' },
  { key: 'accentSoft', label: 'Accent Soft', description: 'Subtle accent surfaces' },
  { key: 'border', label: 'Border', description: 'Default outline and divider tone' },
  { key: 'headerBackground', label: 'Header Background', description: 'Top navigation background' },
  { key: 'footerBackground', label: 'Footer Background', description: 'Footer background' },
];

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  dark: {
    background: '#141414',
    surface: 'rgba(255, 255, 255, 0.04)',
    surfaceElevated: 'rgba(24, 24, 24, 0.96)',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.72)',
    accent: '#c6a47b',
    accentSoft: 'rgba(198, 164, 123, 0.16)',
    border: 'rgba(255, 255, 255, 0.08)',
    headerBackground: 'rgba(20, 20, 20, 0.92)',
    footerBackground: '#171717',
  },
  light: {
    background: '#f5f1eb',
    surface: 'rgba(255, 255, 255, 0.8)',
    surfaceElevated: 'rgba(255, 250, 243, 0.98)',
    textPrimary: '#201c18',
    textSecondary: 'rgba(32, 28, 24, 0.72)',
    accent: '#b07a48',
    accentSoft: 'rgba(176, 122, 72, 0.14)',
    border: 'rgba(50, 38, 27, 0.12)',
    headerBackground: 'rgba(245, 241, 235, 0.92)',
    footerBackground: '#efe7dd',
  },
};

export function normalizeThemeSettings(input?: Partial<ThemeSettings> | null): ThemeSettings {
  const next = input || {};

  return {
    dark: {
      ...DEFAULT_THEME_SETTINGS.dark,
      ...(next.dark || {}),
    },
    light: {
      ...DEFAULT_THEME_SETTINGS.light,
      ...(next.light || {}),
    },
  };
}

export function getThemeCssVariables(mode: ThemeMode, settings?: Partial<ThemeSettings> | null): CSSProperties {
  const tokens = normalizeThemeSettings(settings)[mode];

  return {
    '--theme-bg': tokens.background,
    '--theme-surface': tokens.surface,
    '--theme-surface-strong': tokens.surfaceElevated,
    '--theme-text-primary': tokens.textPrimary,
    '--theme-text-secondary': tokens.textSecondary,
    '--theme-text-muted': tokens.textSecondary,
    '--theme-accent': tokens.accent,
    '--theme-accent-soft': tokens.accentSoft,
    '--theme-border': tokens.border,
    '--theme-border-strong': tokens.border,
    '--theme-header-bg': tokens.headerBackground,
    '--theme-header-bg-strong': tokens.headerBackground,
    '--theme-footer-bg': tokens.footerBackground,
  } as CSSProperties;
}

export function getColorInputValue(value?: string): string {
  const nextValue = String(value || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(nextValue) || /^#[0-9a-fA-F]{3}$/.test(nextValue)) return nextValue;
  return '#000000';
}
