import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

// Substitua sua função Header atual por esta:
function Header({ user, profile }) {
    const navigate = useNavigate();
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <nav className="bg-black sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Lado Esquerdo - Logo */}
                    <div className="flex-shrink-0">
                        <Link to="/casos">
                            <img src="/LogoT.png" alt="Dark Stream" className="h-16 w-auto" />
                        </Link>
                    </div>

                    {/* Lado Direito - Botões Dinâmicos */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            // --- SE O USUÁRIO ESTIVER LOGADO ---
                            <>
                                <Link to="/painel">
                                    <button className="bg-[#8e44ad] hover:bg-opacity-90 text-white font-semibold px-4 py-1.5 rounded-md text-sm transition-colors">
                                        Painel de Criador
                                    </button>
                                </Link>
                                {profile?.role === 'admin' && (
                                    <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full self-center">Admin</span>
                                )}
                                <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-1.5 rounded-md text-sm transition-colors">
                                    Sair
                                </button>
                            </>
                        ) : (
                            // --- SE O USUÁRIO NÃO ESTIVER LOGADO ---
                            <div className="flex items-center gap-2">
                                <Link to="/login">
                                    <button className="font-semibold px-4 py-2 rounded-md text-white hover:bg-zinc-800 transition-colors text-sm">
                                        Entrar
                                    </button>
                                </Link>
                                <Link to="/inscrever-se">
                                    <button className="bg-[#f1c40f] hover:bg-opacity-90 text-black font-bold px-4 py-2 rounded-md transition-colors text-sm">
                                        Inscrever-se
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

function Footer() {
    return (
        <footer className="bg-black">
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