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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Evolution API settings (atendimento instance)
    const { data: settings } = await supabase
      .from("company_settings")
      .select("atendimento_api_url, atendimento_api_token, atendimento_api_instance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!settings?.atendimento_api_url || !settings?.atendimento_api_token || !settings?.atendimento_api_instance) {
      return new Response(JSON.stringify({ error: "Evolution API não configurada", updated: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get contacts without names
    const { data: contatos } = await supabase
      .from("contatos")
      .select("id, whatsapp_number")
      .eq("user_id", user.id)
      .is("nome", null);

    if (!contatos || contatos.length === 0) {
      return new Response(JSON.stringify({ updated: 0, message: "Todos os contatos já têm nome" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = settings.atendimento_api_url.replace(/\/$/, "");
    const instance = settings.atendimento_api_instance;
    const apiKey = settings.atendimento_api_token;
    let updated = 0;

    // Fetch profiles from Evolution API in batches
    for (const contato of contatos) {
      try {
        const jid = contato.whatsapp_number.includes("@")
          ? contato.whatsapp_number
          : `${contato.whatsapp_number}@s.whatsapp.net`;

        const res = await fetch(`${baseUrl}/chat/fetchProfile/${instance}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: apiKey,
          },
          body: JSON.stringify({ number: contato.whatsapp_number }),
        });

        if (res.ok) {
          const data = await res.json();
          const name = data?.name || data?.pushName || data?.notify || null;

          if (name) {
            await supabase
              .from("contatos")
              .update({ nome: name })
              .eq("id", contato.id);
            updated++;
          }
        }
      } catch (err) {
        console.error(`Error fetching profile for ${contato.whatsapp_number}:`, err);
      }
    }

    return new Response(JSON.stringify({ updated, total: contatos.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Sync error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
