import React from 'react';

const PIN_COLORS = {
  yellow: 'bg-yellow-200 text-yellow-950 border-yellow-300',
  pink: 'bg-pink-200 text-pink-950 border-pink-300',
  blue: 'bg-sky-200 text-sky-950 border-sky-300',
  green: 'bg-lime-200 text-lime-950 border-lime-300',
};

const ROTATIONS = ['-rotate-2', 'rotate-1', 'rotate-2', '-rotate-1', 'rotate-3', '-rotate-3'];

function PistaNote({ pista, index }) {
  const colorClass = PIN_COLORS[pista.pin_color] || PIN_COLORS.yellow;
  const rotation = ROTATIONS[index % ROTATIONS.length];

  return (
    <article
      className={`relative border p-3 shadow-lg shadow-black/40 ${colorClass} ${rotation} transition-transform hover:scale-105 hover:rotate-0`}
    >
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-700 border border-red-900 shadow-sm" aria-hidden="true" />
      {pista.title && (
        <p className="text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5 pr-1">
          {pista.title}
        </p>
      )}
      <p className="text-xs leading-snug font-medium">{pista.content}</p>
      {pista.image_url && (
        <img
          src={pista.image_url}
          alt=""
          className="mt-2 w-full h-16 object-cover border border-black/10"
        />
      )}
      <p className="text-[9px] font-mono uppercase tracking-wider mt-2 opacity-60">
        {pista.post_type === 'aviso' ? '📢 Aviso' : pista.post_type === 'bastidor' ? '🎬 Bastidor' : '🔍 Pista'}
      </p>
    </article>
  );
}

export default function PartnerCorkBoard({ pistas = [], partnerName }) {
  return (
    <section className="border border-dark-border bg-[#3d2e1f] p-4 sm:p-5 h-full min-h-[320px]">
      <div
        className="relative h-full min-h-[280px] p-4 border border-[#5a4632] shadow-inner"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(255,255,255,0.04) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(0,0,0,0.15) 0%, transparent 45%),
            repeating-linear-gradient(45deg, #4a3828 0px, #4a3828 2px, #453322 2px, #453322 4px)
          `,
        }}
      >
        <header className="mb-4 border-b border-[#6b5340]/60 pb-3">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-200/70">
            Quadro de Cortiça
          </p>
          <h2 className="text-sm font-mono uppercase tracking-wider text-amber-100 mt-1">
            Pistas de {partnerName || 'Operação'}
          </h2>
        </header>

        {pistas.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {pistas.map((pista, index) => (
              <PistaNote key={pista.id || index} pista={pista} index={index} />
            ))}
          </div>
        ) : (
          <p className="text-xs font-mono text-amber-200/50 uppercase tracking-wider text-center py-8">
            Nenhuma pista fixada no mural ainda.
          </p>
        )}
      </div>
    </section>
  );
}
