import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractMessageContent(msg: any): { tipo: string; conteudo: string; midiaUrl: string | null } {
  const message = msg.message;
  if (!message) return { tipo: "TEXT", conteudo: "", midiaUrl: null };

  // Text messages
  if (message.conversation) return { tipo: "TEXT", conteudo: message.conversation, midiaUrl: null };
  if (message.extendedTextMessage?.text) return { tipo: "TEXT", conteudo: message.extendedTextMessage.text, midiaUrl: null };

  // Image
  if (message.imageMessage) {
    const caption = message.imageMessage.caption || "";
    const url = message.imageMessage.url || msg.mediaUrl || null;
    return { tipo: "IMAGE", conteudo: caption, midiaUrl: url };
  }

  // Video
  if (message.videoMessage) {
    const caption = message.videoMessage.caption || "";
    const url = message.videoMessage.url || msg.mediaUrl || null;
    return { tipo: "VIDEO", conteudo: caption, midiaUrl: url };
  }

  // Audio / PTT (voice note)
  if (message.audioMessage) {
    const url = message.audioMessage.url || msg.mediaUrl || null;
    return { tipo: "AUDIO", conteudo: "", midiaUrl: url };
  }

  // Document
  if (message.documentMessage) {
    const fileName = message.documentMessage.fileName || "Documento";
    const url = message.documentMessage.url || msg.mediaUrl || null;
    return { tipo: "DOCUMENT", conteudo: fileName, midiaUrl: url };
  }

  // Sticker (treat as image)
  if (message.stickerMessage) {
    const url = message.stickerMessage.url || msg.mediaUrl || null;
    return { tipo: "IMAGE", conteudo: "", midiaUrl: url };
  }

  // Fallback: any text-like content
  return { tipo: "TEXT", conteudo: "", midiaUrl: null };
}

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
    const instanceName = body.instance || body.instanceName || body.instance_name || null;
    console.log("Webhook event:", event, "instance:", instanceName);

    // Resolve owner by matching the instance name to company_settings
    async function resolveOwner(): Promise<string | null> {
      if (instanceName) {
        // First check atendimento instance (chat/support)
        const { data: atendimentoMatch } = await supabase
          .from("company_settings")
          .select("user_id")
          .eq("atendimento_api_instance", instanceName)
          .limit(1)
          .maybeSingle();
        if (atendimentoMatch) return atendimentoMatch.user_id;

        // Then check proposals instance
        const { data: proposalMatch } = await supabase
          .from("company_settings")
          .select("user_id")
          .eq("evolution_api_instance", instanceName)
          .limit(1)
          .maybeSingle();
        if (proposalMatch) return proposalMatch.user_id;
      }
      // Fallback: single-tenant (first record)
      const { data } = await supabase
        .from("company_settings")
        .select("user_id")
        .limit(1)
        .single();
      return data?.user_id || null;
    }

    // Always return 200 to prevent Evolution API retries
    if (event === "messages.upsert") {
      const msg = body.data;
      if (!msg || !msg.key) return new Response("ok", { headers: corsHeaders });

      const remoteJid = msg.key.remoteJid || "";
      const isGroup = remoteJid.endsWith("@g.us");
      const isFromMe = msg.key.fromMe === true;
      const messageId = msg.key.id;
      const pushName = msg.pushName || null;

      // Skip own messages and empty JIDs
      if (!remoteJid || isFromMe) {
        console.log("Skipping:", isFromMe ? "own message" : "empty jid");
        return new Response("ok", { headers: corsHeaders });
      }

      const ownerId = await resolveOwner();
      if (!ownerId) return new Response("no settings", { headers: corsHeaders });

      // For group messages, check if group is allowed
      if (isGroup) {
        const { data: allowedGroup } = await supabase
          .from("allowed_groups")
          .select("id")
          .eq("user_id", ownerId)
          .eq("group_jid", remoteJid)
          .eq("ativo", true)
          .maybeSingle();

        if (!allowedGroup) {
          console.log("Skipping: group not allowed", remoteJid);
          return new Response("ok", { headers: corsHeaders });
        }
        console.log("Processing allowed group message:", remoteJid);
      }

      // For groups, keep the full JID so send-message can route correctly; for private chats, strip suffix
      const cleanNumber = isGroup
        ? remoteJid
        : remoteJid.replace("@s.whatsapp.net", "");

      // Extract message content (text, image, audio, video, document)
      const { tipo, conteudo, midiaUrl } = extractMessageContent(msg);

      // Skip empty messages
      if (!conteudo && !midiaUrl) {
        console.log("Skipping empty message");
        return new Response("ok", { headers: corsHeaders });
      }

      // For groups, try to get group name from metadata; for private, use pushName
      const groupSubject = isGroup ? (body.data?.groupMetadata?.subject || body.data?.pushName || remoteJid.replace("@g.us", "")) : null;
      const contactName = isGroup ? (groupSubject + " (Grupo)") : pushName;

      // Find or create contato, only update nome if pushName is present and contato has no name
      let contatoId: string;
      const { data: existingContato } = await supabase
        .from("contatos")
        .select("id, nome")
        .eq("whatsapp_number", cleanNumber)
        .maybeSingle();

      if (existingContato) {
        contatoId = existingContato.id;
        // Update name only if contact has no name and contactName is available
        if (!existingContato.nome && contactName) {
          await supabase.from("contatos").update({ nome: contactName }).eq("id", contatoId);
        }
      } else {
        const { data: newContato } = await supabase
          .from("contatos")
          .insert({ whatsapp_number: cleanNumber, nome: contactName, user_id: ownerId })
          .select("id")
          .single();
        if (!newContato) return new Response("contato error", { headers: corsHeaders });
        contatoId = newContato.id;
      }

      const contato = { id: contatoId };

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
        // Reopen if AGUARDANDO
        await supabase
          .from("tickets")
          .update({ status: "EM_ATENDIMENTO" })
          .eq("id", ticketId)
          .eq("status", "AGUARDANDO");
      } else {
        const { data: newTicket, error: ticketError } = await supabase
          .from("tickets")
          .insert({
            contato_id: contato.id,
            whatsapp_number: cleanNumber,
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
      }

      // Download media from Evolution API if we have a URL
      let finalMediaUrl = midiaUrl;
      if (midiaUrl && tipo !== "TEXT") {
        try {
          // Try to download and store in Supabase Storage
          const mediaRes = await fetch(midiaUrl);
          if (mediaRes.ok) {
            const blob = await mediaRes.blob();
            const ext = tipo === "IMAGE" ? "jpg" : tipo === "VIDEO" ? "mp4" : tipo === "AUDIO" ? "ogg" : "bin";
            const path = `${ticketId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
            
            const { error: uploadError } = await supabase.storage
              .from("chat-media")
              .upload(path, blob, { contentType: blob.type || "application/octet-stream", upsert: false });

            if (!uploadError) {
              const { data: urlData } = supabase.storage.from("chat-media").getPublicUrl(path);
              finalMediaUrl = urlData.publicUrl;
            } else {
              console.error("Media upload error:", uploadError);
            }
          }
        } catch (mediaErr) {
          console.error("Media download error:", mediaErr);
          // Keep original URL as fallback
        }
      }

      // Insert message
      const { error: msgError } = await supabase.from("mensagens").insert({
        ticket_id: ticketId,
        evolution_id: messageId,
        sentido: "ENTRADA",
        tipo,
        conteudo: conteudo || null,
        midia_url: finalMediaUrl,
        timestamp_wa: new Date().toISOString(),
        status_envio: "ENTREGUE",
      });

      if (msgError) console.error("Message insert error:", msgError);

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
