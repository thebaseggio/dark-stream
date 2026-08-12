// src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import AnimatedPage from '../AnimatedPage';
import AuthTextInput from '../components/auth/AuthTextInput';
import PasswordField from '../components/auth/PasswordField';
import { AUTH_BUTTON_CLASS, AUTH_FORM_CLASS } from '../components/auth/authFormStyles';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/casos';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error('[Login] Falha na autenticação:', {
          message: error.message,
          status: error.status,
          code: error.code,
          name: error.name,
        });

        setErrorMsg(
          error.message === 'Invalid login credentials'
            ? 'E-mail ou senha incorretos. Verifique suas credenciais.'
            : error.message
        );
        return;
      }

      console.info('[Login] Sessão iniciada com sucesso:', {
        userId: data?.user?.id,
        email: data?.user?.email,
        redirectTo,
      });

      navigate(redirectTo);
    } catch (unexpectedError) {
      console.error('[Login] Erro inesperado na chamada de autenticação:', {
        message: unexpectedError?.message,
        name: unexpectedError?.name,
        stack: unexpectedError?.stack,
      });
      setErrorMsg('Não foi possível conectar ao servidor de autenticação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPage>
      <div className="relative flex min-h-screen items-center justify-end overflow-hidden bg-black pr-8 text-white sm:pr-16 md:pr-24 lg:pr-48">
        <Link
          to="/"
          className="absolute left-6 top-6 z-20 transition-opacity hover:opacity-80"
          title="Voltar para a Home"
        >
          <img src="/LogoT.png" alt="Dark Stream Home" className="h-16 w-auto" />
        </Link>

        <div
          className="absolute inset-0 bg-cover bg-left"
          style={{ backgroundImage: "url('/auth-bg2.jpg')" }}
          aria-hidden="true"
        />

        <div className="absolute inset-0 bg-black/25" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-md">
          <form onSubmit={handleLogin} className={AUTH_FORM_CLASS}>
            <h2 className="mb-8 text-center font-mono text-xl font-bold uppercase tracking-wider text-white">
              Login
            </h2>

            {errorMsg && (
              <p className="mb-4 text-center text-sm text-red-400">{errorMsg}</p>
            )}

            <div className="space-y-4">
              <AuthTextInput
                name="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <PasswordField
                name="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={loading} className={`${AUTH_BUTTON_CLASS} mt-8`}>
              {loading ? <LoadingSpinner size="sm" inline /> : 'Entrar'}
            </button>

            <p className="mt-6 text-center text-sm text-zinc-400">
              Não tem uma conta?{' '}
              <Link to="/inscrever-se" className="text-amber-500 hover:underline">
                Inscreva-se
              </Link>
            </p>
          </form>
        </div>
      </div>
    </AnimatedPage>
  );
}
