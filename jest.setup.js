console.log('Jest setup starting...');
import '@testing-library/jest-dom';

// Polyfill for encoding APIs
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Global fetch is mocked at the bottom of this file.
// Individual tests can override it per-suite if needed.

// Minimal Request shim to keep Next.js server imports from crashing in skipped suites
if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = class {};
}

// Mock environment variables for Supabase ONLY if not already set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // Use server-side env var name (SUPABASE_SERVICE_ROLE_KEY, not NEXT_PUBLIC_)
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
}

// Mock Supabase client methods to prevent database calls in tests
jest.mock('@/lib/supabase-browser', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

// Fix for Console Ninja instrumentation in tests
// The instrumentation adds calls to a global function `oo_oo` which might be missing or broken in the test environment.
// We define it here to prevent crashes.
if (typeof global.oo_oo === 'undefined') {
  global.oo_oo = function () {
    return [];
  };
}
if (typeof global.oo_tx === 'undefined') {
  global.oo_tx = function () {
    return [];
  };
}

// Mock console to avoid issues with instrumentation
// global.console.log = (...args) => {};
// global.console.error = (...args) => {};
// global.console.warn = (...args) => {};
// global.console.info = (...args) => {};
// global.console.debug = (...args) => {};

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock next/server to avoid requiring global Response/Request in skipped route tests
jest.mock('next/server', () => {
  return {
    NextRequest: class {
      constructor(url, init) {
        this.url = url;
        this.method = init?.method || 'GET';
        this.body = init?.body;
        this.headers = new Headers(init?.headers);
        this.nextUrl = new URL(url);
      }
      async json() {
        return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
      }
    },
    NextResponse: {
      json: (data, init) => {
        return {
          ok: true,
          status: init?.status || 200,
          json: async () => data,
          headers: new Headers(init?.headers),
        };
      },
    },
  };
});

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    })),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  })),
}));

// Mock window.matchMedia
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock fetch API for Jest tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ data: [], error: null }),
    text: () => Promise.resolve(''),
    headers: new Headers(),
    redirected: false,
    statusText: 'OK',
    type: 'basic',
    url: '',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
  })
);

// Global test utilities
global.testUtils = {
  // Helper to create mock user data
  createMockUser: (overrides = {}) => ({
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isAdmin: false,
    isTeacher: false,
    isStudent: true,
    isActive: true,
    canEdit: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  // Helper to create mock song data
  createMockSong: (overrides = {}) => ({
    id: '1',
    title: 'Test Song',
    author: 'Test Artist',
    level: 'beginner',
    key: 'C',
    chords: 'C G Am F',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  // Helper to create mock lesson data
  createMockLesson: (overrides = {}) => ({
    id: '1',
    student_id: '1',
    teacher_id: '2',
    date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    status: 'SCHEDULED',
    title: 'Test Lesson',
    notes: 'Test notes',
    lesson_number: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),
};

// Polyfill for mysterious instrumentation (Console Ninja / OpenObserve?) causing ReferenceErrors
// These functions are injected into the code during test execution but not defined in the global scope
global.oo_tx = (id, ...args) => args;
global.oo_oo = (id, ...args) => args;

console.log('Jest setup finished.');
