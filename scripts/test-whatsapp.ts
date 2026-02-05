import { sendWhatsAppMessage } from "../lib/whatsapp";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const recipient = process.argv[2];

  if (!recipient) {
    console.error(
      "Please provide a recipient phone number (with country code, e.g., 393331234567)",
    );
    process.exit(1);
  }

  console.log(`Sending test message to ${recipient}...`);

  try {
    const result = await sendWhatsAppMessage(recipient, {
      name: "test_tech",
      language: { code: "it" },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: "123456",
            },
          ],
        },
      ],
    });
    console.log("Template message sent successfully:", result);
  } catch (error) {
    console.error("Failed to send message:", error);
  }
}

main();
