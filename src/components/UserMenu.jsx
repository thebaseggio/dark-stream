import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { isValidRenderableUrl, resolveAvatarUrl } from '../utils/profileMedia';

const InvestigatorIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <circle cx="12" cy="8" r="3.5" />
    <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" strokeLinecap="round" />
  </svg>
);

function UserAvatar({ profile }) {
  const avatarUrl = resolveAvatarUrl(profile);
  const hasValidAvatar = Boolean(avatarUrl) && isValidRenderableUrl(avatarUrl);
  const [useFallback, setUseFallback] = useState(!hasValidAvatar);

  useEffect(() => {
    setUseFallback(!hasValidAvatar);
  }, [hasValidAvatar, avatarUrl]);

  const avatarClassName = 'block w-9 h-9 rounded-md object-cover border border-zinc-800';

  if (hasValidAvatar && !useFallback) {
    return (
      <img
        src={avatarUrl}
        alt={profile?.username || 'Perfil'}
        className={avatarClassName}
        onError={() => setUseFallback(true)}
      />
    );
  }

  return (
    <div
      className={`${avatarClassName} bg-zinc-900 flex items-center justify-center`}
      aria-hidden="true"
    >
      <InvestigatorIcon className="w-5 h-5 text-zinc-600" />
    </div>
  );
}

function MenuItem({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`w-full text-left px-4 py-2 text-[11px] font-mono uppercase tracking-wider text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

function MenuLink({ to, onSelect, children, className = '' }) {
  return (
    <Link
      to={to}
      onClick={onSelect}
      className={`block px-4 py-2 text-[11px] font-mono uppercase tracking-wider text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors ${className}`}
    >
      {children}
    </Link>
  );
}

export default function UserMenu({ profile, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const isPartner = profile?.role === 'partner';

  const closeMenu = () => setOpen(false);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleLogout = () => {
    closeMenu();
    onLogout();
  };

  return (
    <div
      ref={menuRef}
      className="relative flex shrink-0 items-center self-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menu do usuário"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center justify-center rounded-md leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 transition-opacity hover:opacity-90"
      >
        <UserAvatar profile={profile} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 pt-2">
          <div
            role="menu"
            className="w-48 bg-zinc-950 border border-zinc-800 rounded-md shadow-2xl py-1 animate-fade-in"
          >
          <MenuLink to="/investigador" onSelect={closeMenu}>
            Meu Crachá
          </MenuLink>

          {isPartner && (
            <MenuLink to="/meu-perfil" onSelect={closeMenu}>
              Painel do Parceiro
            </MenuLink>
          )}

          <MenuLink to="/conta" onSelect={closeMenu}>
            Gerenciar Conta / Planos
          </MenuLink>

          <div className="border-t border-zinc-800 my-1" role="separator" />

          <MenuItem
            onClick={handleLogout}
            className="text-zinc-400 hover:text-red-400"
          >
            Sair
          </MenuItem>
          </div>
        </div>
      )}
    </div>
  );
}
