import { Svix, type EndpointOut } from "svix";

let _svix: Svix | null | undefined;

export function getSvixClient(): Svix | null {
  if (_svix !== undefined) return _svix;
  const token = process.env.SVIX_AUTH_TOKEN;
  const serverUrl = process.env.SVIX_SERVER_URL;
  if (!token || !serverUrl) {
    _svix = null;
    return null;
  }
  _svix = new Svix(token, { serverUrl });
  return _svix;
}

export async function listWebhookEndpoints(appId: string): Promise<EndpointOut[]> {
  const svix = getSvixClient();
  if (!svix) return [];
  const list = await svix.endpoint.list(appId);
  return list.data ?? [];
}
