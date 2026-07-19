import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-expo',
  coverageDirectory: './__tests__/coverage',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@react-native-async-storage/)'
  ],

  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/utils/',
    '/__tests__/coverage/',
  ],

  collectCoverageFrom: [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/*.test.ts',
    '!src/**/*.test.tsx',
    '!src/**/*.styles.ts',
    '!src/types/**',
    '!src/**/index.ts',
    '!src/components/**',
    '!src/app/**',
    '!**/* copy.tsx',
  ],

  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/utils/',
    '/__tests__/coverage/',
    '/__mocks__/',
  ],

  coverageReporters: [
    'json',
    'lcov',
    'html',
    'text-summary',
  ],

  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};

export default config;
