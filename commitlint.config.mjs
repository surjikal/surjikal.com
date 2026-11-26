export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'subject-has-textemoji': ({ subject }) => {
          const hasTextEmoji = [...(subject ?? '')].some((ch) => {
            const codePoint = ch.codePointAt(0)
            return codePoint !== undefined && codePoint > 127
          })
          return [
            hasTextEmoji,
            'subject must include a textemoji/kaomoji (e.g. feat: (⌐■_■) short fun message)',
          ]
        },
      },
    },
  ],
  rules: {
    'header-max-length': [2, 'always', 72],
    'subject-has-textemoji': [2, 'always'],
  },
}
