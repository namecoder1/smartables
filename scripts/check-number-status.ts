import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;

async function checkStatus() {
  if (!TELNYX_API_KEY) throw new Error("TELNYX_API_KEY is not set");

  // 1. Get the number details
  const getResponse = await fetch(
    `https://api.telnyx.com/v2/phone_numbers?filter[phone_number]=+3907211640274`,
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

  if (phoneObj?.requirement_group_id) {
    console.log(
      "Requirement Group ID attached:",
      phoneObj.requirement_group_id,
    );

    // 2. Check Requirement Group status
    const reqResponse = await fetch(
      `https://api.telnyx.com/v2/requirement_groups/${phoneObj.requirement_group_id}`,
      {
        headers: {
          Authorization: `Bearer ${TELNYX_API_KEY}`,
          Accept: "application/json",
        },
      },
    );
    const reqResult = await reqResponse.json();
    console.log("Requirement Group Status:", reqResult.data?.status);
  } else {
    console.log("No requirement group attached to this number currently.");

    // Check if there are regulatory requirements needed
    const reqResponse = await fetch(
      `https://api.telnyx.com/v2/phone_numbers/${phoneObj.id}/regulatory_requirements`,
      {
        headers: {
          Authorization: `Bearer ${TELNYX_API_KEY}`,
          Accept: "application/json",
        },
      },
    );
    const reqResult = await reqResponse.json();
    console.log(
      "Regulatory Requirements:",
      JSON.stringify(reqResult.data, null, 2),
    );
  }
}

checkStatus();
