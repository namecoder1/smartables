import { TELNYX_API_URL } from "./constants/api";

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;

if (!TELNYX_API_KEY) {
  console.warn("Missing TELNYX_API_KEY in environment variables");
}

export type TelnyxNumber = {
  phoneNumber: string;
  region: string;
  cost: string;
  features: string[];
};

// ── Shared fetch wrapper ──

async function telnyxFetch(
  path: string,
  options: RequestInit = {},
): Promise<any> {
  if (!TELNYX_API_KEY) throw new Error("TELNYX_API_KEY is not set");

  const url = path.startsWith("http") ? path : `${TELNYX_API_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${TELNYX_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Telnyx API error [${path}]:`, errorText);
    throw new Error(`Telnyx API error: ${errorText}`);
  }

  return response.json();
}

// ── Public API ──

export async function searchAvailableNumbers(
  countryCode: string = "IT",
  region?: string,
  limit: number = 10,
): Promise<TelnyxNumber[]> {
  const params = new URLSearchParams({
    "filter[country_code]": countryCode,
    "filter[limit]": limit.toString(),
    "filter[features][]": "voice",
    "filter[phone_number_type]": "local",
  });

  if (region) {
    if (/^\d+$/.test(region)) {
      params.append("filter[national_destination_code]", region);
    } else {
      params.append("filter[region]", region);
    }
  }

  const data = await telnyxFetch(
    `/available_phone_numbers?${params.toString()}`,
    { method: "GET" },
  );

  return data.data.map((num: any) => ({
    phoneNumber: num.phone_number,
    region: num.region_information?.[0]?.region_name || region || "",
    cost: num.cost_information?.upfront_cost || "0.00",
    features: num.features.map((f: any) => f.name),
  }));
}

export async function purchasePhoneNumber(
  phoneNumber: string,
  requirementGroupId?: string,
  connectionId?: string,
) {
  const phoneNumberEntry: any = { phone_number: phoneNumber };
  if (requirementGroupId) {
    phoneNumberEntry.requirement_group_id = requirementGroupId;
  }

  const data = await telnyxFetch("/number_orders", {
    method: "POST",
    body: JSON.stringify({
      phone_numbers: [phoneNumberEntry],
      connection_id: connectionId || process.env.TELNYX_CONNECTION_ID,
    }),
  });

  return data;
}

