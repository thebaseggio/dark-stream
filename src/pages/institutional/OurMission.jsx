import React from 'react';
import InstitutionalLayout, { InstitutionalSection } from './InstitutionalLayout';

export default function OurMission() {
  return (
    <InstitutionalLayout
      title="Nossa Missão"
      description="Conheça os pilares do Dark Stream: respeito, justiça e comunidade no ecossistema True Crime."
    >
      <InstitutionalSection>
        <p className="mb-4 font-mono text-sm font-bold uppercase tracking-wider text-amber-500">
          A verdade merece uma voz
        </p>
        <p className="text-center font-serif text-lg italic text-zinc-200 md:text-xl">
          &ldquo;Acreditamos que todo mistério merece uma voz. O Dark Stream nasceu da convicção de que há
          histórias nas sombras que precisam ser trazidas à luz. Não pelo espetáculo, mas pelo alerta.
          Não pela dor, mas pela busca de justiça.&rdquo;
        </p>
        <p>
          Somos o ponto de encontro para os melhores investigadores e contadores de histórias do Brasil,
          uma comunidade unida pelo respeito às vítimas e pela paixão em desvendar a verdade.
        </p>
      </InstitutionalSection>

      <InstitutionalSection title="Nossos pilares">
        <ul className="list-none space-y-4 pl-0">
          <li>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-500">
              Respeito
            </span>
            <p className="mt-1">
              Cada caso é tratado com a máxima seriedade, honrando a memória das vítimas e a dor de suas famílias.
            </p>
          </li>
          <li>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-500">
              Justiça
            </span>
            <p className="mt-1">
              Acreditamos que compartilhar histórias é uma forma de pressionar por respostas e não deixar que casos
              caiam no esquecimento.
            </p>
          </li>
          <li>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-500">
              Comunidade
            </span>
            <p className="mt-1">
              Fortalecemos o ecossistema de True Crime no Brasil, oferecendo uma plataforma de qualidade para os
              criadores e um espaço seguro para os fãs debaterem e aprenderem.
            </p>
          </li>
        </ul>
      </InstitutionalSection>
    </InstitutionalLayout>
  );
}
