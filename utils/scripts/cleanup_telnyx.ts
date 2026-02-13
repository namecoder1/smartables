import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;

if (!TELNYX_API_KEY) {
  console.error("Please ensure TELNYX_API_KEY is set in .env.local");
  process.exit(1);
}

async function listAndDeleteRequirementGroups() {
  const response = await fetch(
    `https://api.telnyx.com/v2/requirement_groups?filter[country_code]=IT&page[size]=100`,
    {
      headers: {
        Authorization: `Bearer ${TELNYX_API_KEY}`,
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    console.error("Error fetching groups:", await response.text());
    return;
  }

  const data = await response.json();
  const groups = data.data;

  for (const group of groups) {
    const delRes = await fetch(
      `https://api.telnyx.com/v2/requirement_groups/${group.id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${TELNYX_API_KEY}` },
      },
    );

    if (delRes.ok) {
    } else {
      console.error(`Failed to delete ${group.id}:`, await delRes.text());
    }
  }
}

listAndDeleteRequirementGroups();
