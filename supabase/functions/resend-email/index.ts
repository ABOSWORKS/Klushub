import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type EmailPayload = {
  klus_id?: string;
  beheer_token?: string;
  email_klant?: string;
  omschrijving?: string;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

function getManageUrl(payload: Required<Pick<EmailPayload, "klus_id" | "beheer_token">>, req: Request) {
  const appBaseUrl = Deno.env.get("APP_BASE_URL")?.trim();
  if (appBaseUrl) {
    return `${appBaseUrl.replace(/\/$/, "")}/?beheer=${encodeURIComponent(payload.klus_id)}&token=${encodeURIComponent(payload.beheer_token)}`;
  }
  const origin = req.headers.get("origin") || req.headers.get("referer") || "https://klushub.nl";
  const safeOrigin = origin.replace(/\/$/, "");
  return `${safeOrigin}/?beheer=${encodeURIComponent(payload.klus_id)}&token=${encodeURIComponent(payload.beheer_token)}`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return jsonResponse(405, { ok: false, error: "Method not allowed" });

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const emailFrom = Deno.env.get("EMAIL_FROM") || "Klushub <noreply@klushub.nl>";
  if (!resendApiKey) return jsonResponse(500, { ok: false, error: "Missing RESEND_API_KEY secret" });

  let payload: EmailPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(400, { ok: false, error: "Invalid JSON body" });
  }

  const klusId = String(payload.klus_id || "").trim();
  const beheerToken = String(payload.beheer_token || "").trim();
  const emailKlant = String(payload.email_klant || "").trim();
  const omschrijving = String(payload.omschrijving || "").trim();

  if (!klusId || !beheerToken || !emailKlant) {
    return jsonResponse(400, {
      ok: false,
      error: "Missing required fields: klus_id, beheer_token, email_klant",
    });
  }

  const manageUrl = getManageUrl({ klus_id: klusId, beheer_token: beheerToken }, req);
  const subject = "Je klus is geplaatst - beheerlink Klushub";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0b1f4a">
      <h2 style="margin-bottom:8px">Je klus staat live op Klushub</h2>
      <p style="margin:0 0 12px 0">Bedankt! Je klus is succesvol geplaatst.</p>
      <p style="margin:0 0 16px 0"><strong>Omschrijving:</strong> ${omschrijving || "Niet opgegeven"}</p>
      <p style="margin:0 0 8px 0">Beheer je klus via deze beveiligde link:</p>
      <p style="margin:0 0 16px 0"><a href="${manageUrl}" style="color:#2E5FBE">${manageUrl}</a></p>
      <p style="margin:0">Tip: bewaar deze e-mail zodat je later altijd terug kunt naar je beheerpagina.</p>
    </div>
  `;

  const resendResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [emailKlant],
      subject,
      html,
    }),
  });

  const resendData = await resendResp.json().catch(() => ({}));
  if (!resendResp.ok) {
    return jsonResponse(502, {
      ok: false,
      error: "Resend API failed",
      details: resendData,
    });
  }

  return jsonResponse(200, {
    ok: true,
    emailStatus: "sent",
    resend: resendData,
    manageUrl,
  });
});

