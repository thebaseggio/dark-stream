import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-zinc-800/50 text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
        
        <p className="text-sm order-2 sm:order-1 mt-4 sm:mt-0">
          &copy; {new Date().getFullYear()} Dark Stream. Todos os direitos reservados.
        </p>
        
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 order-1 sm:order-2">
          <Link to="/nossa-missao" className="text-sm hover:text-[#f1c40f] transition-colors">
            Nossa Missão
          </Link>
          <Link to="/termos-de-servico" className="text-sm hover:text-[#f1c40f] transition-colors">
            Termos de Serviço
          </Link>
          <Link to="/politica-de-privacidade" className="text-sm hover:text-[#f1c40f] transition-colors">
            Política de Privacidade
          </Link>
          {/* ✨ LINK ATUALIZADO ✨ */}
          <Link to="/seja-um-parceiro" className="text-sm hover:text-[#f1c40f] transition-colors">
            Seja um Parceiro
          </Link>
        </nav>

      </div>
    </footer>
  );
}