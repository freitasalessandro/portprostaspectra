import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { proposal_identifier, code } = await req.json();

    if (!proposal_identifier || !code) {
      return new Response(
        JSON.stringify({ valid: false, error: "proposal_identifier e code são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find proposal by slug or UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(proposal_identifier);
    let query = supabase.from("proposals").select("id, access_code");
    if (isUuid) {
      query = query.eq("id", proposal_identifier);
    } else {
      query = query.eq("slug", proposal_identifier);
    }

    const { data: proposal, error } = await query.single();

    if (error || !proposal) {
      return new Response(
        JSON.stringify({ valid: false, error: "Proposta não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const valid = proposal.access_code === code.trim();

    return new Response(
      JSON.stringify({ valid }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-access-code error:", err);
    return new Response(
      JSON.stringify({ valid: false, error: err.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
