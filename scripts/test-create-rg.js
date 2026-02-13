
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

// Requirement IDs from lib/telnyx-req-ids.ts (verified)
const REQ_IDS = {
  CUSTOMER_TYPE: "413ad281-5b37-4de9-9f02-51ae91bccaa2",
  END_USER_NAME: "2836da67-5912-4bae-9740-d55844fcaf7c",
  // ... others
};

async function createTestRG(customerType) {
  console.log(`Testing creation with customer_type: ${customerType}`);
  
  const payload = {
    country_code: "IT",
    phone_number_type: "local",
    action: "ordering",
    customer_reference: `test_${Date.now()}`,
    regulatory_requirements: [
       {
         requirement_id: REQ_IDS.CUSTOMER_TYPE,
         field_value: customerType
       },
       {
         requirement_id: REQ_IDS.END_USER_NAME,
         field_value: "Test User"
       },
       // Hack: Fill textual company fields with N/A
       {
         requirement_id: "6bac4095-ca03-4d63-b229-f92d1286e6a0", // Company Tax Code
         field_value: "N/A"
       },
       {
         requirement_id: "c4cb7670-8263-4f59-a9cd-b5705e7360ba", // VAT
         field_value: "N/A"
       }
    ]
  };

  try {
    const response = await fetch("https://api.telnyx.com/v2/requirement_groups", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (data.errors) {
        console.error("Error:", JSON.stringify(data.errors, null, 2));
    } else {
        const rg = data.data;
        console.log("RG Created. ID:", rg.id);
        console.log("Status:", rg.status);
        
        // Check for company fields
        const companyTaxReq = rg.regulatory_requirements.find(r => r.requirement_id === "6bac4095-ca03-4d63-b229-f92d1286e6a0");
        if (companyTaxReq) {
            console.log("FAIL: Company Tax Code requirement is present!");
        } else {
            console.log("SUCCESS: Company Tax Code requirement is ABSENT.");
        }
        
        // List all requirements present
        console.log("Requirements present:");
        rg.regulatory_requirements.forEach(r => {
            console.log(`- ${r.requirement_id}: ${r.field_value || "(empty)"}`);
        });
    }

  } catch (error) {
    console.error("Script error:", error);
  }
}

// Test with 'natural_person'
createTestRG("natural_person");
// Test with 'individual' just in case
// createTestRG("individual"); 
