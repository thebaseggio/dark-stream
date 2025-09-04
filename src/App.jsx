// src/App.jsx

import React, { useState, useEffect, Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabase';

// Componentes e Páginas
import MainLayout from './pages/MainLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Explore from './pages/Explore';
import VideoPlayer from './pages/VideoPlayer';
import CreatorDashboard from './pages/CreatorDashboard';
import CreatorUploadForm from './pages/CreatorUploadForm';
import { Dialog, Transition } from '@headlessui/react';
import PartnerPage from './pages/PartnerPage';
import SignupPage from './pages/SignupPage';
import NotificationModal from './components/NotificationModal.jsx';
import VisitorProfilePage from './pages/VisitorProfilePage'; 

const PrivateRoute = ({ children, user }) => {
    return user ? children : <Navigate to="/login" />;
};

export default function App() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
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
    const openUploadModal = () => { setVideoToEdit(null); setIsModalOpen(true); };
    const openEditModal = (video) => { setVideoToEdit(video); setIsModalOpen(true); };
    const handleFormSuccess = () => closeModal();

    const fetchProfile = async (userId) => {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
        setProfile(profileData);
    };

    const handleProfileUpdate = () => {
        if(user) {
            fetchProfile(user.id);
        }
    };

    useEffect(() => {
        const fetchAllVideos = async () => {
            const { data, error } = await supabase.from('videos').select('*, creator_id (id, username, creatorAvatar)').order('created_at', { ascending: false });
            if(error) console.error("Erro ao carregar vídeos:", error);
            else setVideos(data);
        };
        
        const fetchSessionAndProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchProfile(session.user.id);
            }
            setLoading(false);
        };

        fetchAllVideos();
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
    <Router>
        <>
            <Routes>
                {/* --- Rotas 100% Públicas --- */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/inscrever-se" element={<SignupPage />} />

                {/* --- Rotas Públicas dentro do Layout Principal --- */}
                <Route element={<MainLayout user={user} profile={profile} />}>
                    <Route path="/casos" element={<Explore videos={videos} />} />
                    <Route path="/explorar" element={<Explore videos={videos} />} />
                    <Route path="/video/:id" element={<VideoPlayer user={user} />} />
                    <Route path="/caso/:id" element={<VideoPlayer user={user} />} />
                    <Route path="/parceiro/:id" element={<PartnerPage currentUser={user} />} />

                    {/* --- ROTAS PRIVADAS E CONDICIONAIS --- */}
                    <Route path="/meu-perfil" element={
                        <PrivateRoute user={user}>
                            {profile?.role === 'partner' ? (
                                <CreatorDashboard 
                                    user={user} 
                                    profile={profile} 
                                    onProfileUpdate={handleProfileUpdate}
                                    onUploadClick={openUploadModal} 
                                    onEditClick={openEditModal} 
                                    onSuccess={showNotification} // <-- MUDANÇA AQUI
                                />
                            ) : (
                                <VisitorProfilePage
                                    user={user}
                                    profile={profile}
                                    onProfileUpdate={handleProfileUpdate}
                                    onSuccess={showNotification} // <-- MUDANÇA AQUI
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

            {/* O Modal de Upload/Edição continua aqui, pois é global */}
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
                                <CreatorUploadForm user={user} onSuccess={handleFormSuccess} videoToEdit={videoToEdit} />
                            </Dialog.Panel>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    </Router>
  );
}