import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith("http")
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Subscribe to Supabase table changes if configured
 */
export function subscribeToSupabaseTable(table, onInsert, onUpdate, onDelete) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`public:${table}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      (payload) => {
        if (payload.eventType === "INSERT" && onInsert) onInsert(payload.new);
        if (payload.eventType === "UPDATE" && onUpdate) onUpdate(payload.new);
        if (payload.eventType === "DELETE" && onDelete) onDelete(payload.old);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

