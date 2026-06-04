import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findRelevantFinance } from './search';

vi.mock('@/prisma/prisma', () => ({
  prisma: {
    noteChunk: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/prisma/prisma';

describe('findRelevantFinance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return search results when given a valid query', async () => {
    const mockResults = [
      {
        id: '1',
        noteId: 'note-1',
        chunkContent: 'Tech stocks are rising',
        note: {
          id: 'note-1',
          content: 'Full content',
          userId: 'user-1',
          tickerId: 'ticker-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          ticker: { id: 'ticker-1', symbol: 'TECH', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() },
        },
      },
    ];
    vi.mocked(prisma.noteChunk.findMany).mockResolvedValue(mockResults);

    const results = await findRelevantFinance('stock market trends');
    expect(results).toHaveLength(1);
    expect(results[0].content).toBe('Tech stocks are rising');
  });

  it('should filter results by userId when provided', async () => {
    const mockResults = [
      {
        id: 'chunk-1',
        noteId: 'note-1',
        chunkContent: "User's investment notes",
        note: {
          id: 'note-1',
          content: 'Full content',
          userId: 'user-123',
          tickerId: 'ticker-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          ticker: { id: 'ticker-1', symbol: 'AAPL', userId: 'user-123', createdAt: new Date(), updatedAt: new Date() },
        },
      },
    ];
    vi.mocked(prisma.noteChunk.findMany).mockResolvedValue(mockResults);

    const results = await findRelevantFinance('portfolio', 'user-123');
    expect(results).toHaveLength(1);
    expect(prisma.noteChunk.findMany).toHaveBeenCalled();
  });

  it('should use custom limit parameter', async () => {
    const mockResults = Array(5).fill({
      id: 'chunk-1',
      noteId: 'note-1',
      chunkContent: 'test chunk',
      note: {
        id: 'note-1',
        content: 'Full content',
        userId: 'user-1',
        tickerId: 'ticker-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        ticker: { id: 'ticker-1', symbol: 'TEST', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() },
      },
    });
    vi.mocked(prisma.noteChunk.findMany).mockResolvedValue(mockResults);

    await findRelevantFinance('query', undefined, 5);
    expect(prisma.noteChunk.findMany).toHaveBeenCalled();
  });

  it('should handle empty results', async () => {
    vi.mocked(prisma.noteChunk.findMany).mockResolvedValue([]);

    const results = await findRelevantFinance('');
    expect(results).toEqual([]);
  });

  it('should return empty array when no chunks match', async () => {
    vi.mocked(prisma.noteChunk.findMany).mockResolvedValue([]);

    const results = await findRelevantFinance('some obscure query');
    expect(results).toHaveLength(0);
  });

  it('should filter by ticker when provided', async () => {
    const mockResults = [
      {
        id: 'chunk-1',
        noteId: 'note-1',
        chunkContent: 'NVDA analysis',
        note: {
          id: 'note-1',
          content: 'Full content',
          userId: 'user-1',
          tickerId: 'ticker-nvda',
          createdAt: new Date(),
          updatedAt: new Date(),
          ticker: { id: 'ticker-nvda', symbol: 'NVDA', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() },
        },
      },
    ];
    vi.mocked(prisma.noteChunk.findMany).mockResolvedValue(mockResults);

    const results = await findRelevantFinance('analysis', 'user-1', 3, 'NVDA');
    expect(results).toHaveLength(1);
    expect(results[0].ticker).toBe('NVDA');
  });
});
