import React from 'react';
import InstitutionalLayout, { InstitutionalSection } from './InstitutionalLayout';

export default function TermsOfService() {
  return (
    <InstitutionalLayout
      title="Termos de Serviço"
      description="Termos de uso da plataforma Dark Stream para consumo, discussão e apoio ao ecossistema True Crime."
    >
      <InstitutionalSection title="1. Aceitação dos Termos">
        <p>
          Ao acessar ou utilizar o Dark Stream, você concorda em cumprir estes Termos de Serviço. A plataforma
          destina-se ao consumo, discussão e apoio ao ecossistema de conteúdo True Crime e investigativo.
        </p>
      </InstitutionalSection>

      <InstitutionalSection title="2. Uso de Conteúdo e Propriedade Intelectual">
        <p>
          Todo o conteúdo audiovisual publicado pelos Parceiros permanece sob responsabilidade e propriedade de
          seus respetivos criadores. O Dark Stream atua como plataforma de exibição e distribuição autorizada.
          É expressamente proibida a reprodução, download não autorizado ou redistribuição dos materiais sem
          autorização prévia.
        </p>
      </InstitutionalSection>

      <InstitutionalSection title="3. Conduta da Comunidade e Debates">
        <p>
          Alinhado com o nosso pilar de Respeito, não toleramos:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Comentários ofensivos, discursos de ódio ou vitimização secundária (victim blaming).</li>
          <li>
            Divulgação de dados pessoais (doxxing) de indivíduos envolvidos em investigações em andamento.
          </li>
          <li>Apologia a crimes ou desrespeito às famílias das vítimas.</li>
        </ul>
        <p>O descumprimento resultará na suspensão ou banimento imediato da conta.</p>
      </InstitutionalSection>

      <InstitutionalSection title="4. Isenção de Responsabilidade Investigativa">
        <p>
          As análises e teorias apresentadas nas produções e nos murais de debate possuem caráter informativo e
          documental. O Dark Stream não substitui órgãos oficiais de segurança pública ou poder judiciário.
        </p>
      </InstitutionalSection>
    </InstitutionalLayout>
  );
}
