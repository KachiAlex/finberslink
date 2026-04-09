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

// Minimal Request polyfill for Next.js server/NextRequest usage in tests
if (typeof global.Request === 'undefined') {
  // @ts-expect-error minimal definition for tests
  global.Request = class Request {
    url: any;
    method: any;
    headers: any;
    body: any;
    constructor(input: any, init?: any) {
      this.url = input?.url || input;
      this.method = init?.method || 'GET';
      // Provide a minimal Headers-like object with a get() method used by Next.js server
      this.headers = init?.headers || {
        get: (_: string) => undefined,
        entries: () => [],
        forEach: () => {},
      };
      this.body = init?.body;
    }
    async json() {
      try {
        return JSON.parse(this.body);
      } catch {
        return null;
      }
    }
    text() {
      return this.body;
    }
  };
}

// Minimal Response polyfill used by Next.js server helpers in tests
if (typeof global.Response === 'undefined') {
  // @ts-expect-error minimal definition for tests
  global.Response = class Response {
    body: any;
    status: number;
    headers: any;
    constructor(body: any = null, init: any = {}) {
      this.body = body;
      this.status = init.status ?? 200;
      this.headers = init.headers ?? {};
    }
    async json() {
      try {
        if (typeof this.body === 'string') return JSON.parse(this.body);
        return this.body;
      } catch {
        return null;
      }
    }
    text() {
      if (typeof this.body === 'string') return this.body;
      try {
        return JSON.stringify(this.body);
      } catch {
        return String(this.body);
      }
    }
  };
}

// TextEncoder polyfill for Node environments where it's missing (used by pg crypto)
if (typeof (global as any).TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TextEncoder } = require('util');
  global.TextEncoder = TextEncoder;
}
