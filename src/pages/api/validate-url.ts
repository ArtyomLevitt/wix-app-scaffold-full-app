import type { APIRoute } from 'astro';
import { validatePdfUrl } from '../../extensions/_shared/pdf-url';
import { resolvePremium } from '../../extensions/_shared/instance-resolver';

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204 });

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json().catch(() => ({}))) as { url?: string };
    const validation = validatePdfUrl(body.url);

    if (!validation.ok) {
      return new Response(
        JSON.stringify({
          ok: false,
          status: 'invalid',
          reason: validation.reason,
          code: validation.code,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const { isPremium } = await resolvePremium();
    const timeoutMs = isPremium ? 12000 : 6000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let reachable = false;
    let contentType = '';
    try {
      const headRes = await fetch(validation.normalized, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
      });
      reachable = headRes.ok;
      contentType = headRes.headers.get('content-type') ?? '';
      if (!reachable) {
        const getRes = await fetch(validation.normalized, {
          method: 'GET',
          signal: controller.signal,
          headers: { Range: 'bytes=0-1023' },
          redirect: 'follow',
        });
        reachable = getRes.ok || getRes.status === 206;
        contentType = getRes.headers.get('content-type') ?? contentType;
      }
    } catch (probeErr) {
      console.warn('[validate-url] probe failed:', probeErr);
      reachable = false;
    } finally {
      clearTimeout(timer);
    }

    const looksLikePdf =
      contentType.toLowerCase().includes('pdf') ||
      validation.normalized.toLowerCase().includes('.pdf');

    return new Response(
      JSON.stringify({
        ok: true,
        status: reachable && looksLikePdf ? 'reachable' : reachable ? 'valid' : 'unreachable',
        normalized: validation.normalized,
        reachable,
        contentType,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[validate-url] failed:', err);
    return new Response(JSON.stringify({ ok: false, status: 'invalid', reason: 'Validation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
