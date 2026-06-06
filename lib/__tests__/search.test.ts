import { describe, test, expect, vi, beforeEach } from 'vitest';
import { findRelevantFinance } from '@/lib/search';
import { prisma } from '@/prisma/prisma';

type NoteChunkResult = {
  id: string;
  noteId: string;
  chunkContent: string;
};

//  Mock prisma module
vi.mock('@/prisma/prisma', () => {
  return {
    prisma: {
      noteChunk: {
        findMany: vi.fn(),
      },
    },
  };
});

//cleanly overriding types for TypeScript
const mockedPrismaFindMany = vi.mocked(prisma.noteChunk.findMany);

describe('findRelevantFinance', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should successfully fetch and map raw Prisma data correctly', async () => {
    const fakeDbResults = [
      {
        id: 'chunk-1',
        noteId: 'note-1',
        chunkContent: 'Apple is hitting record high stock prices.',
      }
    ];

    // exactly what to return when called
    mockedPrismaFindMany.mockResolvedValue(fakeDbResults as NoteChunkResult[]);

    const output = await findRelevantFinance('Apple', 'user-123', 1, 'AAPL');

    expect(output).toEqual([
      {
        id: 'chunk-1',
        content: 'Apple is hitting record high stock prices.',
        metadata: { ticker: 'AAPL' },
        ticker: 'AAPL'
      }
    ]);

    // Verify Prisma was called with the correct parameters
    expect(mockedPrismaFindMany).toHaveBeenCalledWith({
      where: {
        note: {
          AND: [
            { userId: 'user-123' },
            { ticker: { symbol: 'AAPL' } }
          ]
        }
      },
      include: {
        note: {
          include: { ticker: true }
        }
      },
      take: 1
    });
  });

  test('should handle optional fields when ticker and userId are omitted', async () => {
    mockedPrismaFindMany.mockResolvedValue([]);

    // Call without optional items or limits
    await findRelevantFinance('Query without filters');

    expect(mockedPrismaFindMany).toHaveBeenCalledWith({
      where: {
        note: {
          AND: [{}, {}]
        }
      },
      include: {
        note: {
          include: { ticker: true }
        }
      },
      take: 3
    });
  });
});