// src/pages/SignupPage.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import AnimatedPage from '../AnimatedPage';
import AuthTextInput from '../components/auth/AuthTextInput';
import PasswordField from '../components/auth/PasswordField';
import { AUTH_BUTTON_CLASS, AUTH_FORM_CLASS } from '../components/auth/authFormStyles';
import { sanitizeUsername } from '../utils/sanitizeText';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('As senhas não correspondem.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const { error } = await supabase.auth.signUp({
      email: formData.email.trim(),
      password: formData.password,
      options: {
        data: {
          username: sanitizeUsername(formData.username),
          bio: 'Novo Parceiro do Dark Stream!',
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg(
        'Inscrição realizada! Por favor, verifique seu e-mail para confirmar sua conta e poder fazer o login.',
      );
    }
    setLoading(false);
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
          className="absolute inset-0 bg-contain bg-left bg-no-repeat"
          style={{ backgroundImage: "url('/signup-bg.jpg')" }}
          aria-hidden="true"
        />

        <div className="absolute inset-0 bg-black/25" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-md">
          <form onSubmit={handleSignup} className={AUTH_FORM_CLASS}>
            <h2 className="mb-6 text-center font-mono text-xl font-bold uppercase tracking-wider text-white">
              Crie sua Conta
            </h2>

            {errorMsg && (
              <p className="mb-4 text-center text-sm text-red-400">{errorMsg}</p>
            )}
            {successMsg && (
              <p className="mb-4 text-center text-sm text-green-400">{successMsg}</p>
            )}

            <div className="space-y-3">
              <AuthTextInput
                name="username"
                type="text"
                placeholder="Nome de Usuário"
                value={formData.username}
                onChange={handleChange}
                required
                autoComplete="username"
              />
              <AuthTextInput
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
              <PasswordField
                name="password"
                placeholder="Senha (mínimo 6 caracteres)"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
              <PasswordField
                name="confirmPassword"
                placeholder="Confirmar Senha"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || Boolean(successMsg)}
              className={`${AUTH_BUTTON_CLASS} mt-6`}
            >
              {loading ? <LoadingSpinner size="sm" inline /> : 'Inscrever-se'}
            </button>

            <p className="mt-4 text-center text-sm text-zinc-400">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-amber-500 hover:underline">
                Faça Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </AnimatedPage>
  );
}
