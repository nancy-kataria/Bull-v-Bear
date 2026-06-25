import { describe, test, expect, vi, beforeEach } from 'vitest';
import { resolveMimeType, extractDocumentText, PDF_MIME, DOCX_MIME } from '@/lib/documents/extract';
import { extractText, getDocumentProxy, renderPageAsImage } from 'unpdf';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';

vi.mock('unpdf', () => ({
  getDocumentProxy: vi.fn(),
  extractText: vi.fn(),
  renderPageAsImage: vi.fn(),
}));

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

const mockTesseractWorker = {
  recognize: vi.fn(),
  terminate: vi.fn(),
};

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(async () => mockTesseractWorker),
}));

describe('Document Processing Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Unit Tests: resolveMimeType
  describe('resolveMimeType', () => {
    test('should return provided type if it is allowed', () => {
      expect(resolveMimeType('file.txt', PDF_MIME)).toBe(PDF_MIME);
    });

    test('should infer PDF mime type from file extension if no valid type is provided', () => {
      expect(resolveMimeType('REPORT.PDF')).toBe(PDF_MIME);
      expect(resolveMimeType('document.pdf', 'invalid/type')).toBe(PDF_MIME);
    });

    test('should infer DOCX mime type from file extension', () => {
      expect(resolveMimeType('resume.docx')).toBe(DOCX_MIME);
    });

    test('should return null for unsupported configurations', () => {
      expect(resolveMimeType('image.png')).toBeNull();
    });
  });

  // Unit Tests: extractDocumentText
  describe('extractDocumentText', () => {
    const fakeBuffer = Buffer.from('fake-file-content');

    test('should parse a DOCX file successfully using mammoth', async () => {
      vi.mocked(mammoth.extractRawText).mockResolvedValue({ value: 'Extracted Word Text' } as never);

      const result = await extractDocumentText(fakeBuffer, DOCX_MIME);

      expect(mammoth.extractRawText).toHaveBeenCalledWith({ buffer: fakeBuffer });
      expect(result).toBe('Extracted Word Text');
    });

    test('should throw an error if an unsupported MIME type is passed', async () => {
      await expect(extractDocumentText(fakeBuffer, 'image/jpeg')).rejects.toThrow(
        'Unsupported MIME type for extraction: image/jpeg'
      );
    });

    test('should return direct text from a digital PDF if text layer is sufficient', async () => {
      // Setup a fake PDF proxy response
      vi.mocked(getDocumentProxy).mockResolvedValue({ numPages: 2 } as never);
      // Simulate clean text extracted natively
      vi.mocked(extractText).mockResolvedValue({ text: 'This is a valid clean text layer.' } as never);

      const result = await extractDocumentText(fakeBuffer, PDF_MIME);

      expect(getDocumentProxy).toHaveBeenCalled();
      expect(extractText).toHaveBeenCalled();
      expect(result).toBe('This is a valid clean text layer.');
      // Confirm OCR was completely bypassed
      expect(createWorker).not.toHaveBeenCalled();
    });

    test('should fall back to Tesseract OCR when a PDF text layer is missing or too short', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Setup PDF to trigger fallback (text layer less than 10 characters)
      vi.mocked(getDocumentProxy).mockResolvedValue({ numPages: 1 } as never);
      vi.mocked(extractText).mockResolvedValue({ text: 'Short' } as never);

      // Setup mock image renderer return
      vi.mocked(renderPageAsImage).mockResolvedValue(Buffer.from('fake-png-data') as never);

      //  Setup what the OCR text extraction recognizes
      vi.mocked(mockTesseractWorker.recognize).mockResolvedValue({
        data: { text: 'Text read via OCR scanning engine.' },
      } as never);

      const result = await extractDocumentText(fakeBuffer, PDF_MIME);

      expect(consoleWarnSpy).toHaveBeenCalledWith('PDF has no text layer; falling back to OCR.');
      expect(renderPageAsImage).toHaveBeenCalledTimes(1);
      expect(mockTesseractWorker.recognize).toHaveBeenCalled();
      expect(mockTesseractWorker.terminate).toHaveBeenCalled();
      expect(result).toBe('Text read via OCR scanning engine.');

      consoleWarnSpy.mockRestore();
    });

    test('should cap OCR processing loop to maximum allowed pages when document length exceeds limits', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Simulate an extra long 15 page document (Limit is 10)
      vi.mocked(getDocumentProxy).mockResolvedValue({ numPages: 15 } as never);
      vi.mocked(extractText).mockResolvedValue({ text: ''} as never); // empty layer triggers OCR
      vi.mocked(renderPageAsImage).mockResolvedValue(Buffer.from('png') as never);
      vi.mocked(mockTesseractWorker.recognize).mockResolvedValue({ data: { text: 'page' } } as never);

      await extractDocumentText(fakeBuffer, PDF_MIME);

      // Verify page loop caps out exactly at the MAX_OCR_PAGES configuration limit (10)
      expect(renderPageAsImage).toHaveBeenCalledTimes(10);
      expect(consoleWarnSpy).toHaveBeenLastCalledWith('OCR limited to the first 10 of 15 pages.');

      consoleWarnSpy.mockRestore();
    });
  });
});