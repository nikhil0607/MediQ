import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export let supabase = null;

if (supabaseUrl && supabaseKey && supabaseUrl.startsWith("http")) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    console.log("✅ Supabase client successfully initialized for MediQ.");
  } catch (err) {
    console.warn("⚠️ Failed to initialize Supabase client:", err.message);
    supabase = null;
  }
} else {
  console.log("ℹ️ MediQ running with internal reactive data store (Supabase credentials not configured).");
}

