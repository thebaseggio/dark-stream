import React from 'react';
import InstitutionalLayout, { InstitutionalSection } from './InstitutionalLayout';

export default function InstitutionalPrivacy() {
  return (
    <InstitutionalLayout
      title="Política de Privacidade"
      description="Como o Dark Stream coleta, utiliza e protege seus dados pessoais em conformidade com a LGPD."
    >
      <InstitutionalSection title="1. Coleta de Informações">
        <p>
          Coletamos informações necessárias para oferecer uma experiência personalizada e segura, incluindo:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-semibold text-zinc-100">Dados de Cadastro:</span>{' '}
            Nome, e-mail e dados de autenticação.
          </li>
          <li>
            <span className="font-semibold text-zinc-100">Dados de Uso:</span>{' '}
            Histórico de navegação, vídeos assistidos, interações nos carrosseis e preferências para alimentar o
            Recomendados para Você.
          </li>
        </ul>
      </InstitutionalSection>

      <InstitutionalSection title="2. Uso dos Dados">
        <p>Seus dados são utilizados exclusivamente para:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Manter sua conta ativa e segura.</li>
          <li>Personalizar recomendações de casos e novos episódios.</li>
          <li>Processar assinaturas e apoios aos Parceiros (quando aplicável).</li>
          <li>
            Enviar comunicações importantes sobre novos lançamentos ou atualizações na plataforma.
          </li>
        </ul>
      </InstitutionalSection>

      <InstitutionalSection title="3. Compartilhamento e Proteção de Dados">
        <p>
          O Dark Stream não vende nem comercializa seus dados pessoais para terceiros. Seus dados são armazenados
          em infraestrutura de nuvem segura com criptografia padrão de mercado (Supabase/PostgreSQL).
        </p>
      </InstitutionalSection>

      <InstitutionalSection title="4. Seus Direitos (LGPD)">
        <p>
          Você tem total controle sobre seus dados. A qualquer momento, é possível solicitar a exportação ou
          exclusão definitiva de sua conta e histórico de navegação nas configurações do seu perfil.
        </p>
      </InstitutionalSection>
    </InstitutionalLayout>
  );
}
