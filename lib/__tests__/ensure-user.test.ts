import { describe, test, expect, vi, beforeEach } from 'vitest';
import { nameFromUser, ensureUserRecord } from '@/lib/auth/ensure-user';
import { prisma } from '@/prisma/prisma';

vi.mock('@/prisma/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockedPrismaUser = vi.mocked(prisma.user);

describe('User Sync Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Unit Tests: nameFromUser
  describe('nameFromUser', () => {
    test('should extract name from metadata using "name" key', () => {
      const user = { id: '123', user_metadata: { name: 'Nancy Kataria' } };
      expect(nameFromUser(user)).toBe('Nancy Kataria');
    });

    test('should fallback to "full_name" if "name" is missing', () => {
      const user = { id: '123', user_metadata: { full_name: 'Nancy Kataria' } };
      expect(nameFromUser(user)).toBe('Nancy Kataria');
    });

    test('should trim excess whitespace around strings', () => {
      const user = { id: '123', user_metadata: { name: '   Nancy Kataria   ' } };
      expect(nameFromUser(user)).toBe('Nancy Kataria');
    });

    test('should return null if user_metadata is null or missing keys', () => {
      const userWithNull = { id: '123', user_metadata: null };
      const userWithEmpty = { id: '123', user_metadata: {} };
      
      expect(nameFromUser(userWithNull)).toBeNull();
      expect(nameFromUser(userWithEmpty)).toBeNull();
    });

    test('should return null if the name value is a non-string type or just empty spaces', () => {
      const userWithNumber = { id: '123', user_metadata: { name: 42 } };
      const userWithSpaces = { id: '123', user_metadata: { name: '   ' } };

      expect(nameFromUser(userWithNumber)).toBeNull();
      expect(nameFromUser(userWithSpaces)).toBeNull();
    });
  });

  // Unit Tests: ensureUserRecord
  describe('ensureUserRecord', () => {
    const fakeSupabaseUser = {
      id: 'usr-999',
      email: 'nancy@example.com',
      user_metadata: { name: 'Nancy Kataria' },
    };

    test('should create a new database profile if the user does not exist', async () => {
      // Simulate user not found in DB
      mockedPrismaUser.findUnique.mockResolvedValue(null);

      await ensureUserRecord(fakeSupabaseUser);

      expect(mockedPrismaUser.findUnique).toHaveBeenCalledWith({ where: { id: 'usr-999' } });
      expect(mockedPrismaUser.create).toHaveBeenCalledWith({
        data: {
          id: 'usr-999',
          email: 'nancy@example.com',
          name: 'Nancy Kataria',
        },
      });
      // Assert it doesn't trigger an update
      expect(mockedPrismaUser.update).not.toHaveBeenCalled();
    });

    test('should fall back to an empty string if Supabase does not provide an email', async () => {
      mockedPrismaUser.findUnique.mockResolvedValue(null);
      const userWithoutEmail = { id: 'usr-888', user_metadata: null };

      await ensureUserRecord(userWithoutEmail);

      expect(mockedPrismaUser.create).toHaveBeenCalledWith({
        data: { id: 'usr-888', email: '', name: null },
      });
    });

    test('should backfill/update the name if the user exists but has a different or missing name', async () => {
      // Simulate user exists in DB but has an outdated name profile
      mockedPrismaUser.findUnique.mockResolvedValue({
        id: 'usr-999',
        email: 'nancy@example.com',
        name: 'Old Name',
      } as never);

      await ensureUserRecord(fakeSupabaseUser);

      expect(mockedPrismaUser.create).not.toHaveBeenCalled();
      expect(mockedPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 'usr-999' },
        data: { name: 'Nancy Kataria' },
      });
    });

    test('should take no action if the user exists and their name matches the metadata exactly', async () => {
      // Simulate user exists in DB and data matches perfectly
      mockedPrismaUser.findUnique.mockResolvedValue({
        id: 'usr-999',
        email: 'nancy@example.com',
        name: 'Nancy Kataria',
      } as never);

      await ensureUserRecord(fakeSupabaseUser);

      expect(mockedPrismaUser.create).not.toHaveBeenCalled();
      expect(mockedPrismaUser.update).not.toHaveBeenCalled();
    });

    test('should take no action if metadata has no name, even if database name is empty string', async () => {
      mockedPrismaUser.findUnique.mockResolvedValue({
        id: 'usr-999',
        email: 'nancy@example.com',
        name: '',
      } as never);

      const userWithNoName = { id: 'usr-999', email: 'nancy@example.com', user_metadata: null };

      await ensureUserRecord(userWithNoName);

      expect(mockedPrismaUser.update).not.toHaveBeenCalled();
    });
  });
});