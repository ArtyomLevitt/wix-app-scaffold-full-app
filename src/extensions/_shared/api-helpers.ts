import { appInstances } from '@wix/app-management';
import { auth } from '@wix/essentials';

const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);

export async function resolveInstanceId(): Promise<string | null> {
  try {
    const tokenInfo = await auth.getTokenInfo();
    if (tokenInfo?.instanceId) return tokenInfo.instanceId;
  } catch (tokenErr) {
    console.warn('[resolveInstanceId] getTokenInfo failed:', tokenErr);
  }
  try {
    const { instance } = await elevatedGetAppInstance();
    return instance?.instanceId ?? null;
  } catch (instErr) {
    console.warn('[resolveInstanceId] getAppInstance failed:', instErr);
    return null;
  }
}

export function corsHeaders(origin: string | null): HeadersInit {
  const allowOrigin = origin && origin !== 'null' ? origin : '*';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders: HeadersInit = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}
