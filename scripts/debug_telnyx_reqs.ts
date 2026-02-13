import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const TELNYX_CONNECTION_ID = process.env.TELNYX_CONNECTION_ID;
const TELNYX_API_URL = "https://api.telnyx.com/v2";

// Use an existing fully-filled RG
const RG_ID = "054d3f5e-3a7d-43d6-baa9-55269f1e7a84"; // All 16 fields filled

async function main() {
  if (!TELNYX_API_KEY) {
    console.error("Missing TELNYX_API_KEY");
    process.exit(1);
  }

  // Search for number
  console.log("=== SEARCHING ===");
  const searchRes = await fetch(
    `${TELNYX_API_URL}/available_phone_numbers?filter[country_code]=IT&filter[limit]=1&filter[features][]=voice&filter[phone_number_type]=local&filter[national_destination_code]=0721`,
    {
      headers: {
        Authorization: `Bearer ${TELNYX_API_KEY}`,
        Accept: "application/json",
      },
    },
  );
  const searchData = await searchRes.json();
  const phone = searchData.data[0].phone_number;
  console.log("Number:", phone);

  // Test 1: requirement_group_id at top level (current approach - fails)
  console.log("\n=== TEST 1: requirement_group_id at TOP LEVEL ===");
  const payload1 = {
    phone_numbers: [{ phone_number: phone }],
    connection_id: TELNYX_CONNECTION_ID,
    requirement_group_id: RG_ID,
  };
  console.log("Payload:", JSON.stringify(payload1, null, 2));

  const res1 = await fetch(`${TELNYX_API_URL}/number_orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TELNYX_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload1),
  });
  console.log(`Status: ${res1.status}`);
  console.log("Response:", await res1.text());

  await new Promise((r) => setTimeout(r, 2000));

  // Test 2: requirement_group_id PER PHONE NUMBER
  console.log("\n=== TEST 2: requirement_group_id PER PHONE NUMBER ===");
  const payload2 = {
    phone_numbers: [
      {
        phone_number: phone,
        requirement_group_id: RG_ID,
      },
    ],
    connection_id: TELNYX_CONNECTION_ID,
  };
  console.log("Payload:", JSON.stringify(payload2, null, 2));

  const res2 = await fetch(`${TELNYX_API_URL}/number_orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TELNYX_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload2),
  });
  console.log(`Status: ${res2.status}`);
  console.log("Response:", await res2.text());

  await new Promise((r) => setTimeout(r, 2000));

  // Test 3: bundle_id PER PHONE NUMBER (the response example uses "bundle_id")
  console.log("\n=== TEST 3: bundle_id PER PHONE NUMBER ===");
  const payload3 = {
    phone_numbers: [
      {
        phone_number: phone,
        bundle_id: RG_ID,
      },
    ],
    connection_id: TELNYX_CONNECTION_ID,
  };
  console.log("Payload:", JSON.stringify(payload3, null, 2));

  const res3 = await fetch(`${TELNYX_API_URL}/number_orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TELNYX_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload3),
  });
  console.log(`Status: ${res3.status}`);
  console.log("Response:", await res3.text());

  await new Promise((r) => setTimeout(r, 2000));

  // Test 4: BOTH top-level AND per-phone-number
  console.log("\n=== TEST 4: BOTH top-level AND per-phone-number ===");
  const payload4 = {
    phone_numbers: [
      {
        phone_number: phone,
        requirement_group_id: RG_ID,
      },
    ],
    connection_id: TELNYX_CONNECTION_ID,
    requirement_group_id: RG_ID,
  };
  console.log("Payload:", JSON.stringify(payload4, null, 2));

  const res4 = await fetch(`${TELNYX_API_URL}/number_orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TELNYX_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload4),
  });
  console.log(`Status: ${res4.status}`);
  console.log("Response:", await res4.text());
}

main().catch(console.error);
