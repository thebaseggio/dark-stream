import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'npm:resend'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const TO_EMAIL_ADDRESS = Deno.env.get('TO_EMAIL_ADDRESS')
const resend = new Resend(RESEND_API_KEY)

const RATE_LIMIT = 3
const RATE_WINDOW_MS = 60 * 60 * 1000
const rateLimitMap = new Map<string, number[]>()

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = (rateLimitMap.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS)

  if (timestamps.length >= RATE_LIMIT) {
    rateLimitMap.set(ip, timestamps)
    return true
  }

  timestamps.push(now)
  rateLimitMap.set(ip, timestamps)
  return false
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405)
  }

  if (!RESEND_API_KEY || !TO_EMAIL_ADDRESS) {
    console.error('Secrets RESEND_API_KEY ou TO_EMAIL_ADDRESS não configurados.')
    return jsonResponse({ error: 'Serviço temporariamente indisponível.' }, 503)
  }

  const clientIp = getClientIp(req)
  if (isRateLimited(clientIp)) {
    return jsonResponse({ error: 'Muitas tentativas. Tente novamente mais tarde.' }, 429)
  }

  try {
    const body = await req.json()
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim()
    const channelUrl = String(body.channelUrl ?? '').trim()
    const message = String(body.message ?? '').trim()

    if (!name || name.length > 120) {
      return jsonResponse({ error: 'Nome/canal inválido (máx. 120 caracteres).' }, 400)
    }

    if (!isValidEmail(email)) {
      return jsonResponse({ error: 'E-mail inválido.' }, 400)
    }

    if (!channelUrl || !isValidHttpUrl(channelUrl) || channelUrl.length > 500) {
      return jsonResponse({ error: 'Link do canal inválido.' }, 400)
    }

    if (message.length > 2000) {
      return jsonResponse({ error: 'Mensagem muito longa (máx. 2000 caracteres).' }, 400)
    }

    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeChannelUrl = escapeHtml(channelUrl)
    const safeMessage = escapeHtml(message || 'Nenhuma mensagem adicional.')

    await resend.emails.send({
      from: 'Dark Stream <onboarding@resend.dev>',
      to: TO_EMAIL_ADDRESS,
      subject: `Nova Aplicação de Parceiro: ${name}`,
      reply_to: email,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333;">Nova aplicação de Parceiro recebida!</h2>
            <hr style="border-top: 1px solid #ddd; border-bottom: none;">
            <p style="color: #555;"><strong>Nome/Canal:</strong> ${safeName}</p>
            <p style="color: #555;"><strong>E-mail de Contato:</strong> ${safeEmail}</p>
            <p style="color: #555;"><strong>Link do Canal:</strong> <a href="${safeChannelUrl}" style="color: #8e44ad;">${safeChannelUrl}</a></p>
            <p style="color: #555;"><strong>Mensagem:</strong></p>
            <p style="background-color: #f9f9f9; border-left: 4px solid #ccc; padding: 10px; color: #555;">
              ${safeMessage}
            </p>
          </div>
        </div>
      `,
    })

    return jsonResponse({ message: 'Aplicação enviada com sucesso!' }, 200)
  } catch (error) {
    console.error('Erro ao processar candidatura:', error)
    return jsonResponse({ error: 'Não foi possível enviar a candidatura.' }, 500)
  }
})
