import dns from 'dns/promises';
import ipaddr from 'net';

const BLOCKED_HOSTNAMES = ['localhost', 'metadata.google.internal', 'instance-data'];

/**
 * Checks whether an IPv4 address is in a private, loopback, or link-local range.
 */
function isPrivateIp(ip) {
  if (ip === '127.0.0.1' || ip === '::1' || ip === '0.0.0.0') return true;

  const parts = ip.split('.').map(Number);
  if (parts.length === 4) {
    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 169.254.0.0/16 (Link-local / AWS & GCP metadata)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 127.0.0.0/8
    if (parts[0] === 127) return true;
  }

  return false;
}

/**
 * Validates a target URL against SSRF attack vectors.
 * Resolves DNS to ensure no private IPs are targeted.
 */
export async function validateSsrfUrl(targetUrl) {
  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    throw new Error('Invalid URL format');
  }

  // Enforce http / https protocols
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`Forbidden protocol: "${parsed.protocol}". Only HTTP and HTTPS are permitted.`);
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    throw new Error(`Forbidden host destination: "${hostname}".`);
  }

  // Resolve hostname to IP addresses and verify none are private
  try {
    const lookupResult = await dns.lookup(hostname);
    if (isPrivateIp(lookupResult.address)) {
      throw new Error(`SSRF Blocked: Target resolves to restricted private IP address (${lookupResult.address}).`);
    }
  } catch (err) {
    if (err.message && err.message.startsWith('SSRF Blocked')) {
      throw err;
    }
    // DNS resolution failure
    throw new Error(`Unable to resolve destination host: "${hostname}".`);
  }

  return true;
}