export async function answerCall(callControlId: string) {
  await telnyxFetch(`/calls/${callControlId}/actions/answer`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return true;
}

export async function hangupCall(callControlId: string) {
  await telnyxFetch(`/calls/${callControlId}/actions/hangup`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return true;
}

export async function startRecording(
  callControlId: string,
  clientState?: string,
) {
  await telnyxFetch(`/calls/${callControlId}/actions/record_start`, {
    method: "POST",
    body: JSON.stringify({
      format: "mp3",
      channels: "single",
      client_state: clientState || null,
    }),
  });
  return true;
}

export async function rejectCall(callControlId: string) {
  try {
    await telnyxFetch(`/calls/${callControlId}/actions/reject`, {
      method: "POST",
      body: JSON.stringify({ cause: "USER_BUSY" }),
    });
  } catch (error) {
    console.error("Error rejecting call:", error);
  }
}

export async function transferCall(callControlId: string, to: string) {
  await telnyxFetch(`/calls/${callControlId}/actions/transfer`, {
    method: "POST",
    body: JSON.stringify({ to }),
  });
  return true;
}

export async function getOwnedNumbers() {
  const data = await telnyxFetch("/phone_numbers", { method: "GET" });

  return data.data.map((num: any) => ({
    id: num.id,
    phoneNumber: num.phone_number,
    region: num.region_information?.[0]?.region_name || "",
    connectionId: num.connection_id,
    status: num.status,
    requirementGroupId: num.requirement_group_id,
  }));
}

export async function listRequirementGroups() {
  const data = await telnyxFetch("/requirement_groups", { method: "GET" });
  return data.data;
}

export async function updatePhoneNumber(id: string, connectionId: string) {
  return await telnyxFetch(`/phone_numbers/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ connection_id: connectionId }),
  });
}

export async function uploadDocument(fileBlob: Blob, filename: string) {
  if (!TELNYX_API_KEY) throw new Error("TELNYX_API_KEY is not set");

  const formData = new FormData();
  formData.append("file", fileBlob, filename);

  // uploadDocument uses FormData, so we skip the JSON content-type header
  const response = await fetch(`${TELNYX_API_URL}/documents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TELNYX_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Telnyx upload error:", errorText);
    throw new Error(`Telnyx upload failed: ${errorText}`);
  }

  const data = await response.json();
  return data.data;
}

export async function createAddress(addressData: {
  customer_reference?: string;
  street_address: string;
  extended_address?: string;
  locality: string;
  administrative_area?: string;
  postal_code: string;
  country_code: string;
  business_name?: string;
  first_name?: string;
  last_name?: string;
}) {
  const data = await telnyxFetch("/addresses", {
    method: "POST",
    body: JSON.stringify(addressData),
  });
  return data.data;
}

export async function createRequirementGroup(
  countryCode: string = "IT",
  phoneNumberType: string = "local",
  action: "ordering" | "porting" = "ordering",
  customerReference: string,
  requirements: { requirement_id: string; field_value: string }[],
) {
  const data = await telnyxFetch("/requirement_groups", {
    method: "POST",
    body: JSON.stringify({
      country_code: countryCode,
      phone_number_type: phoneNumberType,
      action: action,
      customer_reference: customerReference,
      regulatory_requirements: requirements,
    }),
  });
  return data.data;
}

export async function getRequirementGroup(id: string) {
  const data = await telnyxFetch(`/requirement_groups/${id}`, {
    method: "GET",
  });
  return data.data;
}

export async function submitRequirementGroup(id: string) {
  const data = await telnyxFetch(`/requirement_groups/${id}/submit`, {
    method: "POST",
  });
  return data.data;
}

// Telnyx Regulatory Requirement IDs for Italy (Local)
// Fetched via scripts/get_telnyx_requirements.ts
export const TELNYX_REQ_IDS = {
  // Documents
  PROOF_OF_ADDRESS: "0ba49bfa-8a0b-4e38-95ba-f1291507fad4", // National
  LOCAL_ID_COPY: "540425c2-78b7-4f24-9eef-108af9a7ad34",
  COMPANY_REGISTRATION: "8b54a9b2-62c1-41c2-93d9-00c72f057e43", // For businesses

  // Address
  ADDRESS_ID: "0e84f7f9-d195-4d02-9873-9ac4b99c276d", // "Address (national)"

  // Textual Fields
  CUSTOMER_TYPE: "413ad281-5b37-4de9-9f02-51ae91bccaa2", // natural_person, legal_entity, sole_proprietorship
  END_USER_NAME: "2836da67-5912-4bae-9740-d55844fcaf7c", // Name/Surname or Business Name

  // ID Details
  ID_TYPE: "240451b2-d3ef-4b73-b2aa-93265678a48e", // Identity card, Passport
  ID_NUMBER: "6c65df6f-28a8-4c72-8b87-b52864915c4a",
  ID_ISSUER: "a3c2682d-9c5e-45b6-84a5-9f7d1f4fc1c5",
  ID_EXPIRATION_DATE: "3164f2ae-5cdc-49d6-8790-215015f91c41", // YYYY-MM-DD
  PLACE_OF_BIRTH: "2d0e8476-e927-479d-9406-c19bb11f18db",
  DATE_OF_BIRTH: "d341dbfb-ef9d-41d8-bb40-247a1347c6f7", // YYYY-MM-DD

  // Tax Details
  TAX_CODE_PERSONAL: "7dcc2229-8ddc-4c10-a8df-ff133abc00f1", // Codice Fiscale (Persona)
  TAX_CODE_COMPANY: "6bac4095-ca03-4d63-b229-f92d1286e6a0", // Partita IVA (Azienda) as Tax Code
  VAT_NUMBER: "c4cb7670-8263-4f59-a9cd-b5705e7360ba", // VAT Number (Azienda)

  // Legal Rep Address (Extra requirement for companies?)
  // "Supplemental Address of Legal Representative’s Residence in Italy"
  LEGAL_REP_ADDRESS: "ad56ca91-a671-4c07-bc62-ada0c266e45c",
};
