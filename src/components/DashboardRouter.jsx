// src/components/DashboardRouter.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Navigate, useLocation } from 'react-router-dom';
import Spinner from './Spinner'; // Assumindo que o Spinner está na mesma pasta

export default function DashboardRouter() {
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        async function fetchUserRole() {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                
                if (error) {
                    console.error("Erro ao buscar perfil do usuário:", error);
                } else if (profile) {
                    setUserRole(profile.role);
                }
            }
            setLoading(false);
        }

        fetchUserRole();
    }, []);

    if (loading) {
        // Mostra uma tela de carregamento enquanto busca o papel do usuário
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    // Lógica de redirecionamento baseada no papel (role)
    if (userRole === 'Criador' || userRole === 'Admin') {
        // Se for Criador ou Admin, redireciona para a página de perfil de criador
        return <Navigate to="/creator-profile" state={{ from: location }} replace />;
    } 
    
    if (userRole === 'visitante') {
        // Se for visitante, redireciona para a home page
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // Se não tiver papel ou houver erro, volta para a página de login
    return <Navigate to="/login" state={{ from: location }} replace />;
}