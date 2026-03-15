SELECT 
    l.id as location_id,
    l.name as location_name,
    -- STEP 1: Documents
    l.regulatory_requirement_id as reg_req_id,
    r.status as reg_req_status,
    CASE WHEN r.status IN ('approved', 'pending', 'unapproved') THEN 'OK (Superato)' ELSE 'MANCANTE' END as step1_documents,
    -- STEP 2: Phone
    l.telnyx_phone_number as phone_number,
    CASE WHEN l.telnyx_phone_number IS NOT NULL THEN 'OK (Superato)' ELSE 'MANCANTE' END as step2_phone,
    -- STEP 3: Voice App
    l.telnyx_voice_app_id as voice_app_id,
    CASE WHEN l.telnyx_voice_app_id IS NOT NULL THEN 'OK (Superato)' ELSE 'MANCANTE' END as step3_voice,
    -- STEP 4: Branding
    l.branding->>'logo_url' as branding_logo_url,
    CASE WHEN (l.branding->>'logo_url') IS NOT NULL THEN 'OK (Superato)' ELSE 'MANCANTE' END as step4_branding,
    -- STEP 5: Test
    o.whatsapp_usage_count as whatsapp_count,
    CASE WHEN COALESCE(o.whatsapp_usage_count, 0) > 0 THEN 'OK (Superato)' ELSE 'MANCANTE' END as step5_test
FROM locations l
JOIN organizations o ON l.organization_id = o.id
LEFT JOIN telnyx_regulatory_requirements r ON l.regulatory_requirement_id = r.id
WHERE o.id = '122ad2c5-b7f2-4ecd-9b96-990508a41485';
