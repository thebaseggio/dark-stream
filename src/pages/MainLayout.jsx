import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import UploadStatus from '../components/UploadStatus';
import Searchbar from '../components/Searchbar';
import Footer from '../components/Footer';

function isVideoPlayerRoute(pathname) {
  return /^\/(video|caso)\/[^/]+$/.test(pathname);
}

function Header({ user, profile, immersive, chromeVisible }) {
    const navigate = useNavigate();
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <nav
          className={`sticky top-0 z-30 transition-all duration-300 ${
            immersive
              ? `bg-transparent border-b border-dark-border ${chromeVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`
              : 'bg-dark-pure'
          }`}
        >
            <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${immersive ? 'max-w-none' : 'max-w-7xl'}`}>
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
                    <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
                      <Searchbar immersive={immersive} />
                    </div>

                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                <Link to={profile?.role === 'partner' ? '/meu-perfil' : '/investigador'} className="flex-shrink-0">
                                    <button
                                      type="button"
                                      className="rounded-none border border-dark-border text-white bg-transparent hover:bg-dark-panel font-mono uppercase tracking-wider text-[11px] px-4 py-2 transition-colors whitespace-nowrap"
                                    >
                                        {profile?.role === 'partner' ? 'Painel do Parceiro' : 'Meu Crachá'}
                                    </button>
                                </Link>

                                <button
                                  type="button"
                                  onClick={handleLogout}
                                  className="text-zinc-400 hover:text-white font-mono uppercase tracking-wider text-[11px] px-2 py-2 bg-transparent transition-colors whitespace-nowrap"
                                >
                                    Sair
                                </button>
                            </>
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
            </div>
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

    useEffect(() => {
        if (!immersive) return undefined;

        const htmlOverflow = document.documentElement.style.overflow;
        const bodyOverflow = document.body.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';

        return () => {
            document.documentElement.style.overflow = htmlOverflow;
            document.body.style.overflow = bodyOverflow;
        };
    }, [immersive]);

    return (
        <div className={`flex flex-col text-white font-sans overflow-hidden ${immersive ? 'h-screen bg-dark-pure' : 'min-h-screen bg-dark-pure'}`}>
            <Header user={user} profile={profile} immersive={immersive} chromeVisible={chromeVisible} />
            <main className={`${immersive ? 'flex-1 min-h-0 overflow-hidden' : 'flex-grow'}`}>
                {immersive ? (
                    <Outlet context={{ chromeVisible, reportChromeActivity }} />
                ) : (
                    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                        <Outlet />
                    </div>
                )}
            </main>
            <UploadStatus />
            {!immersive && <Footer />}
        </div>
    );
}
