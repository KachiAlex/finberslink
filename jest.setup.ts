import "@testing-library/jest-dom";
import { jest } from "@jest/globals";

// Provide crypto.randomUUID for components using it
if (!global.crypto) {
  // @ts-expect-error partial polyfill for tests
  global.crypto = {};
}
// @ts-expect-error partial polyfill for tests
global.crypto.randomUUID = () => "test-uuid";

// Mock next/navigation useRouter for client components in tests
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Provide basic matchMedia mock for components that may query it
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    media: query,
    matches: false,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Polyfill URL.createObjectURL for tests (used for immediate file preview)
Object.defineProperty(window.URL, "createObjectURL", {
  writable: true,
  value: jest.fn(() => "blob:mock-url"),
});
