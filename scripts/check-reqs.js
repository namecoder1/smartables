
const fs = require('fs');
const path = require('path');

// Try to load .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/"/g, '');
    }
  });
} catch (e) {
  console.log('Could not load .env.local, checking process.env');
}

const API_KEY = process.env.TELNYX_API_KEY;

if (!API_KEY) {
  console.error("TELNYX_API_KEY not found");
  process.exit(1);
}

async function checkRequirements() {
  const params = new URLSearchParams({
    "filter[country_code]": "IT",
    "filter[phone_number_type]": "local",
    "filter[action]": "ordering",
    "include": "requirement_types",
    "sort": "created_at"
  });
  
  const url = `https://api.telnyx.com/v2/requirements?${params.toString()}`;
  console.log(`Fetching requirements from: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error("Error fetching requirements:", await response.text());
      return;
    }

    const data = await response.json();
    
    // Find the matching requirement set
    const match = data.data.find(r => r.country_code === "IT" && r.phone_number_type === "local" && r.action === "ordering");
    
    if (match) {
        console.log("Found matching Requirement Set for IT/Local/Ordering:");
        console.log("ID:", match.id);
        console.log("Requirement Types:");
        match.requirement_types.forEach(rt => {
            console.log(`- [${rt.name}] ID: ${rt.id}`);
            console.log(`  Description: ${rt.description}`);
            console.log(`  Type: ${rt.type}`);
            if (rt.acceptance_criteria) {
                 console.log(`  Criteria: ${JSON.stringify(rt.acceptance_criteria, null, 2)}`);
            }
            console.log("---");
        });
    } else {
        console.log("No exact match found in response. Dumping all for manual check:");
        console.log(JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error("Script error:", error);
  }
}

checkRequirements();
