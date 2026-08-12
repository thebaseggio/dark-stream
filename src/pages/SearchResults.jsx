import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';
import VideoCard from '../components/VideoCard';
import { getPartnerProfilePath } from '../utils/partnerProfile';
import { getPartnerAvatarUrl, normalizeSearchTerm, searchCatalog } from '../utils/searchCatalog';
import SeoHead, { DEFAULT_SITE_DESCRIPTION } from '../components/SeoHead';
import SiteContainer from '../components/SiteContainer';
import LoadingSpinner from '../components/LoadingSpinner';

const VerifiedIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10.09,16.5L6.5,12.91L7.91,11.5L10.09,13.67L16.08,7.68L17.5,9.09L10.09,16.5Z" />
  </svg>
);

function PartnerResultCard({ partner }) {
  const partnerPath = getPartnerProfilePath(partner) || `/parceiro/${partner.id}`;

  return (
    <Link
      to={partnerPath}
      className="group flex max-w-xs cursor-pointer items-center gap-3 rounded-lg border border-zinc-800/80 bg-zinc-900/80 p-2.5 transition-all duration-200 hover:border-amber-500/60"
    >
      <img
        src={getPartnerAvatarUrl(partner)}
        alt={partner.username}
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <h3 className="truncate text-sm font-semibold text-white transition-colors group-hover:text-brand-primary">
            {partner.username}
          </h3>
          {(partner.role === 'partner' || partner.is_partner) && (
            <VerifiedIcon className="h-3 w-3 shrink-0 text-zinc-500" title="Parceiro Verificado" />
          )}
        </div>
        {partner.bio && (
          <p className="line-clamp-1 text-xs text-zinc-400">{partner.bio}</p>
        )}
      </div>
    </Link>
  );
}

const VIDEO_GRID_CLASS =
  'mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const navigate = useNavigate();

  const [partners, setPartners] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const normalized = normalizeSearchTerm(query);
    if (!normalized) {
      setPartners([]);
      setVideos([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    const performSearch = async () => {
      setLoading(true);
      const result = await searchCatalog(supabase, query);

      if (cancelled) return;

      setPartners(Array.isArray(result?.partners) ? result.partners : []);
      setVideos(Array.isArray(result?.videos) ? result.videos : []);
      setLoading(false);
    };

    performSearch();

    return () => {
      cancelled = true;
    };
  }, [query]);

  const handleNavigation = (path) => navigate(path);
  const hasResults = partners.length > 0 || videos.length > 0;

  return (
    <AnimatedPage>
      <SeoHead
        title={query ? `Busca: ${query} | Dark Stream` : 'Buscar | Dark Stream'}
        description={DEFAULT_SITE_DESCRIPTION}
      />
      <SiteContainer className="my-8 py-8">
        <h2 className="mb-6 text-left font-anton text-2xl text-white">
          {query ? `Resultados da busca para: "${query}"` : 'Faça uma busca'}
        </h2>

        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner size="md" label="Buscando resultados..." />
          </div>
        ) : !hasResults ? (
          <p className="py-10 text-center text-gray-400">
            Nenhum resultado encontrado para &quot;{query}&quot;.
          </p>
        ) : (
          <div className="space-y-10 pb-10">
            {partners.length > 0 && (
              <section>
                <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-zinc-500">
                  Parceiros Encontrados
                </h3>
                <div className="flex flex-wrap gap-4">
                  {partners.map((partner) => (
                    <PartnerResultCard key={partner.id} partner={partner} />
                  ))}
                </div>
              </section>
            )}

            {videos.length > 0 && (
              <section>
                <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-zinc-500">
                  Vídeos Encontrados
                </h3>
                <div className={VIDEO_GRID_CLASS}>
                  {videos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onNavigate={handleNavigation}
                      fullWidth
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </SiteContainer>
    </AnimatedPage>
  );
}
