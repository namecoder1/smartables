const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const TELNYX_API_URL = "https://api.telnyx.com/v2";

if (!TELNYX_API_KEY) {
  console.warn("Missing TELNYX_API_KEY in environment variables");
}

export type TelnyxNumber = {
  phoneNumber: string;
  region: string;
  cost: string;
  features: string[];
};

export async function searchAvailableNumbers(
  countryCode: string = "IT",
  region?: string,
  limit: number = 10,
): Promise<TelnyxNumber[]> {
  if (!TELNYX_API_KEY) throw new Error("TELNYX_API_KEY is not set");

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

  try {
    const response = await fetch(
      `${TELNYX_API_URL}/available_phone_numbers?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${TELNYX_API_KEY}`,
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Telnyx search error:", errorText);
      throw new Error(`Telnyx API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.data.map((num: any) => ({
      phoneNumber: num.phone_number,
      region: num.region_information?.[0]?.region_name || region || "",
      cost: num.cost_information?.upfront_cost || "0.00",
      features: num.features.map((f: any) => f.name),
    }));
  } catch (error) {
    console.error("Error searching Telnyx numbers:", error);
    throw error;
  }
}

export async function purchasePhoneNumber(
  phoneNumber: string,
  requirementGroupId?: string,
  connectionId?: string,
) {
  if (!TELNYX_API_KEY) throw new Error("TELNYX_API_KEY is not set");

  try {
    const phoneNumberEntry: any = { phone_number: phoneNumber };
    if (requirementGroupId) {
      phoneNumberEntry.requirement_group_id = requirementGroupId;
    }

    const payload: any = {
      phone_numbers: [phoneNumberEntry],
      connection_id: connectionId || process.env.TELNYX_CONNECTION_ID,
    };

    const response = await fetch(`${TELNYX_API_URL}/number_orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TELNYX_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Telnyx purchase error:", errorText);
      throw new Error(`Telnyx purchase failed: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error purchasing Telnyx number:", error);
    throw error;
  }
}

export async function answerCall(callControlId: string) {
  if (!TELNYX_API_KEY) throw new Error("TELNYX_API_KEY is not set");

  try {
    const response = await fetch(
      `${TELNYX_API_URL}/calls/${callControlId}/actions/answer`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TELNYX_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          // stream_track: "inbound_track",
        }),
      },
    );

    if (!response.ok) {
      console.error("Failed to answer call", await response.text());
      throw new Error("Failed to answer call");
    }
    return true;
  } catch (error) {
    console.error("Error answering call:", error);
    throw error;
  }
}

export async function startRecording(callControlId: string) {
  if (!TELNYX_API_KEY) throw new Error("TELNYX_API_KEY is not set");

  try {
    const response = await fetch(
      `${TELNYX_API_URL}/calls/${callControlId}/actions/record_start`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TELNYX_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          format: "mp3",
          channels: "single",
        }),
      },
    );

    if (!response.ok) {
      console.error("Failed to start recording", await response.text());
      throw new Error("Failed to start recording");
    }
    return true;
  } catch (error) {
    console.error("Error starting recording:", error);
    throw error;
  }
}

export async function rejectCall(callControlId: string) {
  if (!TELNYX_API_KEY) throw new Error("TELNYX_API_KEY is not set");

  try {
    const response = await fetch(
      `${TELNYX_API_URL}/calls/${callControlId}/actions/reject`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TELNYX_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          cause: "USER_BUSY",
        }),
      },
    );

    if (!response.ok) {
      console.error("Failed to reject call", await response.text());
    }
  } catch (error) {
    console.error("Error rejecting call:", error);
  }
}

export async function transferCall(callControlId: string, to: string) {
  if (!TELNYX_API_KEY) throw new Error("TELNYX_API_KEY is not set");

  console.log(`[Telnyx Lib] Transferring call ${callControlId} to ${to}`);

  try {
    const response = await fetch(
      `${TELNYX_API_URL}/calls/${callControlId}/actions/transfer`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TELNYX_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          to: to,
        }),
      },
    );

    if (!response.ok) {
      console.error("Failed to transfer call", await response.text());
      throw new Error("Failed to transfer call");
    }
    return true;
  } catch (error) {
    console.error("Error transferring call:", error);
    throw error;
  }
}

export async function getOwnedNumbers() {
  if (!TELNYX_API_KEY) throw new Error("TELNYX_API_KEY is not set");

  try {
    const response = await fetch(`${TELNYX_API_URL}/phone_numbers`, {
      headers: {
        Authorization: `Bearer ${TELNYX_API_KEY}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Telnyx get owned error:", errorText);
      throw new Error(`Telnyx API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.map((num: any) => ({
      id: num.id,
      phoneNumber: num.phone_number,
      region: num.region_information?.[0]?.region_name || "",
      connectionId: num.connection_id,
      status: num.status,
    }));
  } catch (error) {
    console.error("Error getting owned Telnyx numbers:", error);
    throw error;
  }
}

export async function updatePhoneNumber(id: string, connectionId: string) {
  if (!TELNYX_API_KEY) throw new Error("TELNYX_API_KEY is not set");

  try {
    const response = await fetch(`${TELNYX_API_URL}/phone_numbers/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${TELNYX_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        connection_id: connectionId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update phone number: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating Telnyx number:", error);
    throw error;
  }
}

export async function uploadDocument(fileBlob: Blob, filename: string) {
  if (!TELNYX_API_KEY) throw new Error("TELNYX_API_KEY is not set");

  const formData = new FormData();
  formData.append("file", fileBlob, filename);

  try {
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
    return data.data; // Returns { id: string, size: number, content_type: string, ... }
  } catch (error) {
    console.error("Error uploading document to Telnyx:", error);
    throw error;
  }
}

export async function createAddress(addressData: {
  customer_reference?: string;
  street_address: string;
  extended_address?: string;
  locality: string; // City
  administrative_area?: string; // State/Province
  postal_code: string;
  country_code: string;
  business_name?: string;
  first_name?: string;
  last_name?: string;
}) {
  if (!TELNYX_API_KEY) throw new Error("TELNYX_API_KEY is not set");

  try {
    const response = await fetch(`${TELNYX_API_URL}/addresses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TELNYX_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(addressData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Telnyx create address error:", errorText);
      throw new Error(`Telnyx address creation failed: ${errorText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error creating address:", error);
    throw error;
  }
}

export async function createRequirementGroup(
  countryCode: string = "IT",
  phoneNumberType: string = "local",
  action: "ordering" | "porting" = "ordering",
  customerReference: string,
  requirements: { requirement_id: string; field_value: string }[],
) {
  if (!TELNYX_API_KEY) throw new Error("TELNYX_API_KEY is not set");

  // TODO: Retrieve actual requirement IDs for Italy/Local dynamically or via config.
  // For now, we assume the caller passes the correct requirement structure or we hardcode common ones for IT/Local if known.
  // But usually, you query distinct requirements first. For this MVP, we might need to know them.
  // "regulatory_requirements" usually need a specific ID.
  //
  // However, `requirements` argument here allows flexibility.

  try {
    const payload = {
      country_code: countryCode,
      phone_number_type: phoneNumberType,
      action: action,
      customer_reference: customerReference,
      regulatory_requirements: requirements, // Note: API expects 'regulatory_requirements' array of objects
    };

    const response = await fetch(
      "https://api.telnyx.com/v2/requirement_groups",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TELNYX_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Telnyx create requirement group error:", errorText);
      throw new Error(`Telnyx requirement group creation failed: ${errorText}`);
    }

    const data = await response.json();
    return data.data; // Returns { id: string, status: string, ... }
  } catch (error) {
    console.error("Error creating requirement group:", error);
    throw error;
  }
}

export async function getRequirementGroup(id: string) {
  if (!TELNYX_API_KEY) throw new Error("TELNYX_API_KEY is not set");

  try {
    const response = await fetch(`${TELNYX_API_URL}/requirement_groups/${id}`, {
      headers: {
        Authorization: `Bearer ${TELNYX_API_KEY}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get requirement group: ${errorText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error getting requirement group:", error);
    throw error;
  }
}

export async function submitRequirementGroup(id: string) {
  if (!TELNYX_API_KEY) throw new Error("TELNYX_API_KEY is not set");

  try {
    const response = await fetch(
      `${TELNYX_API_URL}/requirement_groups/${id}/submit`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TELNYX_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Telnyx submit RG error:", errorText);
      throw new Error(`Failed to submit requirement group: ${errorText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error submitting requirement group:", error);
    throw error;
  }
}
