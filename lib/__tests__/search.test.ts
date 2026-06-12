import { describe, test, expect, vi, beforeEach } from 'vitest';
import { findRelevantFinance } from '@/lib/search';
import { prisma } from '@/prisma/prisma';
import { embed } from 'ai';

// Mock prisma module — search now runs a raw pgvector query.
vi.mock('@/prisma/prisma', () => {
  return {
    prisma: {
      $queryRaw: vi.fn(),
    },
  };
});

// Mock the embedding model + the `embed` helper so no network call is made.
vi.mock('@ai-sdk/openai', () => ({
  openai: { embedding: vi.fn(() => 'mock-embedding-model') },
}));

vi.mock('ai', () => ({
  embed: vi.fn(),
}));

const mockedQueryRaw = vi.mocked(prisma.$queryRaw);
const mockedEmbed = vi.mocked(embed);

describe('findRelevantFinance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedEmbed.mockResolvedValue({ embedding: [0.1, 0.2, 0.3] } as never);
  });

  test('embeds the query and maps raw rows into the result shape', async () => {
    mockedQueryRaw.mockResolvedValue([
      {
        id: 'chunk-1',
        chunkContent: 'Apple is hitting record high stock prices.',
        symbol: 'AAPL',
      },
    ] as never);

    const output = await findRelevantFinance('Apple', 'user-123', 1, 'AAPL');

    expect(mockedEmbed).toHaveBeenCalledTimes(1);
    expect(mockedQueryRaw).toHaveBeenCalledTimes(1);
    expect(output).toEqual([
      {
        id: 'chunk-1',
        content: 'Apple is hitting record high stock prices.',
        metadata: { ticker: 'AAPL' },
        ticker: 'AAPL',
      },
    ]);
  });

  test('handles optional fields when ticker and userId are omitted', async () => {
    mockedQueryRaw.mockResolvedValue([] as never);

    const output = await findRelevantFinance('Query without filters');

    expect(mockedEmbed).toHaveBeenCalledTimes(1);
    expect(mockedQueryRaw).toHaveBeenCalledTimes(1);
    expect(output).toEqual([]);
  });
});
