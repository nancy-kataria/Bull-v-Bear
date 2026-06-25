import { extractText, getDocumentProxy, renderPageAsImage } from "unpdf";
import mammoth from "mammoth";
import { createWorker } from "tesseract.js";

export const PDF_MIME = "application/pdf";
export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** MIME types we accept for upload. */
export const ALLOWED_MIME_TYPES = [PDF_MIME, DOCX_MIME];

// OCR fallback tuning.
const MIN_TEXT_CHARS = 10; // below this, treat the PDF as having no usable text layer
const MAX_OCR_PAGES = 10;
const OCR_SCALE = 2;

export function resolveMimeType(fileName: string, providedType?: string): string | null {
  if (providedType && ALLOWED_MIME_TYPES.includes(providedType)) {
    return providedType;
  }
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return PDF_MIME;
  if (lower.endsWith(".docx")) return DOCX_MIME;
  return null;
}

async function ocrPdf(buffer: Buffer, numPages: number): Promise<string> {
  const data = new Uint8Array(buffer);
  const pageCount = Math.min(numPages, MAX_OCR_PAGES);
  const worker = await createWorker("eng");
  try {
    const pages: string[] = [];
    for (let page = 1; page <= pageCount; page++) {
      const png = await renderPageAsImage(data, page, {
        canvasImport: () => import("@napi-rs/canvas"),
        scale: OCR_SCALE,
      });
      const {
        data: { text },
      } = await worker.recognize(Buffer.from(png));
      pages.push(text);
    }
    if (numPages > MAX_OCR_PAGES) {
      console.warn(`OCR limited to the first ${MAX_OCR_PAGES} of ${numPages} pages.`);
    }
    return pages.join("\n\n");
  } finally {
    await worker.terminate();
  }
}


export async function extractDocumentText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === PDF_MIME) {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    if (text.trim().length >= MIN_TEXT_CHARS) {
      return text;
    }
    // No usable text layer — likely a scanned document. Fall back to OCR.
    console.warn("PDF has no text layer; falling back to OCR.");
    return ocrPdf(buffer, pdf.numPages);
  }
  if (mimeType === DOCX_MIME) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }
  throw new Error(`Unsupported MIME type for extraction: ${mimeType}`);
}
