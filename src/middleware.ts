import type { MiddlewareHandler } from 'astro';
import { corsHeaders } from './extensions/_shared/api-helpers';

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { pathname } = context.url;
  if (!pathname.startsWith('/api/')) {
    return next();
  }

  const origin = context.request.headers.get('Origin');

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const response = await next();
  const headers = new Headers(response.headers);
  const cors = corsHeaders(origin);
  Object.entries(cors).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
