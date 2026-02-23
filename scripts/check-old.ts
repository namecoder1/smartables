import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;

async function checkOldNumber() {
  const getResponse = await fetch(
    `https://api.telnyx.com/v2/phone_numbers?filter[phone_number]=+3907211640272`,
    {
      headers: {
        Authorization: `Bearer ${TELNYX_API_KEY}`,
        Accept: "application/json",
      },
    },
  );

  const getResult = await getResponse.json();
  const phoneObj = getResult.data?.[0];
  console.log("Phone Number Status:", phoneObj?.status);
  console.log("Requirement Group ID attached:", phoneObj?.requirement_group_id);
  console.log("Connection ID:", phoneObj?.connection_id);
}

checkOldNumber();
