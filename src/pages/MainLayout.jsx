// src/pages/MainLayout.jsx

import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

// A função Header agora contém um 'wrapper' para alinhar seu conteúdo
function Header({ user, profile }) {
    const navigate = useNavigate();
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        // A tag <nav> agora ocupa 100% da largura para a cor de fundo
        <nav className="bg-black sticky top-0 z-20 border-b border-zinc-800">
            {/* 👇 ESTE É O NOSSO CONTÊINER CENTRAL 👇 */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Lado Esquerdo */}
                    <div className="flex-shrink-0">
                        <Link to="/casos">
                            <img src="/logo.png" alt="Dark Stream" className="h-12 w-auto" />
                        </Link>
                    </div>

                    {/* Lado Direito */}
                    <div className="flex items-center gap-4">
                        <Link to="/casos">
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

// A função Footer segue o mesmo padrão
function Footer() {
    return (
        <footer className="bg-black border-t border-zinc-800">
             {/* 👇 USANDO O MESMO CONTÊINER CENTRAL 👇 */}
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-400">
                <p>© 2025 Dark Stream. Todos os direitos reservados.</p>
            </div>
        </footer>
    );
}

// O componente principal que usa o contêiner
export default function MainLayout({ user, profile }) {
    return (
        <div className="min-h-screen flex flex-col bg-black text-white font-sans">
            <Header user={user} profile={profile} />
            <main>
                 {/* 👇 E AQUI, DE NOVO, O MESMO CONTÊINER CENTRAL 👇 */}
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    {/* O px-4 é para telas pequenas, antes do sm:px-6 entrar em vigor */}
                    <div className="px-4 sm:px-0">
                         <Outlet />
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}