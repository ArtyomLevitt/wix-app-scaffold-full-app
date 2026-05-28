import { defineMiddleware } from 'astro:middleware';

const buildCorsHeaders = (request: Request): Record<string, string> => {
  const origin = request.headers.get('origin');
  const requestedHeaders =
    request.headers.get('access-control-request-headers') || 'Content-Type, Authorization';
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': origin || '*',
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': requestedHeaders,
    'Access-Control-Max-Age': '86400',
  };
  if (origin) headers['Access-Control-Allow-Credentials'] = 'true';
  return headers;
};

export const onRequest = defineMiddleware(async (context, next) => {
  if (!context.url.pathname.startsWith('/api/')) return next();
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: buildCorsHeaders(context.request) });
  }
  const response = await next();
  for (const [k, v] of Object.entries(buildCorsHeaders(context.request))) {
    response.headers.set(k, v);
  }
  return response;
});
