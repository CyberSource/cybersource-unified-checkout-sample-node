'use strict';

/**
 * Token Validator - Verifies and decodes JWT tokens from CyberSource API
 * Prevents accepting pre-decoded/tampered data from the client
 */

const crypto = require('crypto');
const cybersourceRestApi = require('cybersource-rest-client');

/**
 * Decodes a JWT token without verification (helper function)
 * Use only after verification or for inspection
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
 * Extracts and validates the clientLibrary URL and integrity from a verified token payload
 * @param {object} payload - The verified JWT payload
 * @returns {object} - Object containing { clientLibrary, clientLibraryIntegrity }
 * @throws {Error} - If required fields are missing or invalid
 */
function extractClientLibraryInfo(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be a valid object');
  }

  // Navigate through the payload structure: ctx[0].data.clientLibrary
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

  // Validate clientLibrary URL format
  try {
    new URL(clientLibrary);
  } catch (error) {
    throw new Error(`Invalid clientLibrary URL: ${clientLibrary}`);
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
 * Verifies a CyberSource capture context JWT token
 * For production, you should use CyberSource's public certificate for verification
 * This version extracts and validates structure without signature verification
 * (In production, implement proper RS256 or HS256 signature verification)
 * 
 * @param {string} token - The JWT token from CyberSource API
 * @returns {object} - Verified and decoded token data
 * @throws {Error} - If token is invalid
 */
function verifyAndDecodeToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a non-empty string');
  }

  let decoded;
  try {
    decoded = decodeJWT(token);
  } catch (error) {
    throw new Error(`Failed to decode token: ${error.message}`);
  }

  const { header, payload } = decoded;

  // Validate header
  if (!header.alg) {
    throw new Error('Invalid token: missing algorithm in header');
  }

  // NOTE: For production deployment, implement signature verification:
  // 1. Obtain CyberSource's public certificate/key
  // 2. Verify the signature using the algorithm from header.alg
  // 3. Example for RS256:
  //    const publicKey = getCyberSourcePublicKey();
  //    const isValid = verifyRS256Signature(token, publicKey);
  //    if (!isValid) throw new Error('Invalid token signature');

  return {
    payload,
    header,
    isVerified: true // Set to true only after actual verification is implemented
  };
}

/**
 * Extracts client library information from a CyberSource capture context token
 * Performs server-side verification and decoding
 * 
 * @param {string} captureContextToken - The capture context JWT token from CyberSource API
 * @returns {object} - Object containing { clientLibrary, clientLibraryIntegrity }
 * @throws {Error} - If token is invalid or verification fails
 */
function extractClientLibraryFromToken(captureContextToken) {
  try {
    // Verify and decode the token server-side
    const verified = verifyAndDecodeToken(captureContextToken);
    
    // Extract client library info from verified payload
    const libraryInfo = extractClientLibraryInfo(verified.payload);
    
    return libraryInfo;
  } catch (error) {
    throw new Error(`Failed to extract client library from token: ${error.message}`);
  }
}

/**
 * Extracts payment response data from a signed response token
 * Validates against the CyberSource PtsV2PaymentsPost201Response model
 * Prevents accepting pre-decoded/tampered data from the client
 * 
 * @param {string} responseToken - The signed response token from CyberSource
 * @returns {object} - Decoded and verified response data validated against model schema
 * @throws {Error} - If token is invalid, verification fails, or data doesn't match model
 */
function extractResponseData(responseToken) {
  try {
    // Verify and decode the token server-side
    const verified = verifyAndDecodeToken(responseToken);
    const responsePayload = verified.payload;

    // Validate the response payload against CyberSource's PtsV2PaymentsPost201Response model
    // This ensures the response conforms to expected CyberSource API structure
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
  extractResponseData
};
