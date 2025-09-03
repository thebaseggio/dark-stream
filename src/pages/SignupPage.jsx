// src/pages/SignupPage.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import Spinner from '../components/Spinner';
import AnimatedPage from '../AnimatedPage';

export default function SignupPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setErrorMsg("As senhas não correspondem.");
            return;
        }
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    username: formData.username,
                    bio: 'Novo Parceiro do Dark Stream!',
                }
            }
        });

        if (error) {
            setErrorMsg(error.message);
        } else {
            setSuccessMsg("Inscrição realizada! Por favor, verifique seu e-mail para confirmar sua conta e poder fazer o login.");
        }
        setLoading(false);
    };

return (
    <AnimatedPage>
    <div className="min-h-screen bg-black text-white flex items-center justify-end pr-16 md:pr-24 lg:pr-48 relative overflow-hidden">
        
        <Link to="/" className="absolute top-6 left-6 z-20 hover:opacity-80 transition-opacity" title="Voltar para a Home">
        <img src="/LogoT.png" alt="Dark Stream Home" className="h-16 w-auto" />
        </Link>
        <div 
            className="absolute inset-0 bg-contain bg-left bg-no-repeat" 
            style={{ backgroundImage: "url('/signup-bg.jpg')" }}
        ></div>

        <div className="absolute inset-0 bg-black opacity-25"></div>

        <div className="relative z-10 w-full max-w-sm">
            <form onSubmit={handleSignup} className="bg-black/50 backdrop-blur-md p-6 rounded-lg shadow-2xl">
                <h2 className="text-2xl mb-6 text-center font-bold">Crie sua Conta</h2>
                
                {errorMsg && <p className="text-red-500 mb-4 text-center text-sm">{errorMsg}</p>}
                {successMsg && <p className="text-green-500 mb-4 text-center text-sm">{successMsg}</p>}
                
                <div className="space-y-3">
                    <input name="username" type="text" placeholder="Nome de Usuário" onChange={handleChange} required className="w-full p-3 bg-zinc-800 rounded text-white focus:outline-none focus:border-[#f1c40f] border-2 border-transparent transition-colors"/>
                    <input name="email" type="email" placeholder="Email" onChange={handleChange} required className="w-full p-3 bg-zinc-800 rounded text-white focus:outline-none focus:border-[#f1c40f] border-2 border-transparent transition-colors"/>
                    <input name="password" type="password" placeholder="Senha (mínimo 6 caracteres)" onChange={handleChange} required className="w-full p-3 bg-zinc-800 rounded text-white focus:outline-none focus:border-[#f1c40f] border-2 border-transparent transition-colors"/>
                    <input name="confirmPassword" type="password" placeholder="Confirmar Senha" onChange={handleChange} required className="w-full p-3 bg-zinc-800 rounded text-white focus:outline-none focus:border-[#f1c40f] border-2 border-transparent transition-colors"/>
                </div>

                <button type="submit" disabled={loading || successMsg} className="w-full mt-6 bg-[#f1c40f] hover:bg-opacity-90 text-black font-bold py-3 rounded transition-colors disabled:bg-gray-500 flex justify-center items-center">
                    {loading ? <Spinner /> : 'Inscrever-se'}
                </button>
                
                <p className="text-center text-sm text-gray-400 mt-4">
                    Já tem uma conta? <Link to="/login" className="text-[#f1c40f] hover:underline">Faça Login</Link>
                </p>
            </form>
        </div>
    </div>
    </AnimatedPage>
   );
 }