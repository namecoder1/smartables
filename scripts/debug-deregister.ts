import { deregisterNumberFromWaba } from "../lib/meta-registration";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const PHONE_ID = "983139478220553"; // From terminal logs

async function run() {
  console.log(`Attempting to deregister ${PHONE_ID}...`);
  try {
    const success = await deregisterNumberFromWaba(PHONE_ID);
    console.log(`Deregister success: ${success}`);
  } catch (e: any) {
    console.error(`Deregister failed: ${e.message}`);
  }
}

run();
