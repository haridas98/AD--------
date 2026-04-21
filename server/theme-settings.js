import fs from 'fs';
import path from 'path';

export const THEME_TOKEN_KEYS = [
  'background',
  'surface',
  'surfaceElevated',
  'textPrimary',
  'textSecondary',
  'accent',
  'accentSoft',
  'border',
  'headerBackground',
  'footerBackground',
];

export const DEFAULT_THEME_SETTINGS = {
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

const DATA_DIR = path.resolve('data');
const THEME_SETTINGS_PATH = path.join(DATA_DIR, 'theme-settings.json');
const SAFE_THEME_VALUE = /^[#(),.%/\-\sa-zA-Z0-9]+$/;

function sanitizeThemeValue(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const next = value.trim();
  if (!next || next.length > 120) return fallback;
  if (!SAFE_THEME_VALUE.test(next)) return fallback;
  return next;
}

export function normalizeThemeSettings(input = {}) {
  const next = input || {};

  return {
    dark: Object.fromEntries(
      THEME_TOKEN_KEYS.map((key) => [key, sanitizeThemeValue(next?.dark?.[key], DEFAULT_THEME_SETTINGS.dark[key])]),
    ),
    light: Object.fromEntries(
      THEME_TOKEN_KEYS.map((key) => [key, sanitizeThemeValue(next?.light?.[key], DEFAULT_THEME_SETTINGS.light[key])]),
    ),
  };
}

export function assertThemeShape(input = {}) {
  const allowedModes = ['dark', 'light'];
  const modeKeys = Object.keys(input || {});

  for (const modeKey of modeKeys) {
    if (!allowedModes.includes(modeKey)) {
      throw new Error(`Unknown theme group: ${modeKey}`);
    }

    const tokenKeys = Object.keys(input[modeKey] || {});
    for (const tokenKey of tokenKeys) {
      if (!THEME_TOKEN_KEYS.includes(tokenKey)) {
        throw new Error(`Unknown theme token: ${tokenKey}`);
      }
    }
  }
}

export function readThemeSettings() {
  try {
    if (!fs.existsSync(THEME_SETTINGS_PATH)) return DEFAULT_THEME_SETTINGS;
    const raw = JSON.parse(fs.readFileSync(THEME_SETTINGS_PATH, 'utf8'));
    return normalizeThemeSettings(raw);
  } catch {
    return DEFAULT_THEME_SETTINGS;
  }
}

export function writeThemeSettings(input = {}) {
  const normalized = normalizeThemeSettings(input);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(THEME_SETTINGS_PATH, JSON.stringify(normalized, null, 2));
  return normalized;
}
