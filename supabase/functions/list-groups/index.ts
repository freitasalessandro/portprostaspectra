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

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const settingsCols = "atendimento_api_url, atendimento_api_instance, atendimento_api_token";
    const hasConfig = (s: any) => Boolean(s?.atendimento_api_url && s?.atendimento_api_instance && s?.atendimento_api_token);

    let settings: any = null;
    const { data: ownSettings } = await supabase
      .from("company_settings")
      .select(settingsCols)
      .eq("user_id", user.id)
      .maybeSingle();
    if (hasConfig(ownSettings)) settings = ownSettings;

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
      return new Response(JSON.stringify({ groups: [], error: "Instância não configurada" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = evoUrl.replace(/\/+$/, "");

    const resp = await fetch(
      `${baseUrl}/group/fetchAllGroups/${evoInstance}?getParticipants=false`,
      { headers: { apikey: evoToken } }
    );

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Evolution fetchAllGroups error:", resp.status, text);
      return new Response(JSON.stringify({ groups: [], error: `API retornou ${resp.status}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();

    // Evolution API returns an array of group objects
    const groups = (Array.isArray(data) ? data : []).map((g: any) => ({
      id: g.id, // JID e.g. "123456@g.us"
      subject: g.subject || g.name || g.id,
      size: g.size || g.participants?.length || 0,
    }));

    return new Response(JSON.stringify({ groups }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("list-groups error:", err);
    return new Response(JSON.stringify({ groups: [], error: "Falha ao buscar grupos" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
