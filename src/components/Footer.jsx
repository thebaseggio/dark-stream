import React from 'react';
import { Link } from 'react-router-dom';
import SiteContainer from './SiteContainer';

const INSTITUTIONAL_LINKS = [
  { to: '/missao', label: 'Nossa Missão' },
  { to: '/termos', label: 'Termos de Serviço' },
  { to: '/privacidade', label: 'Política de Privacidade' },
  { to: '/seja-um-parceiro', label: 'Seja um Parceiro' },
];

export default function Footer() {
  return (
    <footer className="border-t border-zinc-900/80 bg-black text-zinc-500">
      <SiteContainer className="py-10">
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-center">
          {INSTITUTIONAL_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="font-mono text-[11px] uppercase tracking-wider transition-colors hover:text-amber-500"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="mt-8 text-center text-xs text-zinc-600">
          &copy; 2026 Dark Stream. Todos os direitos reservados.
        </p>
      </SiteContainer>
    </footer>
  );
}
