import type { APIRoute } from 'astro';
import { corsHeaders, jsonResponse } from '../../../extensions/_shared/api-helpers';
import { getPremiumInfo } from '../_shared/premium';

export const OPTIONS: APIRoute = async ({ request }) =>
  new Response(null, { status: 204, headers: corsHeaders(request.headers.get('Origin')) });

export const GET: APIRoute = async ({ request }) => {
  const premium = await getPremiumInfo();
  return jsonResponse(premium, 200, corsHeaders(request.headers.get('Origin')));
};
