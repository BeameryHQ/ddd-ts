/**
 * Notes:
 * - The three settings `clearMocks`, `resetMocks` and `resetModules` ensure full isolation between tests.
 *    This is important due to the way Jest mutates an internal global state when mocking.
 */
export default {
  transform: {
    '\\.ts$': 'ts-jest',
  },
  testEnvironment: 'node',
  automock: false,
  clearMocks: true,
  resetMocks: true,
  resetModules: true,
  restoreMocks: true,
  setupFilesAfterEnv: ['jest-extended/all'],
};
