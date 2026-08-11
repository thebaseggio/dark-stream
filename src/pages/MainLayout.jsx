import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import UploadStatus from '../components/UploadStatus';
import Searchbar from '../components/Searchbar';
import Footer from '../components/Footer';
import SiteContainer from '../components/SiteContainer';
import SeoHead, { DEFAULT_SITE_DESCRIPTION, DEFAULT_SITE_TITLE } from '../components/SeoHead';
import { clearVideoProgressSession } from '../utils/videoPlayback';
import { clearViewRegisteredSession } from '../utils/videoViews';
import UserMenu from '../components/UserMenu';

function isVideoPlayerRoute(pathname) {
  return /^\/(video|caso)\/[^/]+$/.test(pathname);
}

function isHomeCatalogRoute(pathname) {
  return pathname === '/casos' || pathname === '/explorar';
}

function Header({ user, profile, immersive, chromeVisible }) {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    clearVideoProgressSession();
    clearViewRegisteredSession();
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'border-b border-zinc-800/80 bg-black/80 shadow-2xl backdrop-blur-md'
          : 'border-transparent bg-gradient-to-b from-black/80 via-black/20 to-transparent backdrop-blur-none'
      }`}
    >
      <SiteContainer>
        <div className="flex h-14 w-full items-center justify-between gap-2 md:h-16">
          <Link to="/casos" className="flex-shrink-0">
            <img
              src="/LogoT.png"
              alt="Dark Stream"
              className={`w-auto transition-opacity ${
                immersive ? 'h-10 opacity-70 hover:opacity-100 md:h-12' : 'h-7 md:h-9'
              }`}
            />
          </Link>
          <div className="flex min-w-0 items-center gap-1.5 md:gap-3">
            <Searchbar immersive={immersive} />
            {user ? (
              <UserMenu profile={profile} onLogout={handleLogout} />
            ) : (
              <>
                <Link to="/login" className="flex-shrink-0">
                  <button
                    type="button"
                    className="touch-target flex-shrink-0 rounded-none border border-dark-border px-2 py-1 font-mono text-xs uppercase tracking-wider text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white md:px-4 md:py-2 md:text-sm whitespace-nowrap"
                  >
                    Entrar
                  </button>
                </Link>
                <Link to="/inscrever-se" className="flex-shrink-0">
                  <button
                    type="button"
                    className="touch-target flex-shrink-0 rounded-none bg-brand-primary px-2 py-1 text-xs font-bold uppercase tracking-wider text-black transition-opacity hover:opacity-90 md:px-4 md:py-2 md:text-sm whitespace-nowrap"
                  >
                    <span className="sm:hidden">Parceiro</span>
                    <span className="hidden sm:inline">Seja Parceiro</span>
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </SiteContainer>
    </header>
  );
}

export default function MainLayout({ user, profile }) {
  const location = useLocation();
  const immersive = isVideoPlayerRoute(location.pathname);
  const isHomeCatalog = isHomeCatalogRoute(location.pathname);
  const [chromeVisible, setChromeVisible] = useState(true);
  const chromeTimerRef = useRef(null);

  const reportChromeActivity = useCallback(() => {
    if (!immersive) return;
    setChromeVisible(true);
    if (chromeTimerRef.current) clearTimeout(chromeTimerRef.current);
    chromeTimerRef.current = setTimeout(() => setChromeVisible(false), 3000);
  }, [immersive]);

  useEffect(() => {
    if (!immersive) {
      setChromeVisible(true);
      return undefined;
    }

    reportChromeActivity();
    const onActivity = () => reportChromeActivity();
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('touchstart', onActivity);

    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('touchstart', onActivity);
      if (chromeTimerRef.current) clearTimeout(chromeTimerRef.current);
    };
  }, [immersive, reportChromeActivity]);

  return (
    <div
      className={`flex min-h-screen w-full max-w-full flex-col overflow-x-hidden font-sans text-white ${
        isHomeCatalog
          ? 'bg-gradient-to-b from-black via-[#0f0406] to-black'
          : 'bg-black'
      }`}
    >
      <SeoHead title={DEFAULT_SITE_TITLE} description={DEFAULT_SITE_DESCRIPTION} />
      <Header user={user} profile={profile} immersive={immersive} chromeVisible={chromeVisible} />
      <main
        className={`min-w-0 w-full max-w-full flex-1 ${
          isHomeCatalog ? '' : 'pt-16 md:pt-20'
        }`}
      >
        {immersive ? (
          <Outlet context={{ chromeVisible, reportChromeActivity }} />
        ) : (
          <Outlet />
        )}
      </main>
      <UploadStatus />
      {!immersive && <Footer />}
    </div>
  );
}
