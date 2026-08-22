// src/App.jsx

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './contexts/NotificationProvider.jsx';
import { useAuth } from './contexts/AuthProvider.jsx';
// Componentes e Páginas
import MainLayout from './pages/MainLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Explore from './pages/Explore';
import VideoPlayer from './pages/VideoPlayer';
import PartnerDashboard from './pages/PartnerDashboard';
import InvestigatorProfile from './pages/InvestigatorProfile';
import PartnerProfile from './pages/PartnerProfile';
import SignupPage from './pages/SignupPage';
import NotificationModal from './components/NotificationModal.jsx';
import VisitorProfilePage from './pages/VisitorProfilePage';
import { UploadProvider } from './contexts/UploadProvider.jsx'; 
import SearchResults from './pages/SearchResults';
import CategoryPage from './pages/CategoryPage';
import OurMission from './pages/institutional/OurMission';
import TermsOfService from './pages/institutional/TermsOfService';
import InstitutionalPrivacy from './pages/institutional/InstitutionalPrivacy';
import SejaUmParceiro from './pages/SejaUmParceiro';
import AccountSettings from './pages/AccountSettings';
import PlansPage from './pages/PlansPage';
import SuggestionsPage from './pages/SuggestionsPage';
import LoadingSpinner from './components/LoadingSpinner';


const AuthLoadingScreen = ({ message = 'Carregando credenciais...' }) => (
    <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" label={message} />
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
    const [notification, setNotification] = useState({ isOpen: false, type: 'success', message: '' });
    const showNotification = (type, message) => {
        setNotification({ isOpen: true, type, message });
    };

    const closeNotification = () => {
        setNotification({ ...notification, isOpen: false });
    };

    const handleProfileUpdate = async () => {
        await refreshProfile();
    };

    if (loading) {
        return <AuthLoadingScreen message="Carregando..." />;
    }
 return (
    <NotificationProvider showNotification={showNotification}>
        <UploadProvider>
            <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-black text-white">
            <Router>
            <>
            <Routes>
                {/* --- Rotas 100% Públicas --- */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/inscrever-se" element={<SignupPage />} />

                {/* --- Rotas Públicas dentro do Layout Principal --- */}
                <Route element={<MainLayout user={user} profile={profile} />}>
                    <Route path="/casos" element={<Explore user={user} />} />
                    <Route path="/explorar" element={<Explore user={user} />} />
                    <Route path="/video/:id" element={<VideoPlayer user={user} />} />
                    <Route path="/caso/:id" element={<VideoPlayer user={user} />} />
                    <Route path="/parceiro/:id" element={<PartnerProfile currentUser={user} />} />
                    <Route path="/parceiros/:username" element={<PartnerProfile currentUser={user} />} />
                    <Route path="/busca" element={<SearchResults />} />
                    <Route path="/categoria/:categoryName" element={<CategoryPage />} />
                    <Route path="/missao" element={<OurMission />} />
                    <Route path="/termos" element={<TermsOfService />} />
                    <Route path="/privacidade" element={<InstitutionalPrivacy />} />
                    <Route path="/seja-um-parceiro" element={<SejaUmParceiro />} />
                    <Route path="/plans" element={<PlansPage />} />
                    <Route path="/sugestoes" element={<SuggestionsPage />} />
                    <Route path="/subscribe" element={<Navigate to="/plans" replace />} />

                    <Route path="/investigador" element={
                        <PrivateRoute user={user} loading={loading}>
                            <InvestigatorProfile user={user} profile={profile} />
                        </PrivateRoute>
                    } />
                    <Route path="/perfil" element={<Navigate to="/investigador" replace />} />

                    <Route path="/account" element={
                        <PrivateRoute user={user} loading={loading}>
                            <AccountSettings />
                        </PrivateRoute>
                    } />
                    <Route path="/conta" element={<Navigate to="/account" replace />} />

                    <Route path="/studio" element={<Navigate to="/partner/dashboard" replace />} />
                    <Route path="/partner/dashboard" element={
                        <PrivateRoute user={user} loading={loading}>
                            {(profile?.role === 'partner' || profile?.role === 'admin' || profile?.role === 'tester') ? (
                                <PartnerDashboard
                                    user={user}
                                    profile={profile}
                                    onSuccess={showNotification}
                                />
                            ) : (
                                <Navigate to="/meu-perfil" replace />
                            )}
                        </PrivateRoute>
                    } />

                    <Route path="/meu-perfil" element={
                        <PrivateRoute user={user} loading={loading}>
                            {(profile?.role === 'partner' || profile?.role === 'admin' || profile?.role === 'tester') ? (
                                <Navigate to="/partner/dashboard" replace />
                            ) : (
                                <VisitorProfilePage
                                    onProfileUpdate={handleProfileUpdate}
                                    onSuccess={showNotification}
                                />
                            )}
                        </PrivateRoute>
                    } />
                </Route>

                {/* Redirecionamentos de rotas antigas */}
                <Route path="/nossa-missao" element={<Navigate to="/missao" replace />} />
                <Route path="/termos-de-servico" element={<Navigate to="/termos" replace />} />
                <Route path="/politica-de-privacidade" element={<Navigate to="/privacidade" replace />} />

                <Route path="*" element={<div className="min-h-screen bg-black text-white flex items-center justify-center"><h1>404 - Página não encontrada</h1></div>} />
            </Routes>

            <NotificationModal 
                isOpen={notification.isOpen}
                onClose={closeNotification}
                type={notification.type}
                message={notification.message}
            />
        </>
        </Router>
            </div>
  </UploadProvider>
</NotificationProvider>
  );
}