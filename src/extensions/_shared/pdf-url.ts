export type PdfUrlValidationCode =
  | 'empty'
  | 'invalid_format'
  | 'invalid_scheme'
  | 'ok';

export interface PdfUrlValidationResult {
  ok: boolean;
  normalized: string;
  reason?: string;
  code: PdfUrlValidationCode;
}

const PDF_EXT = /\.pdf(\?|#|$)/i;
const ALLOWED_SCHEMES = /^https?:\/\//i;

export function normalizePdfUrl(raw: string | undefined | null): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw.trim();
}

export function validatePdfUrl(raw: string | undefined | null): PdfUrlValidationResult {
  const normalized = normalizePdfUrl(raw);
  if (!normalized) {
    return { ok: false, normalized: '', reason: 'URL is required', code: 'empty' };
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return {
      ok: false,
      normalized,
      reason: 'Enter a valid URL starting with https://',
      code: 'invalid_format',
    };
  }

  if (!ALLOWED_SCHEMES.test(parsed.href)) {
    return {
      ok: false,
      normalized,
      reason: 'Only http and https URLs are supported',
      code: 'invalid_scheme',
    };
  }

  const pathLooksLikePdf =
    PDF_EXT.test(parsed.pathname) ||
    PDF_EXT.test(parsed.href) ||
    parsed.pathname.toLowerCase().endsWith('.pdf');

  if (!pathLooksLikePdf) {
    return {
      ok: false,
      normalized: parsed.href,
      reason: 'URL should point to a PDF file (.pdf)',
      code: 'invalid_format',
    };
  }

  return { ok: true, normalized: parsed.href, code: 'ok' };
}

export type UrlReachabilityStatus = 'unknown' | 'valid' | 'invalid' | 'reachable' | 'unreachable';

export function mapValidationToConnectionStatus(
  validation: PdfUrlValidationResult,
  reachable?: boolean | null,
): UrlReachabilityStatus {
  if (!validation.ok) return 'invalid';
  if (reachable === true) return 'reachable';
  if (reachable === false) return 'unreachable';
  return 'valid';
}
