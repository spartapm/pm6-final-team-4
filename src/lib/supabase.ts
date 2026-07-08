import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tepjmaehpbyghqcsmwur.supabase.co";
const supabasePublishableKey = "sb_publishable_T7A5YYkE2pp9fiX_Y385Tw_4V-dQPf_";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    persistSession: true,
  },
});
