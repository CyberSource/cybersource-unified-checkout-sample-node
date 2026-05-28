'use strict';

/**
 * Token Validator - Verifies and decodes JWT tokens from CyberSource API
 * Prevents accepting pre-decoded/tampered data from the client
 */

const https = require('https');
const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const cybersourceRestApi = require('cybersource-rest-client');

/**
 * Algorithms accepted for CyberSource-issued JWTs.
 * Only asymmetric RS256 is permitted; any symmetric (HS*) or `none`
 * algorithm is rejected up front to defeat algorithm-confusion attacks.
 */
const ALLOWED_ALGORITHMS = ['RS256'];

/**
 * CyberSource JWKS hosts per environment.
 */
const JWKS_HOSTS = {
  production: 'api.cybersource.com',
  test: 'apitest.cybersource.com'
};

/**
 * Hosts allowed to serve the Flex / Unified-Checkout client JS bundle.
 * Defence-in-depth: even if a forged JWT somehow passed verification,
 * the resulting <script src> can only ever point at a CyberSource origin.
 */
const ALLOWED_CLIENT_LIBRARY_HOSTS = new Set([
  'flex.cybersource.com',
  'testflex.cybersource.com',
  'flex.test.cybersource.com'
]);

/**
 * In-memory JWK cache keyed by `${host}:${kid}`.
 * CyberSource JWKs are stable per kid, so a long TTL is safe.
 */
const JWK_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const jwkCache = new Map();

/**
 * Resolve which CyberSource environment to fetch keys from.
 * Reads CYBS_RUN_ENVIRONMENT if set; otherwise defers to Configuration.js.
 */
function resolveJwksHost() {
  const envHost = process.env.CYBS_RUN_ENVIRONMENT;
  if (envHost && typeof envHost === 'string') {
    if (envHost.includes('apitest')) return JWKS_HOSTS.test;
    if (envHost.includes('api.cybersource.com')) return JWKS_HOSTS.production;
  }
  try {
    // Lazy require to avoid a circular dependency at module load.
    const Configuration = require('../Data/Configuration.js');
    const cfg = new Configuration();
    const runEnv = (cfg.runEnvironment || '').toString();
    if (runEnv.includes('apitest')) return JWKS_HOSTS.test;
    if (runEnv.includes('api.cybersource.com')) return JWKS_HOSTS.production;
  } catch (_) {
    // fall through
  }
  // Safe default: the sample app ships pointing at the sandbox.
  return JWKS_HOSTS.test;
}

/**
 * Fetch a single JWK from CyberSource's Flex public-keys endpoint.
 * Endpoint shape: GET https://{host}/flex/v2/public-keys/{kid}
 */
function fetchJwk(host, kid) {
  return new Promise((resolve, reject) => {
    if (!/^[A-Za-z0-9_\-]{1,128}$/.test(kid)) {
      return reject(new Error('Invalid kid format'));
    }
    const options = {
      host,
      path: `/flex/v2/public-keys/${encodeURIComponent(kid)}`,
      method: 'GET',
      timeout: 5000,
      headers: { Accept: 'application/json' }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`JWKS fetch failed: HTTP ${res.statusCode}`));
        }
        try {
          const parsed = JSON.parse(body);
          if (!parsed || typeof parsed !== 'object' || !parsed.kty) {
            return reject(new Error('JWKS response is not a valid JWK'));
          }
          resolve(parsed);
        } catch (e) {
          reject(new Error(`JWKS response parse error: ${e.message}`));
        }
      });
    });
    req.on('timeout', () => { req.destroy(new Error('JWKS fetch timeout')); });
    req.on('error', (err) => reject(err));
    req.end();
  });
}

/**
 * Return a PEM-encoded public key for the given kid, using cache.
 */
async function getCyberSourcePublicKey(kid) {
  const host = resolveJwksHost();
  const cacheKey = `${host}:${kid}`;
  const cached = jwkCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.pem;
  }
  const jwk = await fetchJwk(host, kid);
  const pem = jwkToPem(jwk);
  jwkCache.set(cacheKey, { pem, expiresAt: Date.now() + JWK_CACHE_TTL_MS });
  return pem;
}

/**
 * Decodes a JWT token without verification (helper).
 * Use only for inspection of the header before verification.
 */
function decodeJWT(token) {
  if (typeof token !== 'string') {
    throw new Error('Token must be a string');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format: token must have 3 parts (header.payload.signature)');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    const signature = signatureB64;

    return { header, payload, signature, parts };
  } catch (error) {
    throw new Error(`Failed to decode JWT: ${error.message}`);
  }
}

