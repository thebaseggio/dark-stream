// src/pages/VisitorProfilePage.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedPage from '../AnimatedPage';
import ProfileEditor from '../components/ProfileEditor';

// Componente simples para seções futuras
const ProfileSection = ({ title, children }) => (
  <div className="bg-zinc-900 p-6 rounded-lg">
    <h2 className="text-xl font-bold mb-4 text-[#f1c40f]">{title}</h2>
    {children}
  </div>
);

export default function VisitorProfilePage({ user, profile, onProfileUpdate, onSuccess }) {
  const navigate = useNavigate();

  // Se por algum motivo o usuário não estiver logado, mostramos uma mensagem de acesso negado.
  if (!user || !profile) {
    return (
      <AnimatedPage>
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p className="mt-2 text-gray-400">Você precisa estar logado para ver seu perfil.</p>
          <button onClick={() => navigate('/login')} className="mt-6 bg-[#f1c40f] text-black font-bold py-2 px-6 rounded-lg">Fazer Login</button>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Seção de Boas-vindas e Edição de Perfil */}
        <div className="flex items-center gap-6 p-4">
          <img 
            src={profile?.creatorAvatar || `https://ui-avatars.com/api/?name=${profile?.username?.charAt(0)}&background=f1c40f&color=000`} 
            alt={profile?.username}
            className="w-24 h-24 rounded-full object-cover border-2 border-zinc-700"
          />
          <div>
            <h1 className="text-3xl font-bold">Olá, {profile?.username || 'Visitante'}!</h1>
            <p className="text-gray-400">Bem-vindo(a) ao seu espaço no Dark Stream.</p>
          </div>
        </div>

        {/* Seção para Editar Perfil */}
        <ProfileSection title="Informações da Conta">
          <p className="text-gray-300 mb-4">
            Aqui você pode atualizar suas informações básicas, como nome de usuário, bio e avatar.
          </p>
          <ProfileEditor 
            user={user} 
            profile={profile}
            onUploadSuccess={onProfileUpdate}
            onSuccess={onSuccess}
          />
        </ProfileSection>
        
        {/* Placeholders para futuras funcionalidades */}
        <ProfileSection title="Minha Atividade">
          <p className="text-gray-400">Em breve: aqui você verá seu histórico, vídeos favoritos e comentários.</p>
        </ProfileSection>
      </div>
    </AnimatedPage>
  );
}