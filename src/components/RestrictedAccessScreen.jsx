import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const NOISE_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

function formatCaseId(caseId) {
  if (!caseId) return '████████-████-████-████-████████████';
  return caseId.toUpperCase();
}

const VARIANT_PRESETS = {
  case: {
    archiveType: 'Arquivo Criminal — Confidencial',
    stampTitle: 'Caso Sigiloso',
    stampSubtitle: 'Acesso Restrito',
    stampDetail: 'Investigador Não Autorizado',
    folderTitle: 'Pasta suspensa — nível de sigilo máximo',
    folderSubtitle: 'Registro bloqueado até validação de credenciais',
    terminalLines: (id) => [
      `ID do caso ${formatCaseId(id)} bloqueado por falta de credenciais do departamento de investigação.`,
      'Faça login para descriptografar os arquivos.',
    ],
  },
  partner: {
    archiveType: 'Banco de Dados de Parceiros — Classificado',
    stampTitle: 'Ficha Classificada',
    stampSubtitle: 'Acesso Restrito',
    stampDetail: 'Investigador Não Autorizado',
    folderTitle: 'Dossiê do criador — nível de sigilo máximo',
    folderSubtitle: 'Histórico de casos bloqueado até validação de credenciais',
    terminalLines: (id) => [
      `ID do parceiro ${formatCaseId(id)} localizado no banco de dados interno.`,
      'FICHA DO PARCEIRO CLASSIFICADA. Credenciais de Investigador necessárias para acessar o banco de dados e histórico de casos do criador.',
    ],
  },
};

export default function RestrictedAccessScreen({
  caseId,
  loginPath = '/login',
  returnPath = '/casos',
  loginState,
  variant = 'case',
}) {
  const [terminalLine, setTerminalLine] = useState(0);
  const preset = VARIANT_PRESETS[variant] || VARIANT_PRESETS.case;
  const terminalMessages = preset.terminalLines(caseId);

  useEffect(() => {
    const interval = setInterval(() => {
      setTerminalLine((prev) => (prev + 1) % 4);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  const loginTo = loginState ? { pathname: loginPath, state: loginState } : loginPath;

  return (
    <div className="relative min-h-full h-full bg-dark-pure overflow-hidden flex items-center justify-center px-4 py-16 font-sans">
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none animate-pulse"
        style={{ backgroundImage: NOISE_TEXTURE, backgroundSize: '180px 180px' }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-soft-light"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-dark-pure via-transparent to-dark-pure pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-xl">
        <div className="relative border border-dark-border bg-[#0d0d0d] shadow-2xl shadow-black/80">
          <div className="absolute -top-3 left-8 w-28 h-6 bg-[#141410] border border-dark-border border-b-0" aria-hidden="true" />

          <div className="px-8 pt-10 pb-8 space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-dark-border pb-5">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">
                  Departamento de Investigação
                </p>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mt-1">
                  {preset.archiveType}
                </p>
              </div>
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider whitespace-nowrap">
                Ref. {formatCaseId(caseId).slice(0, 8)}
              </p>
            </div>

            <div className="relative py-8 px-4 border border-dashed border-zinc-800 bg-black/40 min-h-[180px] flex items-center justify-center overflow-hidden">
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                aria-hidden="true"
              >
                <div className="rotate-[-14deg] border-4 border-red-700/80 px-6 py-3 text-center">
                  <p className="font-mono font-bold text-red-600/90 text-sm sm:text-base uppercase tracking-[0.15em]">
                    {preset.stampTitle}
                  </p>
                  <p className="font-mono text-red-700/70 text-[9px] sm:text-[10px] uppercase tracking-[0.25em] mt-1">
                    {preset.stampSubtitle}
                  </p>
                  <p className="font-mono text-red-800/60 text-[8px] sm:text-[9px] uppercase tracking-[0.2em] mt-0.5">
                    {preset.stampDetail}
                  </p>
                </div>
              </div>

              <div className="relative z-10 text-center space-y-2 px-2">
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500">
                  {preset.folderTitle}
                </p>
                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
                  {preset.folderSubtitle}
                </p>
              </div>
            </div>

            <div className="bg-black border border-dark-border p-4 font-mono text-xs text-zinc-400 leading-relaxed space-y-1">
              <p className="text-brand-primary/70">
                &gt; TERMINAL_DS v2.1 — conexão segura interrompida
              </p>
              <p className="text-zinc-500">
                &gt; {terminalMessages[0]}
              </p>
              <p className="text-zinc-500">
                &gt; {terminalMessages[1]}
              </p>
              <p className={`text-zinc-600 transition-opacity duration-300 ${terminalLine >= 2 ? 'opacity-100' : 'opacity-40'}`}>
                &gt; Aguardando autenticação do investigador...
                <span className={`inline-block w-2 h-3 ml-1 bg-brand-primary/60 align-middle ${terminalLine % 2 === 0 ? 'opacity-100' : 'opacity-0'}`} />
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to={loginTo}
                className="flex-1 text-center rounded-none bg-brand-primary text-black font-mono uppercase tracking-wider text-[11px] px-5 py-3 hover:opacity-90 transition-opacity"
              >
                Autenticar Credenciais
              </Link>
              <Link
                to={returnPath}
                className="flex-1 text-center rounded-none border border-dark-border text-zinc-300 font-mono uppercase tracking-wider text-[11px] px-5 py-3 hover:bg-dark-panel hover:text-white transition-colors"
              >
                Voltar para o Arquivo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
