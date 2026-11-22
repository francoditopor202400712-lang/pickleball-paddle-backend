
import { createClient } from "@supabase/supabase-js";

const {
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_ANON_KEY
} = process.env;

const publicKey =
  SUPABASE_PUBLISHABLE_KEY || SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !publicKey) {
  throw new Error("Missing Supabase environment variables.");
}

const authOptions = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false
};

// Dedicated backend database client.
// Must use the actual Supabase server secret key.
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  { auth: authOptions }
);

// Create a fresh authentication client per request.
export function createAuthClient() {
  return createClient(SUPABASE_URL, publicKey, {
    auth: authOptions
  });
}
