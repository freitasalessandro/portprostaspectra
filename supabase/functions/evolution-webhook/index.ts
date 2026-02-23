import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const body = await req.json();
    const event = body.event;

    // Always return 200 to prevent Evolution API retries
    if (event === "messages.upsert") {
      const msg = body.data;
      if (!msg || !msg.key) return new Response("ok", { headers: corsHeaders });

      const remoteJid = msg.key.remoteJid?.replace("@s.whatsapp.net", "") || "";
      const isFromMe = msg.key.fromMe === true;
      const messageId = msg.key.id;
      const pushName = msg.pushName || null;
      const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
      const instanceOwner = body.instance?.owner || "";

      if (!remoteJid || isFromMe) {
        return new Response("ok", { headers: corsHeaders });
      }

      // Find the owner user (the one who set up this Evolution instance)
      const { data: settings } = await supabase
        .from("company_settings")
        .select("user_id")
        .limit(1)
        .single();

      if (!settings) return new Response("no settings", { headers: corsHeaders });
      const ownerId = settings.user_id;

      // Upsert contato
      const { data: contato } = await supabase
        .from("contatos")
        .upsert(
          { whatsapp_number: remoteJid, nome: pushName, user_id: ownerId },
          { onConflict: "whatsapp_number", ignoreDuplicates: false }
        )
        .select("id")
        .single();

      if (!contato) return new Response("contato error", { headers: corsHeaders });

      // Find open ticket or create new
      const { data: existingTicket } = await supabase
        .from("tickets")
        .select("id")
        .eq("contato_id", contato.id)
        .in("status", ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let ticketId: string;

      if (existingTicket) {
        ticketId = existingTicket.id;
      } else {
        const { data: newTicket, error: ticketError } = await supabase
          .from("tickets")
          .insert({
            contato_id: contato.id,
            whatsapp_number: remoteJid,
            user_id: ownerId,
            status: "ABERTO",
          })
          .select("id")
          .single();

        if (ticketError || !newTicket) {
          console.error("Ticket error:", ticketError);
          return new Response("ticket error", { headers: corsHeaders });
        }
        ticketId = newTicket.id;

        // Increment total_tickets on contato
        await supabase.rpc("increment_total_tickets" as any, { contato_id: contato.id }).catch(() => {});
      }

      // Insert message
      await supabase.from("mensagens").insert({
        ticket_id: ticketId,
        evolution_id: messageId,
        sentido: "ENTRADA",
        tipo: "TEXT",
        conteudo: messageText,
        timestamp_wa: new Date().toISOString(),
        status_envio: "ENTREGUE",
      });

      return new Response("ok", { headers: corsHeaders });
    }

    if (event === "messages.update") {
      const updates = body.data;
      if (Array.isArray(updates)) {
        for (const upd of updates) {
          const messageId = upd.key?.id;
          if (!messageId) continue;
          const status = upd.update?.status;
          let statusEnvio = null;
          if (status === 2) statusEnvio = "ENVIADO";
          else if (status === 3) statusEnvio = "ENTREGUE";
          else if (status === 4) statusEnvio = "LIDO";

          if (statusEnvio) {
            await supabase
              .from("mensagens")
              .update({ status_envio: statusEnvio })
              .eq("evolution_id", messageId);
          }
        }
      }
      return new Response("ok", { headers: corsHeaders });
    }

    return new Response("ok", { headers: corsHeaders });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("ok", { headers: corsHeaders });
  }
});
