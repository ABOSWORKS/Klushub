/**
 * Supabase Edge Function: send-notification-email
 *
 * Location: Supabase Dashboard → Edge Functions → Create Function
 * Name: send-notification-email
 *
 * Setup Instructions:
 * 1. Copy this entire code
 * 2. Create new Edge Function in Supabase named: send-notification-email
 * 3. Paste this code
 * 4. Add secret: RESEND_API_KEY = your_resend_key_here
 * 5. Deploy
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Email template definitions
const emailTemplates = {
  job_posted: (data: any) => ({
    subject: `🎉 Je klus is geplaatst op Klushub!`,
    html: `
      <div style="font-family: 'Barlow Condensed', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 12px; border-top: 4px solid #F5C200;">
          <h2 style="color: #0B1F4A; margin-top: 0;">Gefeliciteerd! 🎉</h2>
          <p style="color: #5A6480; font-size: 16px;">Je klus <strong>"${escapeHtml(data.job_title)}"</strong> is nu zichtbaar voor aannemers!</p>

          <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #5A6480; font-size: 14px;">
              💡 <strong>Tip:</strong> Je krijgt gemiddeld 4-8 aanbiedingen binnen 24 uur
            </p>
          </div>

          <h3 style="color: #0B1F4A; margin-top: 25px;">Volgende stappen:</h3>
          <ol style="color: #5A6480;">
            <li>Ontvang aanbiedingen van erkende vakmannen</li>
            <li>Vergelijk prijzen, reviews en specialismes</li>
            <li>Kies de beste aannemer voor jouw klus</li>
            <li>Werk samen en geef feedback</li>
          </ol>

          <a href="${data.manage_link}" style="background: #F5C200; color: #0B1F4A; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 700; margin-top: 20px;">
            📋 Beheer je klus
          </a>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            © Klushub - Verbind klanten met vakmannen
          </p>
        </div>
      </div>
    `
  }),

  bid_received: (data: any) => ({
    subject: `💰 Nieuwe aanbieding van ${escapeHtml(data.contractor_name)}!`,
    html: `
      <div style="font-family: 'Barlow Condensed', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 12px; border-top: 4px solid #F5C200;">
          <h2 style="color: #0B1F4A; margin-top: 0;">Je hebt een nieuwe aanbieding! 💰</h2>

          <div style="background: #fffbf0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F5C200;">
            <p style="margin: 0 0 10px 0; color: #5A6480;"><strong>Van:</strong> ${escapeHtml(data.contractor_name)}</p>
            <p style="margin: 0 0 10px 0; color: #5A6480;"><strong>Voor:</strong> ${escapeHtml(data.job_title)}</p>
            <p style="margin: 0; color: #0B1F4A; font-size: 20px; font-weight: 700;">€ ${data.bid_amount}</p>
          </div>

          <p style="color: #5A6480; font-size: 14px;">
            Bekijk deze aanbieding en vergelijk met anderen. Je ontvangt waarschijnlijk meerdere aanbiedingen, dus neem de tijd om de beste keuze te maken.
          </p>

          <a href="${data.view_link}" style="background: #F5C200; color: #0B1F4A; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 700; margin-top: 20px;">
            👀 Bekijk aanbieding
          </a>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            © Klushub - Verbind klanten met vakmannen
          </p>
        </div>
      </div>
    `
  }),

  bid_accepted: (data: any) => ({
    subject: `🎊 Je bent gekozen! Nieuw project wacht!`,
    html: `
      <div style="font-family: 'Barlow Condensed', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 12px; border-top: 4px solid #16A34A;">
          <h2 style="color: #0B1F4A; margin-top: 0;">🎊 Gefeliciteerd! Je bent gekozen!</h2>

          <p style="color: #5A6480; font-size: 16px; margin: 20px 0;">
            <strong>${escapeHtml(data.customer_name)}</strong> heeft jouw aanbieding voor <strong>"${escapeHtml(data.job_title)}"</strong> geaccepteerd!
          </p>

          <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16A34A;">
            <h3 style="color: #16A34A; margin-top: 0;">Volgende stap:</h3>
            <p style="color: #5A6480; margin: 0;">
              Neem contact op met de klant om details af te spreken, een planning in te delen en de klus goed uit te voeren.
            </p>
          </div>

          <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #5A6480; font-size: 14px;">
              📅 <strong>Verwachte startdatum:</strong> ${escapeHtml(data.start_date)}
            </p>
          </div>

          <p style="color: #5A6480; font-size: 14px;">
            💡 <strong>Tip:</strong> Zorg voor goede communicatie en voer de klus op tijd uit. Dit leidt tot meer reviews en meer toekomstige klussen!
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            © Klushub - Verbind klanten met vakmannen
          </p>
        </div>
      </div>
    `
  }),

  review_posted: (data: any) => ({
    subject: `⭐ Je hebt een review gekregen!`,
    html: `
      <div style="font-family: 'Barlow Condensed', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 12px; border-top: 4px solid #F5C200;">
          <h2 style="color: #0B1F4A; margin-top: 0;">⭐ Je hebt een review gekregen!</h2>

          <div style="background: #fffbf0; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <div style="font-size: 28px; color: #F5C200; margin: 0 0 10px 0;">
              ${'⭐'.repeat(data.rating || 5)}
            </div>
            <p style="margin: 0; color: #0B1F4A; font-weight: 700; font-size: 18px;">
              ${data.rating || 5} van 5 sterren
            </p>
          </div>

          <p style="color: #5A6480; font-size: 14px; margin-top: 20px;">
            <strong>Voor project:</strong> ${escapeHtml(data.job_title)}
          </p>

          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F5C200;">
            <p style="margin: 0; color: #5A6480; font-style: italic;">
              "${escapeHtml(data.review_text)}"
            </p>
          </div>

          <p style="color: #5A6480; font-size: 14px; margin-top: 20px;">
            💡 Elke positieve review helpt je profiel sterker te maken. Klanten zien je gemiddelde score en reviews voordat ze je kiezen!
          </p>

          <a href="${data.profile_link}" style="background: #F5C200; color: #0B1F4A; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 700; margin-top: 20px;">
            👤 Bekijk je profiel
          </a>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            © Klushub - Verbind klanten met vakmannen
          </p>
        </div>
      </div>
    `
  })
}

// Escape HTML to prevent injection
function escapeHtml(text: string): string {
  if (!text) return ''
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    // Parse request
    const { type, recipient_email, data } = await req.json()

    // Validate input
    if (!type || !recipient_email || !data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: type, recipient_email, data' }),
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Validate email type
    const validTypes = Object.keys(emailTemplates)
    if (!validTypes.includes(type)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid email type. Valid types: ${validTypes.join(', ')}`
        }),
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipient_email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email address format' }),
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Get Resend API key from secrets
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured in function secrets')
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured' }),
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Generate email from template
    const template = emailTemplates[type as keyof typeof emailTemplates](data)

    // Call Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Klushub <onboarding@resend.dev>',
        to: recipient_email,
        subject: template.subject,
        html: template.html,
        reply_to: 'support@klushub.nl'
      })
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error(`Resend API error (${resendResponse.status}):`, resendData)
      return new Response(
        JSON.stringify({
          success: false,
          error: resendData.message || 'Failed to send email',
          details: resendData
        }),
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }

    console.log(`✅ Email sent successfully to ${recipient_email} (type: ${type}, id: ${resendData.id})`)

    return new Response(
      JSON.stringify({
        success: true,
        messageId: resendData.id,
        type: type,
        recipient: recipient_email
      }),
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    )
  } catch (error: any) {
    console.error('Function error:', error.message)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    )
  }
})
