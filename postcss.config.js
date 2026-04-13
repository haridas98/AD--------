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
          greedy: [/^admin-shell/, /^quill-wrapper/, /^ql-/],
        },
        // CSS variables are used by JS
        variables: true,
      },
    } : {}),
  },
};
