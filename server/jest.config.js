module.exports = {
  clearMocks: true,
  moduleNameMapper: {
    '^@prisma/client$': '<rootDir>/test/prisma-client.mock.js',
  },
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.test.js'],
};
