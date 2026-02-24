import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autorizado" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !caller) return json({ error: "Token inválido" }, 401);

    // Check admin
    const { data: roleCheck } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleCheck) return json({ error: "Apenas admins podem gerenciar usuários" }, 403);

    const body = await req.json();
    const { action } = body;

    // INVITE
    if (action === "invite") {
      const { email, role, display_name } = body;
      if (!email) return json({ error: "E-mail é obrigatório" }, 400);

      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: display_name || "" },
      });

      if (inviteError) return json({ error: inviteError.message }, 400);

      if (inviteData?.user) {
        await supabaseAdmin.from("user_roles").upsert(
          { user_id: inviteData.user.id, role: role || "viewer" },
          { onConflict: "user_id,role" }
        );
      }

      return json({ success: true, user: inviteData?.user });
    }

    // CREATE (direct with email/password)
    if (action === "create") {
      const { email, password, role, display_name } = body;
      if (!email || !password) return json({ error: "E-mail e senha são obrigatórios" }, 400);
      if (password.length < 6) return json({ error: "Senha deve ter pelo menos 6 caracteres" }, 400);

      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: display_name || "" },
      });

      if (createError) return json({ error: createError.message }, 400);

      if (createData?.user) {
        await supabaseAdmin.from("user_roles").upsert(
          { user_id: createData.user.id, role: role || "viewer" },
          { onConflict: "user_id,role" }
        );
      }

      return json({ success: true, user: createData?.user });
    }

    // DELETE
    if (action === "delete") {
      const { user_id } = body;
      if (!user_id) return json({ error: "user_id obrigatório" }, 400);
      if (user_id === caller.id) return json({ error: "Você não pode remover a si mesmo" }, 400);

      const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (delError) return json({ error: delError.message }, 400);

      return json({ success: true });
    }

    // UPDATE ROLE
    if (action === "update_role") {
      const { user_id, new_role } = body;
      if (!user_id || !new_role) return json({ error: "user_id e new_role obrigatórios" }, 400);

      // Remove existing roles and set new one
      await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
      const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
        user_id,
        role: new_role,
      });

      if (roleError) return json({ error: roleError.message }, 400);
      return json({ success: true });
    }

    return json({ error: "Ação não reconhecida" }, 400);
  } catch (err) {
    console.error("manage-users error:", err);
    return json({ error: err.message || "Erro interno" }, 500);
  }
});
