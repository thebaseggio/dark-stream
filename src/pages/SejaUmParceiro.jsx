import React, { useState } from 'react';
import AnimatedPage from '../AnimatedPage';
import { supabase } from '../supabase';
import { useNotification } from '../contexts/NotificationProvider';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  sanitizeFormMessage,
  sanitizePlainText,
  sanitizeUsername,
} from '../utils/sanitizeText';

const FIELD_CLASS =
  'w-full bg-black/60 border border-zinc-800 focus:border-amber-500 text-zinc-100 font-mono text-sm px-4 py-3 outline-none rounded-none placeholder:text-zinc-600 transition-all';

const LABEL_CLASS =
  'mb-2 block font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-400';

export default function SejaUmParceiro() {
  const [formData, setFormData] = useState({ name: '', email: '', channelUrl: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showNotification } = useNotification();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const sanitizedBody = {
      name: sanitizeUsername(formData.name, 100),
      email: sanitizePlainText(formData.email, { maxLength: 254, allowNewlines: false }),
      channelUrl: sanitizePlainText(formData.channelUrl, { maxLength: 500, allowNewlines: false }),
      message: sanitizeFormMessage(formData.message),
    };

    const { error } = await supabase.functions.invoke('send-partner-application', {
      body: sanitizedBody,
    });

    if (error) {
      showNotification('error', 'Ocorreu um erro ao enviar sua inscrição. Tente novamente.');
      console.error('Erro ao chamar a Edge Function:', error);
    } else {
      showNotification('success', 'Obrigado pelo seu interesse! Entraremos em contato em breve.');
      setFormData({ name: '', email: '', channelUrl: '', message: '' });
    }

    setIsSubmitting(false);
  };

  return (
    <AnimatedPage className="min-h-screen bg-black text-white">
      <div className="min-h-screen bg-black px-4 py-12 md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.35em] text-amber-500/80">
            Dark Stream · Parceiros
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Seja um Parceiro Dark Stream
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 md:text-base">
            Você é um criador de conteúdo de True Crime e acredita na nossa missão? Preencha o formulário
            abaixo para que nossa equipe possa analisar seu trabalho.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-8 max-w-xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-md rounded-none"
        >
          <div className="space-y-5">
            <div>
              <label htmlFor="name" className={LABEL_CLASS}>
                Seu Nome ou Nome do Canal
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleChange}
                className={FIELD_CLASS}
                placeholder="Nome ou canal"
              />
            </div>

            <div>
              <label htmlFor="email" className={LABEL_CLASS}>
                Seu E-mail de Contato
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={FIELD_CLASS}
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="channelUrl" className={LABEL_CLASS}>
                Link do seu Canal (YouTube, etc.)
              </label>
              <input
                type="url"
                name="channelUrl"
                id="channelUrl"
                required
                value={formData.channelUrl}
                onChange={handleChange}
                className={FIELD_CLASS}
                placeholder="https://youtube.com/@canal"
              />
            </div>

            <div>
              <label htmlFor="message" className={LABEL_CLASS}>
                Fale um pouco sobre você e seu conteúdo (opcional)
              </label>
              <textarea
                name="message"
                id="message"
                rows="4"
                value={formData.message}
                onChange={handleChange}
                className={`${FIELD_CLASS} resize-none`}
                placeholder="Conte sobre seu estilo, casos cobertos e audiência..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center rounded-none bg-amber-500 font-mono text-sm font-bold uppercase tracking-wider text-black shadow-lg transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? <LoadingSpinner size="sm" inline /> : 'Enviar Inscrição'}
          </button>
        </form>
      </div>
    </AnimatedPage>
  );
}
