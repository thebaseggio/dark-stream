import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function ProfileEditor({ user, profile, onUploadSuccess, onSuccess, mode = 'visitor' }) {
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [saving, setSaving] = useState(false);

    // Estados para os arquivos e pré-visualizações
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    
    // Estados para os campos de texto
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [xUrl, setXUrl] = useState('');

    useEffect(() => {
        if (profile) {
            setAvatarPreview(profile.creatorAvatar || null);
            setBannerPreview(profile.banner_url || null);
            setUsername(profile.username || '');
            setBio(profile.bio || '');
            setYoutubeUrl(profile.youtube_url || '');
            setInstagramUrl(profile.instagram_url || '');
            setXUrl(profile.x_url || '');
        }
    }, [profile]);

    const handleAvatarChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleBannerChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setBannerFile(file);
            setBannerPreview(URL.createObjectURL(file));
        }
    };
    
    const handleUploadImage = async (file, storageBucket, dbColumn, successMessage) => {
        if (!file) { onSuccess('error', 'Por favor, selecione uma imagem primeiro.'); return; }
        
        const isAvatar = storageBucket === 'avatars';
        isAvatar ? setUploadingAvatar(true) : setUploadingBanner(true);
        
        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${storageBucket.slice(0, -1)}-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from(storageBucket).upload(filePath, file, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from(storageBucket).getPublicUrl(filePath);
            
            const { error: updateError } = await supabase.from('profiles').update({ [dbColumn]: publicUrl }).eq('id', user.id);
            if (updateError) throw updateError;

            onSuccess('success', successMessage);
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            onSuccess('error', `Erro ao enviar imagem: ${error.message}`);
        } finally {
            isAvatar ? setUploadingAvatar(false) : setUploadingBanner(false);
        }
    };
    
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updates = { username, bio, youtube_url: youtubeUrl, instagram_url: instagramUrl, x_url: xUrl };
            const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
            if (error) throw error;
            onSuccess('success', 'Informações atualizadas com sucesso!');
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            onSuccess('error', `Erro ao atualizar informações: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

return (
    <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2">
        
        {/* --- SEÇÃO 1: FOTO DE PERFIL (Para todos) --- */}
        <div className="flex flex-col items-center gap-4">
            <h4 className="font-bold text-white text-lg border-b-2 border-zinc-700 w-full text-center pb-2">Alterar Foto de Perfil</h4>
            <img src={avatarPreview || `https://ui-avatars.com/api/?name=${username.charAt(0)}&background=27272a&color=f1c40f&bold=true`} alt="Avatar Preview" className="w-32 h-32 rounded-full object-cover border-4 border-zinc-700"/>
            <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={uploadingAvatar}/>
            <label htmlFor="avatar-upload" className="w-full cursor-pointer bg-zinc-700 text-white text-sm font-semibold text-center py-2 px-4 rounded-lg hover:bg-zinc-600 transition-colors block">Escolher Imagem</label>
            <button onClick={() => handleUploadImage(avatarFile, 'avatars', 'creatorAvatar', 'Foto de perfil atualizada!')} disabled={uploadingAvatar || !avatarFile} className="w-full bg-[#8e44ad] text-white font-bold py-3 rounded-lg hover:bg-[#803d9c] transition-colors disabled:bg-zinc-500 disabled:cursor-not-allowed">
                {uploadingAvatar ? 'Enviando...' : 'Salvar Nova Foto'}
            </button>
        </div>

        {/* --- SEÇÃO 2: IMAGEM DE CAPA (Apenas Parceiros) --- */}
        {mode === 'partner' && (
            <div className="flex flex-col items-center gap-4">
                <h4 className="font-bold text-white text-lg border-b-2 border-zinc-700 w-full text-center pb-2">Alterar Imagem de Capa</h4>
                <img src={bannerPreview || `https://placehold.co/600x200/18181b/404040?text=Banner`} alt="Banner Preview" className="w-full h-32 rounded-lg object-cover border-4 border-zinc-700"/>
                <input type="file" id="banner-upload" className="hidden" accept="image/*" onChange={handleBannerChange} disabled={uploadingBanner}/>
                <label htmlFor="banner-upload" className="w-full cursor-pointer bg-zinc-700 text-white text-sm font-semibold text-center py-2 px-4 rounded-lg hover:bg-zinc-600 transition-colors block">Escolher Imagem</label>
                <button onClick={() => handleUploadImage(bannerFile, 'banners', 'banner_url', 'Imagem de capa atualizada!')} disabled={uploadingBanner || !bannerFile} className="w-full bg-[#8e44ad] text-white font-bold py-3 rounded-lg hover:bg-[#803d9c] transition-colors disabled:bg-zinc-500 disabled:cursor-not-allowed">
                    {uploadingBanner ? 'Enviando...' : 'Salvar Nova Capa'}
                </button>
            </div>
        )}

        {/* --- SEÇÃO 3: FORMULÁRIO DE INFORMAÇÕES (Campos variam por modo) --- */}
        <form onSubmit={handleProfileUpdate} className="space-y-4">
            <h4 className="font-bold text-white text-lg border-b-2 border-zinc-700 w-full text-center pb-2">Editar Informações</h4>
            
            {/* Campos para TODOS */}
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">Nome de Usuário</label>
                <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 bg-zinc-800 rounded text-white focus:outline-none focus:border-[#f1c40f] border-2 border-transparent transition-colors"/>
            </div>
            <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">Descrição (Bio)</label>
                <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows="4" className="w-full p-3 bg-zinc-800 rounded text-white focus:outline-none focus:border-[#f1c40f] border-2 border-transparent transition-colors"/>
            </div>
            
            {/* Campos apenas para PARCEIROS */}
            {mode === 'partner' && (
                <>
                    <div>
                        <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-300 mb-1">Link do YouTube</label>
                        <input type="url" id="youtubeUrl" placeholder="https://youtube.com/..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="w-full p-3 bg-zinc-800 rounded text-white"/>
                    </div>
                    <div>
                        <label htmlFor="instagramUrl" className="block text-sm font-medium text-gray-300 mb-1">Link do Instagram</label>
                        <input type="url" id="instagramUrl" placeholder="https://instagram.com/..." value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className="w-full p-3 bg-zinc-800 rounded text-white"/>
                    </div>
                    <div>
                        <label htmlFor="xUrl" className="block text-sm font-medium text-gray-300 mb-1">Link do X (Twitter)</label>
                        <input type="url" id="xUrl" placeholder="https://x.com/..." value={xUrl} onChange={(e) => setXUrl(e.target.value)} className="w-full p-3 bg-zinc-800 rounded text-white"/>
                    </div>
                </>
            )}

            <button type="submit" disabled={saving} className="w-full bg-[#f1c40f] text-black font-bold py-3 rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-zinc-500 disabled:cursor-not-allowed">
                {saving ? 'Salvando...' : 'Salvar Informações'}
            </button>
        </form>
    </div>
);
}