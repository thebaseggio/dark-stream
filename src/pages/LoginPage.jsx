// src/pages/LoginPage.jsx
 
 import React, { useState } from 'react';
 import { useNavigate, Link } from 'react-router-dom';
 import { supabase } from '../supabase';
 import Spinner from '../components/Spinner';
 import AnimatedPage from '../AnimatedPage';
 
 export default function LoginPage() {
   const navigate = useNavigate();
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [errorMsg, setErrorMsg] = useState(null);
   const [loading, setLoading] = useState(false);
 
   const handleLogin = async (e) => {
     e.preventDefault();
     setLoading(true);
     setErrorMsg(null);
     const { error } = await supabase.auth.signInWithPassword({ email, password });
     if (error) {
       setErrorMsg(error.message);
     } else {
       navigate('/painel');
     }
     setLoading(false);
   };
 
// src/pages/LoginPage.jsx

return (
  <AnimatedPage>
    <div className="min-h-screen bg-black text-white flex items-center justify-end pr-16 md:pr-24 lg:pr-48 relative overflow-hidden">
      
        <Link to="/" className="absolute top-6 left-6 z-20 hover:opacity-80 transition-opacity" title="Voltar para a Home">
        <img src="/LogoT.png" alt="Dark Stream Home" className="h-16 w-auto" />
        </Link>

      {/* IMAGEM DE FUNDO */}
      <div 
        className="absolute inset-0 bg-cover bg-left" 
        style={{ backgroundImage: "url('/auth-bg2.jpg')" }}
      ></div>

      {/* OVERLAY ESCURO SUTIL */}
      <div className="absolute inset-0 bg-black opacity-25"></div>

      {/* CONTAINER DO FORMULÁRIO */}
      <div className="relative z-10 w-full max-w-sm">
        {/* 👇 MUDANÇA AQUI: trocamos bg-zinc-900/80 por bg-black/50 👇 */}
        <form onSubmit={handleLogin} className="bg-black/0 backdrop-blur-md p-8 rounded-lg shadow-2xl">
          <h2 className="text-2xl mb-8 text-center font-bold">Login</h2>
          
          {errorMsg && <p className="text-red-500 mb-4 text-center text-sm">{errorMsg}</p>}
          
          <div className="space-y-4">
            <input name="email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 bg-zinc-800 rounded text-white focus:outline-none focus:border-[#f1c40f] border-2 border-transparent transition-colors"/>
            <input name="password" type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 bg-zinc-800 rounded text-white focus:outline-none focus:border-[#f1c40f] border-2 border-transparent transition-colors" />
          </div>

          <button type="submit" disabled={loading} className="w-full mt-8 bg-[#8e44ad] hover:bg-[#803d9c] text-white font-bold py-3 rounded transition-colors disabled:bg-gray-500 flex justify-center">
              {loading ? <Spinner /> : 'Entrar'}
          </button>
          
          <p className="text-center text-sm text-gray-400 mt-6">
            Não tem uma conta? <Link to="/inscrever-se" className="text-[#f1c40f] hover:underline">Inscreva-se</Link>
          </p>
        </form>
      </div>
    </div>
    </AnimatedPage>
  );
 }