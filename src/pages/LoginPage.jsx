// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMsg(error.message);
    } else {
      navigate('/casos'); // Leva para a página de casos após o login
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-zinc-900 p-6 rounded"
      >
        <Link to="/" className="flex justify-center mb-4">
             <img src="/logo.png" alt="Dark Stream" className="h-16 w-auto" />
        </Link>
        <h2 className="text-2xl mb-4 text-center">Login</h2>
        {errorMsg && <p className="text-red-500 mb-2">{errorMsg}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full mb-3 p-2 bg-zinc-800 rounded text-white"
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full mb-4 p-2 bg-zinc-800 rounded text-white"
        />
        <button
          type="submit"
          className="w-full bg-[#8e44ad] hover:bg-[#8e44ad]/90 py-2 rounded"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}