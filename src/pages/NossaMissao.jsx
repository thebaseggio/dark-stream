// src/pages/NossaMissao.jsx

import React from 'react';
import AnimatedPage from '../AnimatedPage';

export default function NossaMissao() {
  return (
    <AnimatedPage>
      <div className="max-w-4xl mx-auto py-16 px-4 text-white">
        
        <h1 className="font-anton text-5xl md:text-6xl text-center text-[#f1c40f] mb-12">
          Histórias que Precisam ser Contadas
        </h1>

        <div className="space-y-8 text-lg text-zinc-300 leading-relaxed text-left">
            <p className="italic font-serif text-xl text-center">
              "Acreditamos que todo mistério merece uma voz. O Dark Stream nasceu da convicção de que há histórias nas sombras que precisam ser trazidas à luz. Não pelo espetáculo, mas pelo alerta. Não pela dor, mas pela busca de justiça. Somos o ponto de encontro para os melhores investigadores e contadores de histórias do Brasil, uma comunidade unida pelo respeito às vítimas e pela paixão em desvendar a verdade."
            </p>

            <div className="pt-8 border-t border-zinc-800">
                <h2 className="font-anton text-3xl text-white mb-4">Nossos Pilares</h2>
                <ul className="space-y-4 list-disc list-inside">
                    <li><span className="font-bold">Respeito:</span> Cada caso é tratado com a máxima seriedade, honrando a memória das vítimas e a dor de suas famílias.</li>
                    <li><span className="font-bold">Justiça:</span> Acreditamos que compartilhar histórias é uma forma de pressionar por respostas e não deixar que casos caiam no esquecimento.</li>
                    <li><span className="font-bold">Comunidade:</span> Fortalecemos o ecossistema de *true crime* no Brasil, oferecendo uma plataforma de qualidade para os criadores e um espaço seguro para os fãs debaterem e aprenderem.</li>
                </ul>
            </div>
        </div>
        
      </div>
    </AnimatedPage>
  );
}