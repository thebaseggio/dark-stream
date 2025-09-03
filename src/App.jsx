import React, { useState, useEffect, Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import DashboardRouter from './components/DashboardRouter';

export default function App() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [videoToEdit, setVideoToEdit] = useState(null);

    // --- SEÇÃO DE FUNÇÕES (LOCAL CORRETO) ---
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
                // Reutiliza a função que já criamos
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
    {/* --- Rotas 100% Públicas (Não usam o MainLayout) --- */}
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/inscrever-se" element={<SignupPage />} />

    {/* --- Rotas Públicas que usam o MainLayout --- */}
    {/* Todas estas páginas podem ser vistas por qualquer um, mas aparecem dentro do seu layout principal */}
    <Route element={<MainLayout user={user} profile={profile} />}>
        <Route path="/casos" element={<Explore videos={videos} />} />
        <Route path="/explorar" element={<Explore videos={videos} />} />
        <Route path="/video/:id" element={<VideoPlayer user={user} />} />
        <Route path="/caso/:id" element={<VideoPlayer user={user} />} />
        <Route path="/parceiro/:id" element={<PartnerPage currentUser={user} />} />
        <Route path="/dashboard" element={<DashboardRouter />} />

        {/* --- Rota Privada (Apenas para usuários logados) --- */}
        {/* O componente CreatorDashboard deve ter sua própria lógica para redirecionar se o usuário não estiver logado */}
<Route path="/painel" element={
    <CreatorDashboard 
        user={user} 
        profile={profile} 
        onProfileUpdate={handleProfileUpdate} // <-- Pass the new function
        onUploadClick={openUploadModal} 
        onEditClick={openEditModal} 
    />} 
/>
    </Route>

    {/* Rota para página não encontrada */}
    <Route path="*" element={<div><h1>404 - Página não encontrada</h1></div>} />
</Routes>

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