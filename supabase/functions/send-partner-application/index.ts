// supabase/functions/send-partner-application/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'npm:resend'

// Pega as chaves secretas que vamos configurar
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const TO_EMAIL_ADDRESS = Deno.env.get('TO_EMAIL_ADDRESS')
const resend = new Resend(RESEND_API_KEY)

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Método não permitido', { status: 405 });
  }

  try {
    const { name, email, channelUrl, message } = await req.json()

    // Envia o e-mail usando o Resend
    await resend.emails.send({
      from: 'Dark Stream <onboarding@resend.dev>',
      to: TO_EMAIL_ADDRESS,
      subject: `Nova Aplicação de Parceiro: ${name}`,
      html: `
        <h2>Nova aplicação recebida!</h2>
        <p><strong>Nome/Canal:</strong> ${name}</p>
        <p><strong>E-mail de Contato:</strong> ${email}</p>
        <p><strong>Link do Canal:</strong> <a href="${channelUrl}">${channelUrl}</a></p>
        <p><strong>Mensagem:</strong></p>
        <p>${message || 'Nenhuma mensagem adicional.'}</p>
      `
    })

    return new Response(JSON.stringify({ message: 'Aplicação enviada com sucesso!' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})