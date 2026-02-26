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

    const settingsCols = "atendimento_api_url, atendimento_api_instance, atendimento_api_token";
    const hasConfig = (s: any) => Boolean(s?.atendimento_api_url && s?.atendimento_api_instance && s?.atendimento_api_token);

    // 1. Try current user's settings
    let settings: any = null;
    const { data: ownSettings } = await supabase
      .from("company_settings")
      .select(settingsCols)
      .eq("user_id", userId)
      .maybeSingle();
    if (hasConfig(ownSettings)) settings = ownSettings;

    // 2. Fallback: admin settings
    if (!settings) {
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      const adminIds = (adminRoles ?? []).map((r: any) => r.user_id).filter(Boolean);
      if (adminIds.length > 0) {
        const { data: adminSettings } = await supabase
          .from("company_settings")
          .select(settingsCols)
          .in("user_id", adminIds)
          .not("atendimento_api_url", "is", null)
          .not("atendimento_api_instance", "is", null)
          .not("atendimento_api_token", "is", null)
          .limit(1)
          .maybeSingle();
        if (hasConfig(adminSettings)) settings = adminSettings;
      }
    }

    const evoUrl = settings?.atendimento_api_url;
    const evoInstance = settings?.atendimento_api_instance;
    const evoToken = settings?.atendimento_api_token;

    if (!evoUrl || !evoInstance || !evoToken) {
      return new Response(JSON.stringify({ connected: false, error: "Instância WhatsApp de atendimento não configurada" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = evoUrl.replace(/\/+$/, "");

    const resp = await fetch(
      `${baseUrl}/instance/connectionState/${evoInstance}`,
      { headers: { apikey: evoToken } }
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
