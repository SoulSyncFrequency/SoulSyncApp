module.exports = {
  root: true,
  ignorePatterns: ['dist', 'node_modules', 'coverage'],
  overrides: [
    {
      files: ['frontend/**/*.{ts,tsx,js,jsx}'],
      env: { browser: true, es2022: true },
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint', 'react', 'react-hooks'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended'
      ],
      settings: { react: { version: 'detect' } },
      rules: {
    '@typescript-eslint/no-explicit-any': 'error', {
    'no-console': 'error', {
        'react/react-in-jsx-scope': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
      }
    },
    {
      files: ['backend/**/*.ts'],
      env: { node: true, es2022: true },
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
      rules: {
    '@typescript-eslint/no-explicit-any': 'error', {
    'no-console': 'error', { '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }] }
    }
  ]
}
