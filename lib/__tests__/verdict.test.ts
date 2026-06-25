import { describe, test, expect } from 'vitest';
import { extractTicker, buildArguments, buildVerdictData } from '@/lib/analysis/verdict';
import type { ChatApiResponse, Source, ChatAnalystPoint } from '@/types';

describe('Chat API Data Transformers', () => {

  // tests: extractTicker()
  describe('extractTicker', () => {
    test('should extract the first uppercase alphanumeric ticker prefixed with a dollar sign', () => {
      expect(extractTicker('What is your position on $AAPL right now?')).toBe('AAPL');
      expect(extractTicker('Comparing $TSLA and $MSFT')).toBe('TSLA'); // First match priority
    });

    test('should fall back to NVDA when no dollar-prefixed ticker is present', () => {
      expect(extractTicker('Should I buy Apple stock today?')).toBe('NVDA');
      expect(extractTicker('Is $aapl valid?')).toBe('NVDA'); // Case-sensitive lowercase fallback
    });

    test('should respect the 1 to 5 alpha character ticker constraint boundary', () => {
      // $BRK matches (the "." satisfies the word boundary), so .A is ignored.
      expect(extractTicker('Check ticker $BRK.A or $INVALIDTICKER')).toBe('BRK');
      // A token longer than 5 chars with no valid ticker falls back to the default.
      expect(extractTicker('Check $INVALIDTICKER only')).toBe('NVDA');
      expect(extractTicker('Look at $AMD')).toBe('AMD');
    });
  });

  // tests: buildArguments()
  describe('buildArguments', () => {
    test('should slice the first 4 points and assign descending priority weights properly', () => {
      const mockPoints: ChatAnalystPoint[] = [
        { content: 'Strong revenue scaling acceleration.', tag: 'Growth', sourceIndex: 0 },
        { content: 'Solid margins expanding sequentially.', tag: 'Financials', sourceIndex: 1 },
        { content: 'Minor supply headwinds easing up.', tag: 'Macro', sourceIndex: 2 },
        { content: 'Decent valuation metrics comparison.', tag: 'Valuation', sourceIndex: 3 },
        { content: 'Extra overflow point that should be cut.', tag: 'Ignored', sourceIndex: 4 },
      ];

      const outcome = buildArguments({ points: mockPoints });

      expect(outcome).toHaveLength(4);

      // Verify descending array weight distribution mapping
      expect(outcome[0]).toEqual({
        point: 'Strong revenue scaling acceleration.',
        weight: 'strong',
        riskTag: 'Growth',
        sourceIndex: 0,
      });
      expect(outcome[1].weight).toBe('moderate');
      expect(outcome[2].weight).toBe('weak');
      expect(outcome[3].weight).toBe('weak');
    });

    test('should handle short arrays containing fewer than 4 items safely', () => {
      const shortPoints: ChatAnalystPoint[] = [
        { content: 'Only one point here.', tag: 'Isolation', sourceIndex: 0 },
      ];

      const outcome = buildArguments({ points: shortPoints });
      
      expect(outcome).toHaveLength(1);
      expect(outcome[0].weight).toBe('strong');
    });

    test('should return an empty array if the analyst point configuration list is empty', () => {
      expect(buildArguments({ points: [] })).toEqual([]);
    });
  });

  // tests: buildVerdictData()
  describe('buildVerdictData', () => {
    // Generate a reusable standard API payload baseline
    const mockApiResponse: ChatApiResponse = {
      decision: {
        verdict: 'BUY',
        confidence: 0.85,
        reasoning: 'AI infrastructure demand shows persistent tailwinds over the multi-year cycle.',
        keyRisks: ['Valuation Multiplexing', 'ChIP Supply Constraints'],
      },
      bull: {
        points: [{ content: 'High data center growth.', tag: 'Cloud', sourceIndex: 0 }],
      },
      bear: {
        points: [{ content: 'High concentration risk.', tag: 'Customer', sourceIndex: 0 }],
      },
    };

    const mockSources: Source[] = [
      {
        id: 'web-0',
        type: 'web',
        title: 'Tech Analysis',
        domain: 'tech.com',
        url: 'https://tech.com',
        snippet: 'Summary',
        date: '2026-06-01',
      },
    ];

    test('should assemble the full View Model when given a route parameter ticker overrides', () => {
      const result = buildVerdictData(
        'Analyze the upside potential.', 
        mockApiResponse, 
        mockSources, 
        'TSLA' // Explicit ticker override parameter
      );

      expect(result.ticker).toBe('TSLA');
      expect(result.verdict).toBe('BUY');
      expect(result.confidence).toBe(0.85);
      expect(result.summary).toContain('AI infrastructure demand');
      expect(result.bullArguments).toHaveLength(1);
      expect(result.bearArguments).toHaveLength(1);
      expect(result.riskTags).toEqual(['Valuation Multiplexing', 'ChIP Supply Constraints']);
      expect(result.sources).toEqual(mockSources);
    });

    test('should query extract the ticker string automatically when parameter is missing or null', () => {
      const result = buildVerdictData(
        'What is your outlook on $GOOG earnings results?', 
        mockApiResponse, 
        mockSources, 
        null // Trigger matching logic fallback
      );

      expect(result.ticker).toBe('GOOG');
    });

    test('should use the query regex fallback default if route params and inline tags are both absent', () => {
      const result = buildVerdictData(
        'General market trends overview query statement.', 
        mockApiResponse, 
        mockSources, 
        undefined
      );

      expect(result.ticker).toBe('NVDA'); // Base level match fallback configuration
    });
  });
});