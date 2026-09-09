module.exports = {
  clearMocks: true,
  transform: { '^.+\\.ts$': '<rootDir>/test/typescript-transformer.js' },
  moduleNameMapper: {
    '^@prisma/client$': '<rootDir>/test/prisma-client.mock.js',
  },
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.test.js'],
};
