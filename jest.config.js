const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // Ignore other test frameworks and e2e tests that are run separately
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/tests/", "<rootDir>/src/features/chat/__tests__/", "<rootDir>/__tests__/tutor-course-builder.test.tsx"],
};

module.exports = createJestConfig(customJestConfig);
