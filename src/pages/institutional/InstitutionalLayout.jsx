import React from 'react';
import AnimatedPage from '../../AnimatedPage';
import SeoHead from '../../components/SeoHead';

export function InstitutionalSection({ title, children }) {
  return (
    <section className="border border-zinc-800/80 bg-zinc-950/40 p-6 md:p-8">
      {title ? (
        <h2 className="mb-4 font-mono text-sm font-bold uppercase tracking-wider text-amber-500">
          {title}
        </h2>
      ) : null}
      <div className="space-y-4 text-sm leading-relaxed text-zinc-300 md:text-base">
        {children}
      </div>
    </section>
  );
}

export default function InstitutionalLayout({ title, description, children }) {
  return (
    <AnimatedPage className="min-h-screen bg-black text-white">
      <SeoHead title={`${title} | Dark Stream`} description={description} />
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <header className="mb-10 border-b border-zinc-800 pb-8">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.35em] text-amber-500/80">
              Dark Stream · Institucional
            </p>
            <h1 className="font-mono text-3xl font-bold uppercase tracking-wide text-white md:text-4xl">
              {title}
            </h1>
          </header>
          <div className="space-y-6">{children}</div>
        </div>
      </div>
    </AnimatedPage>
  );
}
