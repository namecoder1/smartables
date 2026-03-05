import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function check() {
  const { data, error } = await supabase.from('locations').select('telnyx_phone_number, activation_status, voice_forwarding_number, is_test_completed').eq('telnyx_phone_number', '+3907211640282')
  console.log("DB Result:", data, error)
  const { data: reqs } = await supabase.from('telnyx_regulatory_requirements').select('*').limit(5)
  console.log("Reqs:", reqs)
}
check()
