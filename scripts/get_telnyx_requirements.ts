import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;

async function getRequirements() {
  if (!TELNYX_API_KEY) {
    console.error("Please ensure TELNYX_API_KEY is set in .env.local");
    return;
  }

  // Try using filter[] syntax which is common in Telnyx API
  // https://developers.telnyx.com/api/numbers/requirements/list-requirements
  const url = `https://api.telnyx.com/v2/requirements?filter[country_code]=IT&filter[phone_number_type]=local`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TELNYX_API_KEY}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    console.error("Error:", await response.text());
    return;
  }

  const data = await response.json();

  // Note: API might return generic requirements that apply to IT if strict filter works
  const itReq = data.data.find(
    (r: any) => r.country_code === "IT" && r.phone_number_type === "local",
  );

  if (itReq) {
    itReq.requirement_types.forEach((rt: any) => {
      console.log(rt);
    });
  } else {
    console.log(
      `No specific IT/local requirement found in the response. Total results: ${data.data.length}`,
    );
    console.log(
      "Countries found in response:",
      data.data
        .map((r: any) => `${r.country_code} (${r.phone_number_type})`)
        .join(", "),
    );
  }
}

getRequirements();
