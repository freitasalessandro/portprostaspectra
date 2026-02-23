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

    // Get atendimento Evolution API config
    const { data: settings } = await supabase
      .from("company_settings")
      .select("atendimento_api_url, atendimento_api_instance, atendimento_api_token")
      .eq("user_id", userId)
      .single();

    const evoUrl = settings?.atendimento_api_url?.replace(/\/+$/, "");
    const evoInstance = settings?.atendimento_api_instance;
    const evoToken = settings?.atendimento_api_token;

    if (!evoUrl || !evoInstance || !evoToken) {
      return new Response(JSON.stringify({ error: "Instância WhatsApp não configurada" }), { status: 400, headers: corsHeaders });
    }

    // 1. Fetch all chats from Evolution API
    console.log("Fetching chats from Evolution API...");
    const chatsRes = await fetch(`${evoUrl}/chat/findChats/${evoInstance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoToken },
      body: JSON.stringify({}),
    });

    if (!chatsRes.ok) {
      const errText = await chatsRes.text();
      console.error("Failed to fetch chats:", errText);
      return new Response(JSON.stringify({ error: "Falha ao buscar conversas da instância", details: errText }), { status: 500, headers: corsHeaders });
    }

    const chats = await chatsRes.json();
    const chatArray = Array.isArray(chats) ? chats : [];
    console.log(`Found ${chatArray.length} chats`);

    // Log first chat structure for debugging
    if (chatArray.length > 0) {
      console.log("Sample chat keys:", JSON.stringify(Object.keys(chatArray[0])));
      console.log("Sample chat:", JSON.stringify(chatArray[0]).substring(0, 500));
    }

    // Filter only individual chats (not groups) - check multiple possible field names
    const individualChats = chatArray.filter((c: any) => {
      const jid = c.id || c.remoteJid || c.jid || c.chatId || "";
      return jid.endsWith("@s.whatsapp.net");
    });

    console.log(`${individualChats.length} individual chats to process`);

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const chat of individualChats) {
      try {
        const remoteJid = chat.id || chat.remoteJid || chat.jid || chat.chatId || "";
        const waNumber = remoteJid.replace("@s.whatsapp.net", "");

        if (!waNumber || waNumber.length < 10) {
          skipped++;
          continue;
        }

        // Check if ticket already exists for this number
        const { data: existingTickets } = await supabase
          .from("tickets")
          .select("id")
          .eq("user_id", userId)
          .eq("whatsapp_number", waNumber)
          .limit(1);

        if (existingTickets && existingTickets.length > 0) {
          skipped++;
          continue;
        }

        // Create or find contact
        const contactName = chat.name || chat.pushName || null;
        const { data: contato } = await supabase
          .from("contatos")
          .upsert(
            { whatsapp_number: waNumber, nome: contactName, user_id: userId },
            { onConflict: "whatsapp_number" }
          )
          .select()
          .single();

        if (!contato) {
          errors.push(`Falha ao criar contato: ${waNumber}`);
          continue;
        }

        // Create ticket as ENCERRADO
        const { data: ticket, error: ticketErr } = await supabase
          .from("tickets")
          .insert({
            whatsapp_number: waNumber,
            contato_id: contato.id,
            user_id: userId,
            status: "ENCERRADO",
            closed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (ticketErr || !ticket) {
          errors.push(`Falha ao criar ticket: ${waNumber} - ${ticketErr?.message}`);
          continue;
        }

        // 2. Fetch messages for this chat
        const msgsRes = await fetch(`${evoUrl}/chat/findMessages/${evoInstance}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: evoToken },
          body: JSON.stringify({
            where: { key: { remoteJid } },
            limit: 100,
          }),
        });

        if (msgsRes.ok) {
          const messages = await msgsRes.json();
          const msgArray = Array.isArray(messages) ? messages : messages?.messages || [];

          const dbMessages = [];
          for (const msg of msgArray) {
            const isFromMe = msg.key?.fromMe === true;
            const sentido = isFromMe ? "SAIDA" : "ENTRADA";

            let tipo = "TEXT";
            let conteudo: string | null = null;
            let midiaUrl: string | null = null;

            if (msg.message?.conversation) {
              conteudo = msg.message.conversation;
            } else if (msg.message?.extendedTextMessage?.text) {
              conteudo = msg.message.extendedTextMessage.text;
            } else if (msg.message?.imageMessage) {
              tipo = "IMAGE";
              conteudo = msg.message.imageMessage.caption || null;
              midiaUrl = msg.message.imageMessage.url || null;
            } else if (msg.message?.audioMessage) {
              tipo = "AUDIO";
              midiaUrl = msg.message.audioMessage.url || null;
            } else if (msg.message?.videoMessage) {
              tipo = "VIDEO";
              conteudo = msg.message.videoMessage.caption || null;
              midiaUrl = msg.message.videoMessage.url || null;
            } else if (msg.message?.documentMessage) {
              tipo = "DOCUMENT";
              conteudo = msg.message.documentMessage.fileName || null;
              midiaUrl = msg.message.documentMessage.url || null;
            } else {
              // Skip unsupported message types
              continue;
            }

            const timestamp = msg.messageTimestamp
              ? new Date(typeof msg.messageTimestamp === "number" ? msg.messageTimestamp * 1000 : parseInt(msg.messageTimestamp) * 1000).toISOString()
              : new Date().toISOString();

            dbMessages.push({
              ticket_id: ticket.id,
              sentido,
              tipo,
              conteudo,
              midia_url: midiaUrl,
              evolution_id: msg.key?.id || null,
              timestamp_wa: timestamp,
              created_at: timestamp,
              status_envio: isFromMe ? "ENVIADO" : null,
            });
          }

          if (dbMessages.length > 0) {
            // Insert in batches of 50
            for (let i = 0; i < dbMessages.length; i += 50) {
              const batch = dbMessages.slice(i, i + 50);
              await supabase.from("mensagens").insert(batch);
            }
          }
        }

        imported++;
      } catch (chatErr) {
        console.error("Error processing chat:", chatErr);
        errors.push(`Erro ao processar: ${chat.id}`);
      }
    }

    console.log(`Sync complete: ${imported} imported, ${skipped} skipped, ${errors.length} errors`);

    return new Response(JSON.stringify({
      success: true,
      imported,
      skipped,
      total: individualChats.length,
      errors: errors.slice(0, 10),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Sync error:", err);
    return new Response(JSON.stringify({ error: "Internal error", details: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
