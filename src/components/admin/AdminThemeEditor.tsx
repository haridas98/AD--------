import React from 'react';
import { DEFAULT_THEME_SETTINGS, getColorInputValue, normalizeThemeSettings, THEME_TOKEN_FIELDS } from '../../lib/themeTokens';
import type { ThemeMode, ThemeSettings, ThemeTokens } from '../../types';
import styles from './AdminThemeEditor.module.scss';

interface AdminThemeEditorProps {
  value?: ThemeSettings;
  saving?: boolean;
  onChange: (next: ThemeSettings) => void;
  onSave: () => void;
}

const MODE_LABELS: Record<ThemeMode, string> = {
  dark: 'Dark Theme',
  light: 'Light Theme',
};

function buildPreview(mode: ThemeMode, tokens: ThemeTokens) {
  const opposite = mode === 'dark' ? DEFAULT_THEME_SETTINGS.light : DEFAULT_THEME_SETTINGS.dark;
  const textColor = tokens.textPrimary;

  return [
    {
      key: 'page',
      label: 'Page',
      style: { background: tokens.background, color: textColor, borderColor: tokens.border },
      text: 'Background',
    },
    {
      key: 'surface',
      label: 'Surface',
      style: { background: tokens.surface, color: textColor, borderColor: tokens.border },
      text: 'Section / card',
    },
    {
      key: 'button',
      label: 'Accent',
      style: { background: tokens.surfaceElevated, color: textColor, borderColor: tokens.border },
      text: 'Primary action',
      buttonStyle: { background: tokens.accent, color: opposite.background },
    },
    {
      key: 'text',
      label: 'Text',
      style: { background: tokens.footerBackground, color: textColor, borderColor: tokens.border },
      text: 'Primary and secondary copy',
      secondaryColor: tokens.textSecondary,
    },
  ];
}

export default function AdminThemeEditor({ value, saving = false, onChange, onSave }: AdminThemeEditorProps) {
  const themeSettings = normalizeThemeSettings(value);

  const updateToken = (mode: ThemeMode, key: keyof ThemeTokens, nextValue: string) => {
    onChange({
      ...themeSettings,
      [mode]: {
        ...themeSettings[mode],
        [key]: nextValue,
      },
    });
  };

  return (
    <section className={styles.wrap}>
      <div className={styles.topBar}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>Themes</h2>
          <p className={styles.description}>
            Edit base palettes for the public site. This phase controls the global dark and light themes. Project presets and per-project styles will be added later on top of this foundation.
          </p>
        </div>
        <button type="button" className="btn-primary" disabled={saving} onClick={onSave}>
          {saving ? 'Saving...' : 'Save Themes'}
        </button>
      </div>

      <div className={styles.grid}>
        {(['dark', 'light'] as ThemeMode[]).map((mode) => {
          const tokens = themeSettings[mode];
          const previews = buildPreview(mode, tokens);

          return (
            <div key={mode} className={styles.panel}>
              <div className={styles.panelHead}>
                <h3 className={styles.panelTitle}>{MODE_LABELS[mode]}</h3>
                <p className={styles.panelNote}>Base palette used by the public site when this mode is active.</p>
              </div>

              <div className={styles.previewRow}>
                {previews.map((preview) => (
                  <div key={preview.key} className={styles.previewCard} style={preview.style}>
                    <div className={styles.previewLabel}>{preview.label}</div>
                    <div className={styles.previewText}>
                      <div>{preview.text}</div>
                      {preview.buttonStyle ? (
                        <button type="button" className={styles.previewButton} style={preview.buttonStyle}>
                          Accent
                        </button>
                      ) : null}
                      {preview.secondaryColor ? (
                        <div style={{ color: preview.secondaryColor, marginTop: '6px' }}>Secondary copy</div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.fields}>
                {THEME_TOKEN_FIELDS.map((field) => (
                  <div key={field.key} className={styles.field}>
                    <div className={styles.fieldInfo}>
                      <div className={styles.fieldLabel}>{field.label}</div>
                      <div className={styles.fieldDescription}>{field.description}</div>
                    </div>
                    <input
                      className={styles.colorInput}
                      type="color"
                      value={getColorInputValue(tokens[field.key])}
                      onChange={(event) => updateToken(mode, field.key, event.target.value)}
                      aria-label={`${MODE_LABELS[mode]} ${field.label}`}
                    />
                    <input
                      className={styles.textInput}
                      value={tokens[field.key]}
                      onChange={(event) => updateToken(mode, field.key, event.target.value)}
                      spellCheck={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.future}>
        <h3 className={styles.futureTitle}>Project Presets</h3>
        <p className={styles.futureText}>
          Next step here will be project-specific presets like kids/interiors/editorial variants. This slot is intentionally reserved so the owner sees where those themes will live later.
        </p>
      </div>
    </section>
  );
}
