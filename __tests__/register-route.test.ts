import { jest } from "@jest/globals";

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("creates a student account and returns the created role", async () => {
    // mock dependencies before importing route
    jest.doMock("@/features/tenant/service", () => ({ getOrCreateDefaultTenant: jest.fn().mockResolvedValue({ id: 'tenant-1' }) }));
    jest.doMock("@/features/auth/service", () => ({ registerUser: jest.fn().mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' }) }));
    jest.doMock("@/lib/auth/cookies", () => ({ setAuthCookies: jest.fn() }));
    jest.doMock("@/lib/auth/jwt", () => ({ verifyToken: jest.fn().mockReturnValue({ role: 'STUDENT' }) }));

    // Mock next/server NextResponse helper to avoid relying on Next internals in tests
    jest.doMock('next/server', () => ({
      NextResponse: {
        json: (body: any, init?: any) => ({ status: init?.status || 200, json: async () => body }),
      },
      NextRequest: global.Request,
    }));

    const { POST } = await import('@/app/api/auth/register/route');
    const authModule = await import('@/features/auth/service');
    const cookies = await import('@/lib/auth/cookies');

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ firstName: 'Ada', lastName: 'Eze', email: 'ada@example.com', password: 'Password1!', role: 'STUDENT' }),
    });

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.user).toEqual({ email: 'ada@example.com', role: 'STUDENT' });
    expect((authModule as any).registerUser).toHaveBeenCalledWith(expect.objectContaining({ role: 'STUDENT' }), 'tenant-1');
    expect((cookies as any).setAuthCookies).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ accessToken: 'access-token', refreshToken: 'refresh-token' }));
  });

  it("creates a tutor account and returns the created role", async () => {
    jest.doMock("@/features/tenant/service", () => ({ getOrCreateDefaultTenant: jest.fn().mockResolvedValue({ id: 'tenant-1' }) }));
    jest.doMock("@/features/auth/service", () => ({ registerUser: jest.fn().mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' }) }));
    jest.doMock("@/lib/auth/cookies", () => ({ setAuthCookies: jest.fn() }));
    jest.doMock("@/lib/auth/jwt", () => ({ verifyToken: jest.fn().mockReturnValue({ role: 'TUTOR' }) }));

    const { POST } = await import('@/app/api/auth/register/route');
    const authModule = await import('@/features/auth/service');

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ firstName: 'Kemi', lastName: 'Okafor', email: 'kemi@example.com', password: 'Password1!', role: 'TUTOR' }),
    });

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.user).toEqual({ email: 'kemi@example.com', role: 'TUTOR' });
    expect((authModule as any).registerUser).toHaveBeenCalledWith(expect.objectContaining({ role: 'TUTOR' }), 'tenant-1');
  });

  it("rejects unsupported self-signup roles", async () => {
    jest.doMock("@/features/tenant/service", () => ({ getOrCreateDefaultTenant: jest.fn().mockResolvedValue({ id: 'tenant-1' }) }));
    jest.doMock("@/lib/auth/jwt", () => ({ verifyToken: jest.fn().mockReturnValue({ role: 'STUDENT' }) }));

    const { POST } = await import('@/app/api/auth/register/route');

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ firstName: 'Chris', lastName: 'Admin', email: 'chris@example.com', password: 'Password1!', role: 'EMPLOYER' }),
    });

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid input');
  });
});
