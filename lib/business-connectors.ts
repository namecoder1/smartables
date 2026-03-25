import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export type BusinessConnectors = {
  // Google Business Profile
  google_review_url?: string;
  google_place_id?: string;
  google_access_token?: string;
  google_refresh_token?: string;
  // Google Calendar
  google_calendar_access_token?: string;
  google_calendar_refresh_token?: string;
  google_calendar_token_expiry?: number;
  google_calendar_id?: string;
  google_calendar_name?: string;
  // TheFork (POS API + B2B API)
  thefork_restaurant_id?: string;       // TheFork CustomerId (restaurant identifier)
  thefork_consumer_id?: string;         // Our POS instance UUID assigned by TheFork
  thefork_client_id?: string;           // OAuth2 client_id for B2B API
  thefork_client_secret?: string;       // OAuth2 client_secret for B2B API
  thefork_api_key?: string;             // X-Api-Key for POS API v1
  thefork_webhook_secret?: string;      // oauthClientSecret used to verify TheFork webhooks
  thefork_access_token?: string;        // Current OAuth2 access token (B2B API)
  thefork_token_expires_at?: number;    // Unix timestamp for token expiry
  // Quandoo
  quandoo_restaurant_id?: string;       // Quandoo restaurant identifier
  quandoo_partner_id?: string;          // Quandoo partner identifier
  quandoo_api_key?: string;             // Quandoo API key
  quandoo_access_token?: string;        // OAuth2 access token (if applicable)
  quandoo_token_expires_at?: number;    // Unix timestamp for token expiry
  // OpenTable
  opentable_restaurant_id?: string;     // OpenTable restaurant identifier
  opentable_client_id?: string;         // OAuth2 client_id
  opentable_client_secret?: string;     // OAuth2 client_secret
  opentable_access_token?: string;      // Current OAuth2 access token
  opentable_token_expires_at?: number;  // Unix timestamp for token expiry
};

function getKey(): Buffer {
  const keyHex = process.env.BUSINESS_CONNECTORS_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      "BUSINESS_CONNECTORS_ENCRYPTION_KEY must be a 64-char hex string (32 bytes). Generate with: openssl rand -hex 32",
    );
  }
  return Buffer.from(keyHex, "hex");
}

/**
 * Encrypts a BusinessConnectors object to a base64 string.
 * Format: iv(16 bytes) + authTag(16 bytes) + ciphertext → base64
 */
export function encryptConnectors(data: BusinessConnectors): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const plaintext = JSON.stringify(data);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Decrypts a base64 string (produced by encryptConnectors) back to a BusinessConnectors object.
 */
export function decryptConnectors(encryptedBase64: string): BusinessConnectors {
  const key = getKey();
  const buf = Buffer.from(encryptedBase64, "base64");
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8"));
}
