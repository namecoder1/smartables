import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const telnyx = require("../lib/telnyx");

async function testBuy() {
  const connectionId = process.env.TELNYX_CONNECTION_ID; // Must be set to your App/Connection ID
  console.log("Searching for a new available Italian number in region 0721...");
  const available = await telnyx.searchAvailableNumbers("IT", "0721", 1);
  if (!available || available.length === 0) {
    console.error("No available numbers found in Italy (0721) right now.");
    return;
  }
  const newNumber = available[0].phoneNumber;
  console.log(`Found available number: ${newNumber}`);

  console.log(`Purchasing ${newNumber} without Requirement Group...`);
  const orderData = await telnyx.purchasePhoneNumber(
    newNumber,
    undefined, // NO REQUIREMENT GROUP
    connectionId,
  );
  console.log(`Purchase order placed! Telnyx Order ID: ${orderData.data.id}`);

  // Check its status immediately
  const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
  const getResponse = await fetch(
    `https://api.telnyx.com/v2/phone_numbers?filter[phone_number]=${newNumber}`,
    {
      headers: {
        Authorization: `Bearer ${TELNYX_API_KEY}`,
        Accept: "application/json",
      },
    },
  );
  const getResult = await getResponse.json();
  console.log("New Number Status:", getResult.data?.[0]?.status);
}

testBuy();
