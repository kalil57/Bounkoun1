import { createClient } from "@supabase/supabase-js";

// Auth operations (signup/login) use the anon key, not the service
// role key, since these are actions a normal end-user is allowed to do.
export const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
