import { describe, test, expect } from 'vitest';
import { 
  hostname, 
  buildWebSources, 
  buildInternalSources, 
  type ResearchStep, 
  type LocalChunk 
} from '@/lib/chat/sources';

describe('Research Sources Utilities', () => {

  // tests: hostname
  describe('hostname', () => {
    test('should extract clean hostname from a standard URL', () => {
      expect(hostname('https://www.alphavantage.co/query')).toBe('alphavantage.co');
      expect(hostname('https://news.google.com')).toBe('news.google.com');
    });

    test('should handle raw domains and trim "www."', () => {
      expect(hostname('http://www.apple.com/iphone')).toBe('apple.com');
    });

    test('should fallback to "web" gracefully if URL string parsing throws', () => {
      expect(hostname('not-a-valid-url')).toBe('web');
      expect(hostname('')).toBe('web');
    });
  });

  // tests: buildWebSources
  describe('buildWebSources', () => {
    test('should parse valid Tavily steps output structures and track auto-incrementing IDs', () => {
      const mockSteps: ResearchStep[] = [
        {
          toolResults: [
            {
              output: {
                results: [
                  {
                    title: 'Apple Financial Q2 Summary',
                    url: 'https://www.bloomberg.com/news/apple',
                    content: 'Apple posted record-breaking revenue figures for their latest financial quarter.',
                    publishedDate: '2026-06-05T14:30:00Z'
                  }
                ]
              }
            }
          ]
        },
        {
          toolResults: [
            {
              output: {
                results: [
                  {
                    // Missing title should fall back to using the URL
                    url: 'https://www.cnbc.com/markets',
                    content: 'Market indexes shift higher.',
                    publishedDate: '2026-06-24'
                  }
                ]
              }
            }
          ]
        }
      ];

      const outcome = buildWebSources(mockSteps);

      expect(outcome).toHaveLength(2);
      
      // Verify first source mapped structure
      expect(outcome[0]).toEqual({
        id: 'web-0',
        type: 'web',
        title: 'Apple Financial Q2 Summary',
        domain: 'bloomberg.com',
        url: 'https://www.bloomberg.com/news/apple',
        snippet: 'Apple posted record-breaking revenue figures for their latest financial quarter.',
        date: '2026-06-05' // Verifies substring slice(0, 10) logic works
      });

      // Verify backup fallback title and incremented identifier index
      expect(outcome[1].id).toBe('web-1');
      expect(outcome[1].title).toBe('https://www.cnbc.com/markets');
    });

    test('should skip empty outputs or mismatched JSON layouts without throwing errors', () => {
      const invalidSteps: ResearchStep[] = [
        { toolResults: [{ output: undefined }] },
        { toolResults: [{ output: 'just-a-plain-string' }] },
        { toolResults: [{ output: { missingResultsProperty: [] } }] },
        { toolResults: [{ output: { results: [ { missingUrlProperty: 'broken-object' } ] } }] }
      ];

      const outcome = buildWebSources(invalidSteps);
      expect(outcome).toEqual([]); // Safe extraction result fallback
    });

    test('should enforce string character caps on text snippet sizes', () => {
      const giantText = 'A'.repeat(500);
      const longStep: ResearchStep[] = [{
        toolResults: [{
          output: {
            results: [{ url: 'https://test.com', content: giantText }]
          }
        }]
      }];

      const outcome = buildWebSources(longStep);
      expect(outcome[0].snippet).toHaveLength(220); // SNIPPET_LEN boundary test
      expect(outcome[0].snippet).toBe('A'.repeat(220));
    });
  });

  // tests: buildInternalSources()
  describe('buildInternalSources', () => {
    test('should parse local note structures correctly and prioritize file tickers', () => {
      const mockChunks: LocalChunk[] = [
        { id: 'chunk-abc', content: 'My personal portfolio strategy details.', ticker: 'AAPL' },
        { id: '', content: 'Fallback item text content.', ticker: '' } // triggers fallbacks
      ];

      const outcome = buildInternalSources(mockChunks, 'TSLA');

      expect(outcome).toHaveLength(2);

      // Explicit case
      expect(outcome[0]).toEqual({
        id: 'chunk-abc',
        type: 'note',
        title: 'AAPL — from your library',
        domain: 'Your notes & documents',
        url: '',
        snippet: 'My personal portfolio strategy details.',
        date: ''
      });

      // Backup cases fallback check
      expect(outcome[1].id).toBe('note-1'); // index auto-creation fallback
      expect(outcome[1].title).toBe('TSLA — from your library'); // used activeTicker argument
    });

    test('should fallback to default copy string if ticker and activeTicker are both absent', () => {
      const chunkWithNoTicker: LocalChunk[] = [
        { id: 'chunk-xyz', content: 'Generic diary item.', ticker: '' }
      ];

      const outcome = buildInternalSources(chunkWithNoTicker, null);
      expect(outcome[0].title).toBe('YOUR — from your library');
    });

    test('should drop chunks that are missing content body arrays completely', () => {
      const mixedChunks: LocalChunk[] = [
        { id: '1', content: 'Valid chunk info', ticker: 'MSFT' },
        { id: '2', content: '', ticker: 'GOOG' } // empty content string should get filtered out
      ];

      const outcome = buildInternalSources(mixedChunks, null);
      expect(outcome).toHaveLength(1);
      expect(outcome[0].id).toBe('1');
    });
  });
});