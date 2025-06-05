module.exports = {
  plugins: [
    ...(process.env.NODE_ENV === 'production'
      ? [
          require('@fullhuman/postcss-purgecss')({
            content: [
              './src/**/*.js',
              './src/**/*.jsx',
              './src/**/*.ts',
              './src/**/*.tsx',
              './public/index.html',
            ],
            defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
          }),
        ]
      : []),
  ],
};