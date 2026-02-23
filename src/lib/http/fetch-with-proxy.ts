import { ProxyAgent } from "undici";

const proxyDispatcherByUrl = new Map<string, ProxyAgent>();

export async function fetchWithProxy(input: string, init: RequestInit = {}): Promise<Response> {
  const proxyUrl = resolveProxyUrl(input);
  if (!proxyUrl) {
    return fetch(input, init);
  }

  let dispatcher = proxyDispatcherByUrl.get(proxyUrl);
  if (!dispatcher) {
    dispatcher = new ProxyAgent(proxyUrl);
    proxyDispatcherByUrl.set(proxyUrl, dispatcher);
  }

  return fetch(input, {
    ...init,
    // Node.js fetch supports undici dispatcher, but DOM RequestInit types do not expose it.
    dispatcher,
  } as RequestInit & { dispatcher: ProxyAgent });
}

function resolveProxyUrl(targetUrl: string): string | undefined {
  try {
    const url = new URL(targetUrl);
    if (isBypassedByNoProxy(url.hostname)) {
      return undefined;
    }

    if (url.protocol === "https:") {
      return process.env.HTTPS_PROXY || process.env.HTTP_PROXY || undefined;
    }
    if (url.protocol === "http:") {
      return process.env.HTTP_PROXY || undefined;
    }
  } catch {
    return process.env.HTTPS_PROXY || process.env.HTTP_PROXY || undefined;
  }

  return undefined;
}

function isBypassedByNoProxy(hostname: string): boolean {
  const noProxy = process.env.NO_PROXY;
  if (!noProxy) {
    return false;
  }

  const rules = noProxy
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
  const normalizedHost = hostname.toLowerCase();

  return rules.some((rule) => {
    if (rule === "*") {
      return true;
    }
    if (rule.startsWith(".")) {
      return normalizedHost.endsWith(rule.slice(1));
    }
    return normalizedHost === rule;
  });
}

