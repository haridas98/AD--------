export default {
  plugins: {
    // PurgeCSS только в production сборке
    ...(process.env.NODE_ENV === 'production' ? {
      '@fullhuman/postcss-purgecss': {
        content: [
          './src/**/*.tsx',
          './src/**/*.ts',
          './index.html',
        ],
        defaultExtractor: (content) => {
          const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
          const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || [];
          return [...broadMatches, ...innerMatches];
        },
        // Не удалять admin стили и Quill
        safelist: {
          standard: [
            // Admin panel styles
            /^admin-/,
            /^ql-/,
            // Navigation classes
            'site-header',
            'header-inner',
            'desktop-nav',
            'nav-item-wrap',
            'nav-link',
            'submenu',
            'submenu-link',
            'submenu-group',
            'top-nav',
            'top-nav-close',
            'mobile-overlay',
            'menu-toggle',
            'brand',
            // Utility classes that might be dynamically applied
            'text-white',
            'text-secondary',
            'text-muted',
            'text-accent',
            // Animation classes
            'reveal',
            'fadeIn',
          ],
          // Keep all CSS variables
          deep: [/^--/],
          greedy: [
            /^admin-shell/,
            /^quill-wrapper/,
            /^ql-/,
            /^site-header/,
            /^desktop-nav/,
            /^nav-/,
            // Project content blocks use dynamic class names and CSS Modules.
            /^block-/,
            /^project-/,
            /^before-after/,
            // Keep Vite CSS Modules output like "._page_xxxxx_1"
            /^_/,
            // Dynamic variant class generated via template literal in ImageGridBlock
            /^block-image-grid/,
            /^block-image-grid--/,
            /^block-photo-sequence-row--/,
          ],
        },
        // CSS variables are used by JS
        variables: true,
      },
    } : {}),
  },
};
