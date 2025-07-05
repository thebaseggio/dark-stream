// src/pages/SignupPage.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';

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

        const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                // Aqui passamos os dados extras que irão para a tabela 'profiles'
                data: {
                    username: formData.username,
                    bio: 'Novo Parceiro do Dark Stream!',
                    // O avatar será o padrão da UI-Avatars
                }
            }
        });

        if (error) {
            setErrorMsg(error.message);
        } else {
            setSuccessMsg("Inscrição realizada! Por favor, verifique seu e-mail para confirmar sua conta.");
            // NOTA: O Supabase por padrão envia um e-mail de confirmação.
            // Para testes, você pode desabilitar essa exigência no seu painel Supabase:
            // Authentication -> Providers -> Email -> Desmarcar "Confirm email"
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
            <form onSubmit={handleSignup} className="w-full max-w-sm bg-zinc-900 p-6 rounded-lg">
                <h2 className="text-2xl mb-6 text-center font-bold">Crie sua Conta de Parceiro</h2>

                {errorMsg && <p className="text-red-500 mb-4 text-center">{errorMsg}</p>}
                {successMsg && <p className="text-green-500 mb-4 text-center">{successMsg}</p>}
                
                <div className="space-y-4">
                    <input name="username" type="text" placeholder="Nome de Usuário" onChange={handleChange} required className="w-full p-2 bg-zinc-800 rounded text-white focus:outline-none focus:border-[#f1c40f] border-2 border-transparent"/>
                    <input name="email" type="email" placeholder="Email" onChange={handleChange} required className="w-full p-2 bg-zinc-800 rounded text-white focus:outline-none focus:border-[#f1c40f] border-2 border-transparent"/>
                    <input name="password" type="password" placeholder="Senha" onChange={handleChange} required className="w-full p-2 bg-zinc-800 rounded text-white focus:outline-none focus:border-[#f1c40f] border-2 border-transparent"/>
                    <input name="confirmPassword" type="password" placeholder="Confirmar Senha" onChange={handleChange} required className="w-full p-2 bg-zinc-800 rounded text-white focus:outline-none focus:border-[#f1c40f] border-2 border-transparent"/>
                </div>

                <button type="submit" disabled={loading} className="w-full mt-6 bg-[#f1c40f] hover:bg-opacity-90 text-black font-bold py-2 rounded transition-colors disabled:bg-gray-500">
                    {loading ? 'Criando...' : 'Inscrever-se'}
                </button>

                <p className="text-center text-sm text-gray-400 mt-4">
                    Já tem uma conta? <Link to="/login" className="text-[#f1c40f] hover:underline">Faça Login</Link>
                </p>
            </form>
        </div>
    );
}