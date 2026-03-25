/**
 * Verifies the Ed25519 signature of a Telnyx webhook request.
 *
 * Telnyx signs each webhook with:
 *   - Header `telnyx-signature-ed25519`: base64-encoded Ed25519 signature
 *   - Header `telnyx-timestamp`: Unix timestamp (seconds) of when the event was sent
 *
 * The signed message is: `${timestamp}|${rawBody}`
 *
 * The public key is available in the Telnyx portal under API Keys.
 * Set it in the environment as TELNYX_WEBHOOK_PUBLIC_KEY (base64-encoded, raw 32 bytes).
 */

const TIMESTAMP_TOLERANCE_SECONDS = 300; // 5 minutes

export async function verifyTelnyxWebhook(
  rawBody: string,
  signature: string,
  timestamp: string,
): Promise<boolean> {
  const publicKeyBase64 = process.env.TELNYX_WEBHOOK_PUBLIC_KEY;
  if (!publicKeyBase64) return false;

  try {
    // Reject events older than tolerance window (replay attack prevention)
    const eventTime = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - eventTime) > TIMESTAMP_TOLERANCE_SECONDS) {
      return false;
    }

    const publicKeyBytes = Buffer.from(publicKeyBase64, "base64");
    const key = await crypto.subtle.importKey(
      "raw",
      publicKeyBytes,
      { name: "Ed25519" },
      false,
      ["verify"],
    );

    const message = new TextEncoder().encode(`${timestamp}|${rawBody}`);
    const signatureBytes = Buffer.from(signature, "base64");

    return await crypto.subtle.verify("Ed25519", key, signatureBytes, message);
  } catch {
    return false;
  }
}
