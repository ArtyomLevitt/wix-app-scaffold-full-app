export const getApiBase = (): string => {
  try {
    return new URL(import.meta.url).origin;
  } catch {
    return '';
  }
};

export async function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = 6000, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function isLikelyEditorPreview(): boolean {
  try {
    localStorage.setItem('__ppt_probe', '1');
    localStorage.removeItem('__ppt_probe');
  } catch {
    return true;
  }
  if (typeof document !== 'undefined') {
    const ref = document.referrer || '';
    if (/editor\.wix|studio\.wix|manage\.wix/.test(ref)) return true;
  }
  return false;
}
