import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

function Header({ user, profile }) {
    const navigate = useNavigate();
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <nav className="bg-black sticky top-0 z-30 border-b border-[#f1c40f]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0">
                        <Link to="/explorar">
                            <img src="/logo.png" alt="Dark Stream" className="h-12 w-auto" />
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/explorar">
                            <button className="bg-[#f1c40f] hover:bg-opacity-90 text-black font-semibold px-4 py-1.5 rounded-md text-sm">
                                Explorar Casos
                            </button>
                        </Link>
                        {user ? (
                            <>
                                <Link to="/painel">
                                    <button className="bg-[#8e44ad] hover:bg-opacity-90 text-white font-semibold px-4 py-1.5 rounded-md text-sm">
                                        Painel de Criador
                                    </button>
                                </Link>
                                {profile?.role === 'admin' && (
                                    <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full self-center">Admin</span>
                                )}
                                <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-1.5 rounded-md text-sm">
                                    Sair
                                </button>
                            </>
                        ) : (
                            <Link to="/login">
                                <button className="bg-[#8e44ad] hover:bg-opacity-90 text-white font-semibold px-4 py-1.5 rounded-md text-sm">
                                    Entrar
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

function Footer() {
    return (
        <footer className="bg-black border-t border-[#f1c40f]">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-400">
                <p>© 2025 Dark Stream. Todos os direitos reservados.</p>
            </div>
        </footer>
    );
}

export default function MainLayout({ user, profile }) {
    return (
        <div className="min-h-screen flex flex-col bg-black text-white font-sans">
            <Header user={user} profile={profile} />
            <main className="flex-grow">
                {/* O contêiner central que define o espaçamento das páginas */}
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    {/* 👇 A PEÇA FUNDAMENTAL QUE FALTAVA 👇 */}
                    <Outlet />
                </div>
            </main>
            <Footer />
        </div>
    );
}