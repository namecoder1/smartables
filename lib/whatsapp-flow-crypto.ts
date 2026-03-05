// lib/whatsapp-flow-crypto.ts
import crypto from "crypto";

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
