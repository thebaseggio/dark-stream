// src/App.jsx

import React, { useState, Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './contexts/NotificationProvider.jsx';
import { useAuth } from './contexts/AuthProvider.jsx';
// Componentes e Páginas
import MainLayout from './pages/MainLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Explore from './pages/Explore';
import VideoPlayer from './pages/VideoPlayer';
import CreatorDashboard from './pages/CreatorDashboard';
import CreatorUploadForm from './pages/CreatorUploadForm';
import { Dialog, Transition } from '@headlessui/react';
import InvestigatorProfile from './pages/InvestigatorProfile';
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
import AccountSettings from './pages/AccountSettings';


const AuthLoadingScreen = ({ message = 'Carregando credenciais...' }) => (
    <div className="min-h-screen bg-black flex items-center justify-center text-zinc-400">
        {message}
    </div>
);

const PrivateRoute = ({ children, user, loading }) => {
    if (loading) {
        return <AuthLoadingScreen />;
    }

    return user ? children : <Navigate to="/login" />;
};
export default function App() {
    const { user, profile, loading, refreshProfile } = useAuth();
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

    const handleProfileUpdate = async () => {
        await refreshProfile();
    };

    if (loading) {
        return <AuthLoadingScreen message="Carregando..." />;
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
                    <Route path="/casos" element={<Explore user={user} />} />
                    <Route path="/explorar" element={<Explore user={user} />} />
                    
                    {/* Passando o objeto 'user' completo (que agora inclui o perfil) para o VideoPlayer */}
                    <Route path="/video/:id" element={<VideoPlayer user={user} />} />
                    <Route path="/caso/:id" element={<VideoPlayer user={user} />} />
                    <Route path="/parceiro/:id" element={<PartnerProfile currentUser={user} />} />
                    <Route path="/parceiros/:username" element={<PartnerProfile currentUser={user} />} />

                    <Route path="/busca" element={<SearchResults />} />
                    <Route path="/categoria/:categoryName" element={<CategoryPage />} />
                    <Route path="/nossa-missao" element={<NossaMissao />} />
                    <Route path="/termos-de-servico" element={<TermosDeServico />} />
                    <Route path="/politica-de-privacidade" element={<PoliticaDePrivacidade />} />
                    <Route path="/seja-um-parceiro" element={<SejaUmParceiro />} />

                    <Route path="/investigador" element={
                        <PrivateRoute user={user} loading={loading}>
                            <InvestigatorProfile user={user} profile={profile} />
                        </PrivateRoute>
                    } />
                    <Route path="/perfil" element={<Navigate to="/investigador" replace />} />

                    <Route path="/conta" element={
                        <PrivateRoute user={user} loading={loading}>
                            <AccountSettings />
                        </PrivateRoute>
                    } />

                    <Route path="/meu-perfil" element={
                        <PrivateRoute user={user} loading={loading}>
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
                            <Dialog.Panel className="w-full max-w-2xl transform bg-[#0a0a0a] border border-neutral-800 p-8 text-left align-middle shadow-2xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-mono uppercase tracking-wider text-white mb-2">
                                    {videoToEdit ? 'Editar Vídeo' : 'Novo Vídeo'}
                                </Dialog.Title>
                                <p className="text-[11px] font-mono text-zinc-500 mb-6">
                                    {videoToEdit ? 'Atualize as informações do caso.' : 'Publique um novo caso ou Short de atualização.'}
                                </p>
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