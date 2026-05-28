import type { MiddlewareHandler } from 'astro';

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('Origin') ?? '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { request, url } = context;

  if (!url.pathname.startsWith('/api/')) {
    return next();
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  const response = await next();
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(request))) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