/**
 * Extracts and validates the clientLibrary URL and integrity from a verified token payload.
 * Enforces an https-only, CyberSource-hostname allowlist on the URL.
 */
function extractClientLibraryInfo(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be a valid object');
  }

  if (!payload.ctx || !Array.isArray(payload.ctx) || payload.ctx.length === 0) {
    throw new Error('Invalid payload structure: missing or empty ctx array');
  }

  const ctxData = payload.ctx[0];
  if (!ctxData || !ctxData.data) {
    throw new Error('Invalid payload structure: missing data in ctx[0]');
  }

  const { clientLibrary, clientLibraryIntegrity } = ctxData.data;

  if (!clientLibrary || typeof clientLibrary !== 'string') {
    throw new Error('Invalid payload: clientLibrary must be a non-empty string');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(clientLibrary);
  } catch (error) {
    throw new Error(`Invalid clientLibrary URL: ${clientLibrary}`);
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new Error(`clientLibrary URL must use https (got ${parsedUrl.protocol})`);
  }

  if (!ALLOWED_CLIENT_LIBRARY_HOSTS.has(parsedUrl.hostname)) {
    throw new Error(`clientLibrary host not in CyberSource allowlist: ${parsedUrl.hostname}`);
  }

  if (clientLibraryIntegrity && typeof clientLibraryIntegrity !== 'string') {
    throw new Error('Invalid payload: clientLibraryIntegrity must be a string if provided');
  }

  return {
    clientLibrary,
    clientLibraryIntegrity: clientLibraryIntegrity || ''
  };
}

/**
 * Verifies a CyberSource capture-context JWT.
 *  - Rejects alg=none and any symmetric (HS*) algorithm (algorithm-confusion defence).
 *  - Resolves the signing key from CyberSource's JWKS endpoint using the
 *    token's kid header, converts the JWK to PEM, and verifies RS256.
 *
 * @param {string} token
 * @returns {Promise<{payload: object, header: object, isVerified: true}>}
 */
async function verifyAndDecodeToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a non-empty string');
  }

  let decoded;
  try {
    decoded = decodeJWT(token);
  } catch (error) {
    throw new Error(`Failed to decode token: ${error.message}`);
  }

  const { header } = decoded;

  if (!header || typeof header.alg !== 'string') {
    throw new Error('Invalid token: missing algorithm in header');
  }

  // Algorithm-confusion defence: reject `none` and all symmetric algs
  // before handing the token to jsonwebtoken (belt-and-braces).
  const alg = header.alg.toUpperCase();
  if (alg === 'NONE' || alg.startsWith('HS') || !ALLOWED_ALGORITHMS.includes(alg)) {
    throw new Error(`Disallowed token algorithm: ${header.alg}`);
  }

  if (!header.kid || typeof header.kid !== 'string') {
    throw new Error('Invalid token: missing kid in header');
  }

  const publicKey = await getCyberSourcePublicKey(header.kid);

  let verifiedPayload;
  try {
    verifiedPayload = jwt.verify(token, publicKey, {
      algorithms: ALLOWED_ALGORITHMS
    });
  } catch (error) {
    throw new Error(`Token signature verification failed: ${error.message}`);
  }

  return {
    payload: verifiedPayload,
    header,
    isVerified: true
  };
}

/**
 * Extracts client library information from a CyberSource capture context token.
 */
async function extractClientLibraryFromToken(captureContextToken) {
  try {
    const verified = await verifyAndDecodeToken(captureContextToken);
    return extractClientLibraryInfo(verified.payload);
  } catch (error) {
    throw new Error(`Failed to extract client library from token: ${error.message}`);
  }
}

/**
 * Extracts payment response data from a signed response token.
 * Validates against the CyberSource PtsV2PaymentsPost201Response model.
 */
async function extractResponseData(responseToken) {
  try {
    const verified = await verifyAndDecodeToken(responseToken);
    const responsePayload = verified.payload;

    if (responsePayload && typeof responsePayload === 'object') {
      try {
        cybersourceRestApi.PtsV2PaymentsPost201Response.constructFromObject(responsePayload);
      } catch (modelError) {
        throw new Error(`Response data does not match expected CyberSource model: ${modelError.message}`);
      }
    }

    return responsePayload;
  } catch (error) {
    throw new Error(`Failed to extract response data from token: ${error.message}`);
  }
}

module.exports = {
  decodeJWT,
  verifyAndDecodeToken,
  extractClientLibraryFromToken,
  extractClientLibraryInfo,
  extractResponseData,
  ALLOWED_ALGORITHMS,
  ALLOWED_CLIENT_LIBRARY_HOSTS
};
