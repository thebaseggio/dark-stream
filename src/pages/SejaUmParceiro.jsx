import React, { useState } from 'react';
import AnimatedPage from '../AnimatedPage';
import { supabase } from '../supabase';

export default function SejaUmParceiro() {
  const [formData, setFormData] = useState({ name: '', email: '', channelUrl: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [formStatus, setFormStatus] = useState({ message: '', type: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus({ message: '', type: '' });

    // Chamada real para a nossa Edge Function
    const { data, error } = await supabase.functions.invoke('send-partner-application', {
      body: formData,
    });

    if (error) {
      // Em caso de erro, exibe uma mensagem de erro
      setFormStatus({ message: 'Ocorreu um erro ao enviar sua inscrição. Tente novamente.', type: 'error' });
      console.error("Erro ao chamar a Edge Function:", error);
    } else {
      // Em caso de sucesso, exibe a mensagem de sucesso
      setFormStatus({ message: 'Obrigado pelo seu interesse! Entraremos em contato em breve.', type: 'success' });
      setFormData({ name: '', email: '', channelUrl: '', message: '' }); // Limpa o formulário
    }

    setIsSubmitting(false);
  };

  return (
    <AnimatedPage>
      <div className="max-w-2xl mx-auto py-16 px-4">
        <h1 className="font-anton text-5xl text-white mb-4 text-center">Seja um Parceiro Dark Stream</h1>
        <p className="text-lg text-zinc-400 mb-10 text-center">
          Você é um criador de conteúdo de True Crime e acredita na nossa missão? Preencha o formulário abaixo para que nossa equipe possa analisar seu trabalho.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-300">Seu Nome ou Nome do Canal</label>
            <input type="text" name="name" id="name" required value={formData.name} onChange={handleChange} className="mt-1 block w-full bg-zinc-800 border-zinc-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-[#f1c40f] focus:border-[#f1c40f]" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300">Seu E-mail de Contato</label>
            <input type="email" name="email" id="email" required value={formData.email} onChange={handleChange} className="mt-1 block w-full bg-zinc-800 border-zinc-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-[#f1c40f] focus:border-[#f1c40f]" />
          </div>
          <div>
            <label htmlFor="channelUrl" className="block text-sm font-medium text-zinc-300">Link do seu Canal (YouTube, etc.)</label>
            <input type="url" name="channelUrl" id="channelUrl" required value={formData.channelUrl} onChange={handleChange} className="mt-1 block w-full bg-zinc-800 border-zinc-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-[#f1c40f] focus:border-[#f1c40f]" />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-zinc-300">Fale um pouco sobre você e seu conteúdo (opcional)</label>
            <textarea name="message" id="message" rows="4" value={formData.message} onChange={handleChange} className="mt-1 block w-full bg-zinc-800 border-zinc-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-[#f1c40f] focus:border-[#f1c40f]"></textarea>
          </div>
          
          <div className="text-center pt-4">
            <button type="submit" disabled={isSubmitting} className="bg-[#f1c40f] hover:bg-opacity-90 text-black font-bold py-3 px-8 rounded-lg text-lg inline-block transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? 'Enviando...' : 'Enviar Inscrição'}
            </button>
          </div>
        </form>

        {formMessage && (
            <p className="text-center text-green-400 mt-6">{formMessage}</p>
        )}
      </div>
    </AnimatedPage>
  );
}