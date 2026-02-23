import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;

async function listReqGroups() {
  const reqResponse = await fetch(
    `https://api.telnyx.com/v2/requirement_groups`,
    {
      headers: {
        Authorization: `Bearer ${TELNYX_API_KEY}`,
        Accept: "application/json",
      },
    },
  );
  const reqResult = await reqResponse.json();

  if (reqResult.data) {
    for (const rg of reqResult.data) {
      console.log(
        `ID: ${rg.id}, Status: ${rg.status}, Country: ${rg.country_code}, Action: ${rg.action}, Ref: ${rg.customer_reference}`,
      );
    }
  } else {
    console.log(reqResult);
  }
}

listReqGroups();
