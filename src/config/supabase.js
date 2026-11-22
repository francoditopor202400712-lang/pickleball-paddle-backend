
import { createClient } from "@supabase/supabase-js";

const {
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_ANON_KEY
} = process.env;

const publicKey = SUPABASE_PUBLISHABLE_KEY || SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !publicKey) {
  throw new Error("Missing Supabase environment variables");
}

const options = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
};

// Server database client: never sign users into this client.
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  options
);

// Isolated authentication client.
export const createAuthClient = () =>
  createClient(SUPABASE_URL, publicKey, options);
