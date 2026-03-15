import crypto from "crypto";
import { WHATSAPP_API_URL } from "./constants/api";

/**
 * Extracts the Public Key (PEM format) from a Private Key (PEM format).
 */
export function getPublicKeyFromPrivate(privateKeyPem: string): string {
  const publicKey = crypto.createPublicKey(privateKeyPem);
  return publicKey.export({ type: "spki", format: "pem" }) as string;
}

/**
 * Registers the business public key for a specific WhatsApp phone number.
 * This is required for WhatsApp Flows to work with a dynamic endpoint.
 */
export async function registerWhatsAppPublicKey(phoneNumberId: string) {
  const privateKey = process.env.WHATSAPP_PRIVATE_KEY;
  const token =
    process.env.META_SYSTEM_USER_TOKEN;

  if (!privateKey) throw new Error("Missing WHATSAPP_PRIVATE_KEY");
  if (!token) throw new Error("Missing WhatsApp Access Token");

  const publicKeyPem = getPublicKeyFromPrivate(privateKey);

  console.log(
    `[WhatsApp Encryption] Registering public key for ${phoneNumberId}...`,
  );

  const response = await fetch(
    `${WHATSAPP_API_URL}/${phoneNumberId}/whatsapp_business_encryption`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_public_key: publicKeyPem,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("[WhatsApp Encryption] Registration Error:", data);
    throw new Error(data.error?.message || "Failed to register public key");
  }

  console.log(
    `[WhatsApp Encryption] ✅ Public key registered successfully for ${phoneNumberId}`,
  );
  return data;
}

/**
 * Gets the current encryption status for a phone number.
 */
export async function getWhatsAppEncryptionStatus(phoneNumberId: string) {
  const token =
    process.env.META_SYSTEM_USER_TOKEN;

  const response = await fetch(
    `${WHATSAPP_API_URL}/${phoneNumberId}/whatsapp_business_encryption`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return await response.json();
}

/**
 * Decrypts the request body from Meta WhatsApp Flow.
 * Meta sends AES-128-GCM encrypted data. The AES key itself is RSA encrypted.
 */
export function decryptFlowRequest(
  encryptedAesKeyBase64: string,
  encryptedFlowDataBase64: string,
  initialVectorBase64: string,
  privateKeyPem: string,
) {
  // 1. Decrypt the AES key using our RSA private key
  const encryptedAesKey = Buffer.from(encryptedAesKeyBase64, "base64");
  const decryptedAesKey = crypto.privateDecrypt(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    encryptedAesKey,
  );

  // 2. Prepare IV and Ciphertext for AES-128-GCM
  const initialVector = Buffer.from(initialVectorBase64, "base64");
  const encryptedFlowData = Buffer.from(encryptedFlowDataBase64, "base64");

  // In AES-GCM, the last 16 bytes are the authentication tag
  const TAG_LENGTH = 16;
  const authTag = encryptedFlowData.subarray(-TAG_LENGTH);
  const cipherText = encryptedFlowData.subarray(0, -TAG_LENGTH);

  // 3. Decrypt the Flow Data
  const decipher = crypto.createDecipheriv(
    "aes-128-gcm",
    decryptedAesKey,
    initialVector,
  );
  decipher.setAuthTag(authTag);

  let decryptedData = decipher.update(cipherText, undefined, "utf8");
  decryptedData += decipher.final("utf8");

  return {
    decryptedBody: JSON.parse(decryptedData),
    aesKeyBuffer: decryptedAesKey,
    initialVectorBuffer: initialVector,
  };
}

/**
 * Encrypts the response to send back to Meta WhatsApp Flow.
 * The response must be AES-encrypted using the SAME AES Key and IV
 * that we received (and inverted IV) as per Meta docs.
 */
export function encryptFlowResponse(
  responseObject: any,
  aesKeyBuffer: Buffer,
  initialVectorBuffer: Buffer,
) {
  const flippedIV = Buffer.alloc(initialVectorBuffer.length);
  for (let i = 0; i < initialVectorBuffer.length; i++) {
    flippedIV[i] = ~initialVectorBuffer[i];
  }

  const cipher = crypto.createCipheriv("aes-128-gcm", aesKeyBuffer, flippedIV);

  let encryptedFlowData = cipher.update(
    JSON.stringify(responseObject),
    "utf8",
    "base64",
  );
  encryptedFlowData += cipher.final("base64");

  // Get Auth Tag and append to ciphertext (Meta requires it concatenated inside the base64)
  const authTag = cipher.getAuthTag();

  // To match Meta's format, we combine the raw ciphertext and tag, then base64 encode
  const cipherTextBuffer = Buffer.from(encryptedFlowData, "base64");
  const combinedBuffer = Buffer.concat([cipherTextBuffer, authTag]);

  return combinedBuffer.toString("base64");
}
