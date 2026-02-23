import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = user.id;

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: settings } = await supabase
      .from("company_settings")
      .select("evolution_api_url, evolution_api_instance, evolution_api_token")
      .eq("user_id", userId)
      .single();

    if (!settings?.evolution_api_url || !settings?.evolution_api_instance || !settings?.evolution_api_token) {
      return new Response(JSON.stringify({ connected: false, error: "Evolution API não configurada" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Remove trailing slash from URL to avoid double-slash
    const baseUrl = settings.evolution_api_url.replace(/\/+$/, "");

    const resp = await fetch(
      `${baseUrl}/instance/connectionState/${settings.evolution_api_instance}`,
      { headers: { apikey: settings.evolution_api_token } }
    );

    const data = await resp.json();
    const connected = data?.instance?.state === "open";

    return new Response(JSON.stringify({ connected, state: data?.instance?.state || null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Evolution status error:", err);
    return new Response(JSON.stringify({ connected: false, error: "Falha ao verificar conexão" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
