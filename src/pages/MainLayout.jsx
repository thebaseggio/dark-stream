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
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

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
        <div className="flex w-full items-center justify-between gap-3 py-2 md:py-2.5">
          <Link to="/casos" className="flex flex-shrink-0 items-center pl-4 sm:pl-0">
            <img
              src="/LogoT.png"
              alt="Dark Stream"
              className={`h-12 w-auto object-contain transition-opacity md:h-14 ${
                immersive ? 'opacity-70 hover:opacity-100' : ''
              }`}
            />
          </Link>
          <div className="flex h-10 min-w-0 items-center gap-3 pr-4 sm:pr-0">
            <Searchbar immersive={immersive} />
            {user ? (
              <UserMenu profile={profile} onLogout={handleLogout} />
            ) : (
              <>
                <Link to="/login" className="flex h-10 flex-shrink-0 items-stretch">
                  <button
                    type="button"
                    className="box-border flex h-10 cursor-pointer items-center justify-center rounded-none border border-zinc-700 bg-black/60 px-5 py-0 font-mono text-xs font-bold uppercase leading-none tracking-wider text-white transition-all hover:bg-zinc-800 md:text-sm"
                  >
                    Entrar
                  </button>
                </Link>
                <Link to="/inscrever-se" className="flex h-10 flex-shrink-0 items-stretch">
                  <button
                    type="button"
                    className="box-border flex h-10 cursor-pointer items-center justify-center rounded-none border border-amber-500 bg-amber-500 px-5 py-0 font-mono text-xs font-bold uppercase leading-none tracking-wider text-black transition-all hover:bg-amber-400 md:text-sm"
                  >
                    Inscrever-se
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
  const { isMiniPlayerVisible } = useAudioPlayer();
  const onVideoPage = isVideoPlayerRoute(location.pathname);
  const showMiniPlayerPadding = isMiniPlayerVisible && !onVideoPage;
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
        } ${showMiniPlayerPadding ? 'pb-20' : ''}`}
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
