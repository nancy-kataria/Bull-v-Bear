import { describe, test, expect, vi, beforeEach } from "vitest";
import {
  signInWithGoogle,
  signUpWithEmail,
  signInWithEmail,
  signOut,
} from "@/app/auth/actions";
import { prisma } from "@/prisma/prisma";

type AuthResponse<T> = {
  data: T | null;
  error: { message: string } | null;
};

type OAuthResponse = {
  url: string | null;
};

type SignUpData = {
  user: { id: string; email: string } | null;
};

type SignInData = {
  user: { id: string; email: string } | null;
};

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`Redirected to ${url}`);
  }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: vi.fn().mockReturnValue("http://localhost:3000"),
  })),
}));

vi.mock("@/prisma/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

const mockSupabaseClient = {
  auth: {
    signInWithOAuth: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
};
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockSupabaseClient),
}));

const mockedPrismaUser = vi.mocked(prisma.user);

describe("Authentication Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signInWithGoogle", () => {
    test("should redirect to Google OAuth URL on success", async () => {
      vi.mocked(mockSupabaseClient.auth.signInWithOAuth).mockResolvedValue({
        data: { url: "https://google.com/oauth" },
        error: null,
      } satisfies AuthResponse<OAuthResponse>);

      // Since redirect throws an error, assert that it throws our custom redirect string
      await expect(signInWithGoogle()).rejects.toThrow(
        "Redirected to https://google.com/oauth",
      );
    });

    test("should redirect to login page with error query param on failure", async () => {
      vi.mocked(mockSupabaseClient.auth.signInWithOAuth).mockResolvedValue({
        data: { url: null },
        error: { message: "OAuth failed" },
      } satisfies AuthResponse<OAuthResponse>);

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await expect(signInWithGoogle()).rejects.toThrow(
        "Redirected to /login?error=Could not authenticate with Google",
      );
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("signUpWithEmail", () => {
    test("should return error object if Supabase signUp fails", async () => {
      vi.mocked(mockSupabaseClient.auth.signUp).mockResolvedValue({
        data: { user: null },
        error: { message: "Weak password" },
      } satisfies AuthResponse<SignUpData>);

      const result = await signUpWithEmail("test@test.com", "password123");
      expect(result).toEqual({ success: false, error: "Weak password" });
    });

    test("should provision a new Prisma user if they do not exist yet", async () => {
      vi.mocked(mockSupabaseClient.auth.signUp).mockResolvedValue({
        data: { user: { id: "new-uid", email: "test@test.com" } },
        error: null,
      } satisfies AuthResponse<SignUpData>);

      // Simulate user not existing in Prisma yet
      vi.mocked(mockedPrismaUser.findUnique).mockResolvedValue(null as never);

      const result = await signUpWithEmail("test@test.com", "password123");

      expect(mockedPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { id: "new-uid" },
      });
      expect(mockedPrismaUser.create).toHaveBeenCalledWith({
        data: { id: "new-uid", email: "test@test.com" },
      });
      expect(result.success).toBe(true);
    });

    test("should skip Prisma creation if user already exists", async () => {
      vi.mocked(mockSupabaseClient.auth.signUp).mockResolvedValue({
        data: { user: { id: "existing-uid", email: "test@test.com" } },
        error: null,
      } satisfies AuthResponse<SignUpData>);

      // Simulate user already existing
      vi.mocked(mockedPrismaUser.findUnique).mockResolvedValue({
        id: "existing-uid",
        email: "test@test.com",
      } as never);

      await signUpWithEmail("test@test.com", "password123");

      expect(mockedPrismaUser.findUnique).toHaveBeenCalled();
      expect(mockedPrismaUser.create).not.toHaveBeenCalled();
    });
  });

  describe("signInWithEmail", () => {
    test("should return error state on wrong credentials", async () => {
      vi.mocked(mockSupabaseClient.auth.signInWithPassword).mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid credentials" },
      } satisfies AuthResponse<SignInData>);

      const result = await signInWithEmail("wrong@test.com", "badpass");
      expect(result).toEqual({ success: false, error: "Invalid credentials" });
    });

    test("should return success and sync user profile if credential login is correct", async () => {
      vi.mocked(mockSupabaseClient.auth.signInWithPassword).mockResolvedValue({
        data: { user: { id: "user-456", email: "right@test.com" } },
        error: null,
      } satisfies AuthResponse<SignInData>);
      vi.mocked(mockedPrismaUser.findUnique).mockResolvedValue(null);

      const result = await signInWithEmail("right@test.com", "goodpass");

      expect(mockedPrismaUser.create).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe("signOut", () => {
    test("should sign out from Supabase session and redirect to root directory", async () => {
      await expect(signOut()).rejects.toThrow("Redirected to /");
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });
  });
});
