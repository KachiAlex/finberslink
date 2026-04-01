import { jest } from "@jest/globals";
import { NextRequest } from "next/server";

import { POST } from "@/app/api/auth/register/route";
import { registerUser } from "@/features/auth/service";
import { getOrCreateDefaultTenant } from "@/features/tenant/service";
import { setAuthCookies } from "@/lib/auth/cookies";
import { verifyToken } from "@/lib/auth/jwt";

jest.mock("@/features/auth/service", () => ({
  registerUser: jest.fn(),
}));

jest.mock("@/features/tenant/service", () => ({
  getOrCreateDefaultTenant: jest.fn(),
}));

jest.mock("@/lib/auth/cookies", () => ({
  setAuthCookies: jest.fn(),
}));

jest.mock("@/lib/auth/jwt", () => ({
  verifyToken: jest.fn(),
}));

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getOrCreateDefaultTenant as jest.Mock).mockResolvedValue({ id: "tenant-1" });
    (registerUser as jest.Mock).mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
  });

  it("creates a student account and returns the created role", async () => {
    (verifyToken as jest.Mock).mockReturnValue({ role: "STUDENT" });

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        firstName: "Ada",
        lastName: "Eze",
        email: "ada@example.com",
        password: "Password1!",
        role: "STUDENT",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.user).toEqual({ email: "ada@example.com", role: "STUDENT" });
    expect(registerUser).toHaveBeenCalledWith(
      expect.objectContaining({ role: "STUDENT" }),
      "tenant-1"
    );
    expect(setAuthCookies).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ accessToken: "access-token", refreshToken: "refresh-token" })
    );
  });

  it("creates a tutor account and returns the created role", async () => {
    (verifyToken as jest.Mock).mockReturnValue({ role: "TUTOR" });

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        firstName: "Kemi",
        lastName: "Okafor",
        email: "kemi@example.com",
        password: "Password1!",
        role: "TUTOR",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.user).toEqual({ email: "kemi@example.com", role: "TUTOR" });
    expect(registerUser).toHaveBeenCalledWith(
      expect.objectContaining({ role: "TUTOR" }),
      "tenant-1"
    );
  });

  it("rejects unsupported self-signup roles", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        firstName: "Chris",
        lastName: "Admin",
        email: "chris@example.com",
        password: "Password1!",
        role: "EMPLOYER",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid input");
    expect(registerUser).not.toHaveBeenCalled();
  });
});