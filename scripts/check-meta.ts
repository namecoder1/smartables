import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function checkMeta() {
  const token =
    process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN;
  const phoneId = "983139478220553";
  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

  if (!token) {
    console.error("No token found");
    return;
  }

  console.log("--- Checking Phone ID ---");
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}?fields=verified_name,code_verification_status,status,quality_rating`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }

  console.log("\n--- Checking WABA Numbers ---");
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${wabaId}/phone_numbers?fields=display_number,id,status,code_verification_status,quality_rating`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}

checkMeta();
