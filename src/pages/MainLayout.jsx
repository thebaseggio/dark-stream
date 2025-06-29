// src/MainLayout.jsx
import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

function Header({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/'); // Redireciona para a landing page após o logout
  };

  return (
    <nav className="bg-black px-4 sm:px-6 md:px-10 lg:px-20 py-4 flex justify-between items-center sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <Link to="/casos">
          <img src="/logo.png" alt="Dark Stream" className="h-14 w-auto" />
        </Link>
        {/* Aqui podem entrar os menus dropdown de "Casos" e "Criadores" no futuro */}
      </div>
      <div className="flex items-center gap-2">
         <Link to="/casos">
             <button className="bg-[#f1c40f] hover:bg-[#f1c40f]/90 text-black font-semibold px-4 py-1 rounded">
                 Explorar Casos
             </button>
         </Link>
        {user ? (
         <>
             <Link to="/painel">
                 <button className="bg-[#8e44ad] hover:bg-[#8e44ad]/90 text-white font-semibold px-4 py-1.5 rounded">
                     Painel
                 </button>
             </Link>
             <button
                 onClick={handleLogout}
                 className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-1 rounded"
             >
                 Sair
             </button>
         </>
        ) : (
          <Link to="/login">
            <button className="bg-[#8e44ad] hover:bg-[#8e44ad]/90 text-white font-semibold px-4 py-1 rounded">
              Entrar
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-black text-center py-4 text-sm text-gray-400 mt-10">
      <p>© 2025 Dark Stream. Todos os direitos reservados.</p>
    </footer>
  );
}

export default function MainLayout({ user }) {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-sans">
      <Header user={user} />
      <div className="flex-1 px-4 sm:px-6 md:px-10 lg:px-20 py-6">
        {/* Outlet renderizará o conteúdo da página aqui */}
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}