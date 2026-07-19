import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

const DocumentIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="13" y2="17" />
  </svg>
);

const ImageIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 21s-6-4.35-9-9.5C1.5 9 4.5 4 12 4s10.5 5 9 7.5C18 17.65 12 21 12 21z" />
    <circle cx="12" cy="10.5" r="2.5" />
  </svg>
);

const LinkIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const TYPE_META = {
  document: {
    label: 'Documento',
    Icon: DocumentIcon,
    action: 'Abrir arquivo',
  },
  image: {
    label: 'Imagem / Mapa',
    Icon: ImageIcon,
    action: 'Ver evidência',
  },
  link: {
    label: 'Link externo',
    Icon: LinkIcon,
    action: 'Abrir link',
  },
};

function getTypeMeta(type) {
  return TYPE_META[type] || TYPE_META.document;
}

export default function CaseFilesPanel({ videoId }) {
  const [files, setFiles] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!videoId) {
      setFiles([]);
      setLoaded(true);
      return undefined;
    }

    let cancelled = false;
    setLoaded(false);

    const fetchFiles = async () => {
      const { data, error } = await supabase
        .from('case_files')
        .select('id, title, file_url, type, created_at')
        .eq('video_id', videoId)
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error('Erro ao buscar arquivos do caso:', error);
        setFiles([]);
      } else {
        setFiles(data || []);
      }
      setLoaded(true);
    };

    fetchFiles();
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  if (!loaded || files.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          Arquivos e Evidências do Caso
        </p>
        <p className="text-[11px] text-zinc-600 mt-1">
          {files.length} {files.length === 1 ? 'anexo disponível' : 'anexos disponíveis'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {files.map((file) => {
          const meta = getTypeMeta(file.type);
          const { Icon } = meta;

          return (
            <article
              key={file.id}
              className="flex items-start gap-3 border border-dark-border bg-black/30 hover:border-zinc-600 hover:bg-[#0d0d0d] p-4 transition-colors duration-300"
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center border border-dark-border bg-dark-panel text-brand-primary">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <span className="inline-block text-[9px] font-mono uppercase tracking-widest text-zinc-500 mb-1">
                    {meta.label}
                  </span>
                  <h3 className="text-sm text-white leading-snug line-clamp-2">
                    {file.title}
                  </h3>
                </div>

                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-[10px] font-mono uppercase tracking-widest text-brand-primary border border-brand-primary/30 px-3 py-1.5 hover:bg-brand-primary hover:text-black transition-colors"
                >
                  {meta.action}
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
