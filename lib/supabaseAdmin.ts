import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// server-only client (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

