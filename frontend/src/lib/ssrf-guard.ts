/**
 * 🛡️ SSRF & DNS-Rebinding Guard
 * Vibeforce Flow OS - Enterprise Hardening Engine
 * 
 * Validates outgoing URLs against RFC 1918, RFC 3927, RFC 4193, loopback,
 * link-local, cloud metadata endpoints (169.254.169.254), and private IPv6 ranges.
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  'instance-data',
  '169.254.169.254',
  '100.100.100.200',
]);

const BLOCKED_CIDRS = [
  // IPv4 Loopback
  '127.0.0.0/8',
  // IPv4 Private (RFC 1918)
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
  // IPv4 Link-Local / APIPA (RFC 3927) & Cloud Metadata
  '169.254.0.0/16',
  // Carrier-Grade NAT (RFC 6598)
  '100.64.0.0/10',
  // IPv4 Multicast
  '224.0.0.0/4',
  // IPv4 Reserved / Broadcast
  '240.0.0.0/4',
  '0.0.0.0/8',
];

/**
 * Converts IPv4 dotted string to 32-bit unsigned number.
 */
function ipv4ToNumber(ip: string): number | null {
  const parts = ip.split('.').map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return null;
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/**
 * Checks if IPv4 address matches a CIDR range.
 */
function isIPv4InCidr(ip: string, cidr: string): boolean {
  const [network, prefixStr] = cidr.split('/');
  if (!network || !prefixStr) return false;

  const prefix = Number.parseInt(prefixStr, 10);
  const ipNum = ipv4ToNumber(ip);
  const netNum = ipv4ToNumber(network);

  if (ipNum === null || netNum === null || prefix < 0 || prefix > 32) return false;

  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return (ipNum & mask) === (netNum & mask);
}

/**
 * Checks if an IP is private or restricted.
 */
export function isPrivateOrRestrictedIp(ip: string): boolean {
  const trimmed = ip.trim().toLowerCase();

  // Basic string checks
  if (BLOCKED_HOSTNAMES.has(trimmed)) return true;

  // IPv6 checks
  if (trimmed.includes(':')) {
    if (trimmed === '::1' || trimmed === '::') return true;
    // fe80::/10 (Link-local)
    if (trimmed.startsWith('fe8') || trimmed.startsWith('fe9') || trimmed.startsWith('fea') || trimmed.startsWith('feb')) {
      return true;
    }
    // fc00::/7 (Unique local)
    if (trimmed.startsWith('fc') || trimmed.startsWith('fd')) return true;
    // ff00::/8 (Multicast)
    if (trimmed.startsWith('ff')) return true;
  }

  // IPv4 CIDR checks
  if (trimmed.includes('.') && !trimmed.includes(':')) {
    for (const cidr of BLOCKED_CIDRS) {
      if (isIPv4InCidr(trimmed, cidr)) {
        return true;
      }
    }
  }

  return false;
}

export interface UrlValidationResult {
  isValid: boolean;
  reason?: string;
  sanitizedUrl?: URL;
}

/**
 * Validates a target URL against SSRF vulnerabilities before making outgoing HTTP calls.
 */
export function validateOutgoingUrl(target: string | URL): UrlValidationResult {
  let parsed: URL;
  try {
    parsed = typeof target === 'string' ? new URL(target) : target;
  } catch {
    return { isValid: false, reason: 'Invalid URL format' };
  }

  // Enforce HTTP / HTTPS protocol only
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isValid: false, reason: `Disallowed protocol: ${parsed.protocol}. Only http: and https: allowed.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block obvious internal hosts
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { isValid: false, reason: `Blocked hostname: ${hostname}` };
  }

  // Check if hostname is an IP literal
  if (isPrivateOrRestrictedIp(hostname)) {
    return { isValid: false, reason: `Blocked private or restricted IP address: ${hostname}` };
  }

  // Block localhost aliases
  if (hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return { isValid: false, reason: `Blocked internal TLD in hostname: ${hostname}` };
  }

  return {
    isValid: true,
    sanitizedUrl: parsed,
  };
}

/**
 * SSRF-Safe fetch wrapper for outgoing webhook / integration requests.
 */
export async function safeFetch(input: string | URL, init?: RequestInit): Promise<Response> {
  const validation = validateOutgoingUrl(input);
  if (!validation.isValid || !validation.sanitizedUrl) {
    throw new Error(`[SSRF-Guard] Request blocked: ${validation.reason || 'Forbidden URL'}`);
  }

  return fetch(validation.sanitizedUrl.toString(), init);
}
