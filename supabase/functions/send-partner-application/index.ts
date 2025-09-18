import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'npm:resend'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const TO_EMAIL_ADDRESS = Deno.env.get('TO_EMAIL_ADDRESS')
const resend = new Resend(RESEND_API_KEY)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, channelUrl, message } = await req.json()

    // Envia o e-mail usando o Resend
    await resend.emails.send({
      from: 'Dark Stream <onboarding@resend.dev>',
      to: TO_EMAIL_ADDRESS,
      subject: `Nova Aplicação de Parceiro: ${name}`,
      
      // ✨ CORREÇÃO 1: Adiciona o e-mail do candidato no "Responder Para" ✨
      reply_to: email,

      // ✨ CORREÇÃO 2: Adiciona o conteúdo HTML completo no corpo do e-mail ✨
      html: `
        <div style="font-family: sans-serif; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333;">Nova aplicação de Parceiro recebida!</h2>
            <hr style="border-top: 1px solid #ddd; border-bottom: none;">
            <p style="color: #555;"><strong>Nome/Canal:</strong> ${name}</p>
            <p style="color: #555;"><strong>E-mail de Contato:</strong> ${email}</p>
            <p style="color: #555;"><strong>Link do Canal:</strong> <a href="${channelUrl}" style="color: #8e44ad;">${channelUrl}</a></p>
            <p style="color: #555;"><strong>Mensagem:</strong></p>
            <p style="background-color: #f9f9f9; border-left: 4px solid #ccc; padding: 10px; color: #555;">
              ${message || 'Nenhuma mensagem adicional.'}
            </p>
          </div>
        </div>
      `
    })

    return new Response(JSON.stringify({ message: 'Aplicação enviada com sucesso!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})