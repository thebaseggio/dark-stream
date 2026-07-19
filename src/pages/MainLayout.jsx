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

function isFullBleedRoute(pathname) {
  return /^\/parceir(o|os)\/[^/]+$/.test(pathname);
}

function Header({ user, profile, immersive, chromeVisible }) {
    const navigate = useNavigate();
    const handleLogout = async () => {
        clearVideoProgressSession();
        clearViewRegisteredSession();
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <nav
          className={`sticky top-0 z-30 transition-all duration-300 ${
            immersive
              ? `bg-gradient-to-b from-black/80 to-transparent backdrop-blur-md border-b border-dark-border/50 ${chromeVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`
              : 'bg-gradient-to-b from-black/80 via-black/30 to-transparent backdrop-blur-md border-b border-dark-border/40'
          }`}
        >
            <SiteContainer>
                <div className={`flex justify-between items-center ${immersive ? 'h-14 opacity-80 hover:opacity-100 transition-opacity' : 'h-16'}`}>
                    <div className="flex-shrink-0">
                        <Link to="/casos">
                            <img
                              src="/LogoT.png"
                              alt="Dark Stream"
                              className={`w-auto transition-opacity ${immersive ? 'h-12 opacity-70 hover:opacity-100' : 'h-16'}`}
                            />
                        </Link>
                    </div>
                    <div className="flex-1 flex items-center justify-end gap-3 px-2 lg:ml-6 min-w-0">
                      <Searchbar immersive={immersive} />
                      {user ? (
                        <UserMenu profile={profile} onLogout={handleLogout} />
                      ) : (
                        <>
                          <Link to="/login" className="flex-shrink-0">
                            <button
                              type="button"
                              className="rounded-none border border-dark-border text-zinc-400 hover:text-white hover:border-zinc-500 font-mono uppercase tracking-wider text-[11px] px-4 py-2 transition-colors whitespace-nowrap"
                            >
                              Entrar
                            </button>
                          </Link>
                          <Link to="/inscrever-se" className="flex-shrink-0">
                            <button
                              type="button"
                              className="rounded-none bg-brand-primary text-black hover:opacity-90 px-4 py-2 font-bold text-sm tracking-wider uppercase whitespace-nowrap transition-opacity"
                            >
                              Seja um Investigador
                            </button>
                          </Link>
                        </>
                      )}
                    </div>
                </div>
            </SiteContainer>
        </nav>
    );
}

export default function MainLayout({ user, profile }) {
    const location = useLocation();
    const immersive = isVideoPlayerRoute(location.pathname);
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
        <div className={`flex flex-col min-h-screen text-white font-sans ${
            immersive
              ? 'bg-dark-pure'
              : 'bg-[linear-gradient(180deg,#000000_0%,#000000_10%,#080303_20%,#0b0505_35%,#140606_100%)]'
        }`}>
            <SeoHead title={DEFAULT_SITE_TITLE} description={DEFAULT_SITE_DESCRIPTION} />
            <Header user={user} profile={profile} immersive={immersive} chromeVisible={chromeVisible} />
            <main className="flex-grow">
                {immersive ? (
                    <Outlet context={{ chromeVisible, reportChromeActivity }} />
                ) : isFullBleedRoute(location.pathname) ? (
                    <Outlet />
                ) : (
                    <SiteContainer className="py-6">
                        <Outlet />
                    </SiteContainer>
                )}
            </main>
            <UploadStatus />
            {!immersive && <Footer />}
        </div>
    );
}
