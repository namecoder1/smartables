import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;

async function deleteNumber() {
  if (!TELNYX_API_KEY) throw new Error("TELNYX_API_KEY is not set");

  // First we need to get the ID of the number (0510913040)
  const getResponse = await fetch(
    `https://api.telnyx.com/v2/phone_numbers?filter[phone_number]=+390510913040`,
    {
      headers: {
        Authorization: `Bearer ${TELNYX_API_KEY}`,
        Accept: "application/json",
      },
    },
  );

  const getResult = await getResponse.json();
  const phoneObj = getResult.data?.[0];

  if (!phoneObj) {
    console.log(
      "Number not found in your account. You might have already deleted it.",
    );
    return;
  }

  const phoneId = phoneObj.id;
  console.log(`Found the wrong number! ID: ${phoneId}. Deleting...`);

  // Now delete it
  const delResponse = await fetch(
    `https://api.telnyx.com/v2/phone_numbers/${phoneId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${TELNYX_API_KEY}`,
        Accept: "application/json",
      },
    },
  );

  if (delResponse.ok) {
    const data = await delResponse.json();
    console.log("✅ The number has been deleted successfully.");
    console.log("Status from Telnyx:", data.data.status);
    console.log(
      "Note: Telnyx automatically issues a pro-rated refund to your balance for deleted numbers based on the days used.",
    );
  } else {
    console.error("Failed to delete number:", await delResponse.text());
  }
}

deleteNumber();
