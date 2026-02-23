import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;

async function checkReqGroup() {
  if (!TELNYX_API_KEY) throw new Error("TELNYX_API_KEY is not set");

  const reqGroupId = "10435278-1c1b-4332-886c-d0f1beb47012";

  const reqResponse = await fetch(
    `https://api.telnyx.com/v2/requirement_groups/${reqGroupId}`,
    {
      headers: {
        Authorization: `Bearer ${TELNYX_API_KEY}`,
        Accept: "application/json",
      },
    },
  );
  const reqResult = await reqResponse.json();
  console.log("Requirement Group Status:", reqResult.data?.status);

  // Also check the order status to see if it failed
  const orderId = "ae977014-f1f8-4d13-9464-24f3fde14a2f"; // The order we placed
  const orderResponse = await fetch(
    `https://api.telnyx.com/v2/number_orders/${orderId}`,
    {
      headers: {
        Authorization: `Bearer ${TELNYX_API_KEY}`,
        Accept: "application/json",
      },
    },
  );
  const orderResult = await orderResponse.json();
  console.log("Order Status:", orderResult.data?.status);
  console.log(
    "Order Requirements:",
    JSON.stringify(orderResult.data?.requirements, null, 2),
  );
}

checkReqGroup();
