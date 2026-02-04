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
