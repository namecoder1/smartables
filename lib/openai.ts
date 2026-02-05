import fs from "fs";
import path from "path";
import os from "os";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function transcribeAudio(audioUrl: string): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");

  // 1. Download the file
  const tempFilePath = path.join(os.tmpdir(), `telnyx_audio_${Date.now()}.mp3`);

  try {
    const response = await fetch(audioUrl);
    if (!response.ok)
      throw new Error(`Failed to download audio: ${response.statusText}`);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    fs.writeFileSync(tempFilePath, buffer);

    // 2. Send to Whisper
    const formData = new FormData();
    // Valid file object for FormData in Node environment is tricky without 'form-data' package or Blob from file
    // In Next.js / active Node versions, fetching global 'File' or 'Blob' might work.

    const file = new Blob([buffer], { type: "audio/mp3" });
    // @ts-ignore
    formData.append("file", file, "audio.mp3");
    formData.append("model", "whisper-1");
    // Hint to help whisper extract numbers?
    formData.append("prompt", "The verification code is. Numbers.");

    const whisperResponse = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      },
    );

    if (!whisperResponse.ok) {
      const err = await whisperResponse.json();
      throw new Error(err.error?.message || "Whisper API failed");
    }

    const data = await whisperResponse.json();
    return data.text; // "Your verification code is 1 2 3 4 5 6"
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  } finally {
    // Cleanup
    if (fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch {}
    }
  }
}

export function extractVerificationCode(text: string): string | null {
  // Look for a sequence of 6 digits.
  // Whisper might output "1 2 3...", "123...", "1, 2, 3..."
  const cleanText = text.replace(/[^0-9]/g, ""); // Remove non-digits

  // Usually WhatsApp codes are 6 digits.
  // Sometimes it reads it twice. We just need the first sequence of 6 integers.
  // Or if we regex for 6 digits in the original text allowing spaces?

  // Let's try to match a 6-digit continuous sequence from the cleaned string
  // It's safer to check context but for now, simple extraction:
  const match = cleanText.match(/(\d{6})/);
  if (match) return match[1];

  return null;
}
