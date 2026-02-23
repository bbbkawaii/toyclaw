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
  const httpProxy = readProxyEnv("HTTP_PROXY");
  const httpsProxy = readProxyEnv("HTTPS_PROXY");

  try {
    const url = new URL(targetUrl);
    if (isBypassedByNoProxy(url.hostname)) {
      return undefined;
    }

    if (url.protocol === "https:") {
      return httpsProxy || httpProxy || undefined;
    }
    if (url.protocol === "http:") {
      return httpProxy || undefined;
    }
  } catch {
    return httpsProxy || httpProxy || undefined;
  }

  return undefined;
}

function isBypassedByNoProxy(hostname: string): boolean {
  const noProxy = process.env.NO_PROXY || process.env.no_proxy;
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

    const normalizedRule = stripPort(rule);
    if (!normalizedRule) {
      return false;
    }

    if (rule.startsWith(".")) {
      const suffix = normalizedRule.slice(1);
      return normalizedHost === suffix || normalizedHost.endsWith(`.${suffix}`);
    }

    return normalizedHost === normalizedRule || normalizedHost.endsWith(`.${normalizedRule}`);
  });
}

function readProxyEnv(key: "HTTP_PROXY" | "HTTPS_PROXY"): string | undefined {
  const direct = process.env[key];
  if (direct && direct.trim().length > 0) {
    return direct.trim();
  }

  const lower = process.env[key.toLowerCase()];
  if (lower && lower.trim().length > 0) {
    return lower.trim();
  }

  return undefined;
}

function stripPort(value: string): string {
  return value.replace(/:\d+$/, "");
}
