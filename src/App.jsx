// src/App.jsx

import React, { useState, useEffect, Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import { NotificationProvider } from './contexts/NotificationProvider.jsx';

// Componentes e Páginas
import MainLayout from './pages/MainLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Explore from './pages/Explore';
import VideoPlayer from './pages/VideoPlayer';
import CreatorDashboard from './pages/CreatorDashboard';
import CreatorUploadForm from './pages/CreatorUploadForm';
import { Dialog, Transition } from '@headlessui/react';
import PartnerProfile from './pages/PartnerProfile';
import SignupPage from './pages/SignupPage';
import NotificationModal from './components/NotificationModal.jsx';
import VisitorProfilePage from './pages/VisitorProfilePage';
import { UploadProvider } from './contexts/UploadProvider.jsx'; 
import SearchResults from './pages/SearchResults';
import CategoryPage from './pages/CategoryPage';
import NossaMissao from './pages/NossaMissao';
import TermosDeServico from './pages/TermosDeServico';
import PoliticaDePrivacidade from './pages/PoliticaDePrivacidade';
import SejaUmParceiro from './pages/SejaUmParceiro';


const PrivateRoute = ({ children, user }) => {
    return user ? children : <Navigate to="/login" />;
};

export default function App() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    // O estado 'videos' pode ser removido se nenhum outro componente global o utilizar. Por segurança, vamos mantê-lo por enquanto.
    const [videos, setVideos] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [videoToEdit, setVideoToEdit] = useState(null);
    const [notification, setNotification] = useState({ isOpen: false, type: 'success', message: '' });

    const showNotification = (type, message) => {
        setNotification({ isOpen: true, type, message });
    };

    const closeNotification = () => {
        setNotification({ ...notification, isOpen: false });
    };

    const closeModal = () => { setIsModalOpen(false); setTimeout(() => setVideoToEdit(null), 300); };
    const openUploadModal = () => {
        if (profile?.role !== 'partner') return;
        setVideoToEdit(null);
        setIsModalOpen(true);
    };
    const openEditModal = (video) => {
        if (profile?.role !== 'partner') return;
        setVideoToEdit(video);
        setIsModalOpen(true);
    };
    const handleFormSuccess = () => closeModal();

    const fetchProfile = async (userId) => {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
        // Adicionamos o perfil do usuário ao próprio objeto do usuário para fácil acesso global
        setUser(currentUser => ({...currentUser, profile: profileData}));
        setProfile(profileData);
    };

    const handleProfileUpdate = () => {
        if(user) {
            fetchProfile(user.id);
        }
    };

    useEffect(() => {
        const fetchSessionAndProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchProfile(session.user.id);
            }
            setLoading(false);
        };

        // A busca de todos os vídeos foi removida daqui.
        fetchSessionAndProfile();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
        });
        
        return () => authListener.subscription.unsubscribe();
    }, []);

    if (loading) {
        return <div className="bg-black text-white min-h-screen flex items-center justify-center">Carregando...</div>;
    }

 return (
    <NotificationProvider showNotification={showNotification}>
        <UploadProvider>
            <Router>
            <>
            <Routes>
                {/* --- Rotas 100% Públicas --- */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/inscrever-se" element={<SignupPage />} />

                {/* --- Rotas Públicas dentro do Layout Principal --- */}
                <Route element={<MainLayout user={user} profile={profile} />}>
                    {/* As props 'videos' foram removidas daqui */}
                    <Route path="/casos" element={<Explore />} />
                    <Route path="/explorar" element={<Explore />} />
                    
                    {/* Passando o objeto 'user' completo (que agora inclui o perfil) para o VideoPlayer */}
                    <Route path="/video/:id" element={<VideoPlayer user={user} />} />
                    <Route path="/caso/:id" element={<VideoPlayer user={user} />} />
                    <Route path="/parceiro/:id" element={<PartnerProfile currentUser={user} />} />

                    <Route path="/busca" element={<SearchResults />} />
                    <Route path="/categoria/:categoryName" element={<CategoryPage />} />
                    <Route path="/nossa-missao" element={<NossaMissao />} />
                    <Route path="/termos-de-servico" element={<TermosDeServico />} />
                    <Route path="/politica-de-privacidade" element={<PoliticaDePrivacidade />} />
                    <Route path="/seja-um-parceiro" element={<SejaUmParceiro />} />

                    <Route path="/meu-perfil" element={
                        <PrivateRoute user={user}>
                            {profile?.role === 'partner' ? (
                                <CreatorDashboard 
                                    user={user} 
                                    profile={profile} 
                                    onProfileUpdate={handleProfileUpdate}
                                    onUploadClick={openUploadModal} 
                                    onEditClick={openEditModal} 
                                    onSuccess={showNotification}
                                />
                            ) : (
                                <VisitorProfilePage
                                    user={user}
                                    profile={profile}
                                    onProfileUpdate={handleProfileUpdate}
                                    onSuccess={showNotification}
                                />
                            )}
                        </PrivateRoute>
                    } />
                </Route>
                
                <Route path="*" element={<div><h1>404 - Página não encontrada</h1></div>} />
            </Routes>

            <NotificationModal 
                isOpen={notification.isOpen}
                onClose={closeNotification}
                type={notification.type}
                message={notification.message}
            />

            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={closeModal}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/70" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Dialog.Panel className="w-full max-w-xl transform rounded-2xl bg-zinc-900 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-white mb-6">
                                    {videoToEdit ? 'Editar Vídeo' : 'Adicionar Novo Vídeo'}
                                </Dialog.Title>
                                <CreatorUploadForm user={user} profile={profile} onSuccess={handleFormSuccess} videoToEdit={videoToEdit} />
                            </Dialog.Panel>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
        </Router>
  </UploadProvider>
</NotificationProvider>
  );
}