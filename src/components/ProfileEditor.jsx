// src/components/ProfileEditor.jsx

import React, { useState, useEffect } from 'react'; // <-- A CORREÇÃO PRINCIPAL ESTÁ AQUI
import { supabase } from '../supabase';

export default function ProfileEditor({ user, profile, onUploadSuccess, onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  // Efeito para popular os campos quando o perfil for carregado
  useEffect(() => {
    if (profile) {
      setAvatarPreview(profile.creatorAvatar || null);
      setUsername(profile.username || '');
      setBio(profile.bio || '');
    }
  }, [profile]);


  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) {
      if (onSuccess) onSuccess('error', 'Por favor, selecione uma imagem primeiro.');
      return;
    }
    try {
      setUploading(true);
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const { error: updateError } = await supabase.from('profiles').update({ creatorAvatar: urlData.publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;
      if (onSuccess) onSuccess('success', 'Foto de perfil atualizada com sucesso!');
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      if (onSuccess) onSuccess('error', `Erro ao atualizar a foto: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username, bio })
        .eq('id', user.id);

      if (error) throw error;

      if (onSuccess) onSuccess('success', 'Perfil atualizado com sucesso!');
      if (onUploadSuccess) onUploadSuccess(); // Reutilizamos para avisar o App e recarregar os dados
    } catch (error) {
      if (onSuccess) onSuccess('error', `Erro ao atualizar perfil: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* --- SEÇÃO 1: FOTO DE PERFIL --- */}
      <div className="flex flex-col items-center gap-4">
        <h4 className="font-bold text-white text-lg border-b-2 border-zinc-700 w-full text-center pb-2">Alterar Foto</h4>
        <img
          src={avatarPreview || `https://ui-avatars.com/api/?name=${username.charAt(0)}&background=f1c40f&color=000&size=128`}
          alt="Avatar Preview"
          className="w-32 h-32 rounded-full object-cover border-4 border-zinc-700"
        />
        <input type="file" id="avatar-upload" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} disabled={uploading}/>
        <label htmlFor="avatar-upload" className="w-full cursor-pointer bg-zinc-700 text-white text-sm font-semibold text-center py-2 px-4 rounded-lg hover:bg-zinc-600 transition-colors block">
          Escolher Imagem
        </label>
        <button onClick={handleUploadAvatar} disabled={uploading || !avatarFile} className="w-full bg-[#8e44ad] text-white font-bold py-3 rounded-lg hover:bg-[#803d9c] transition-colors disabled:bg-zinc-500 disabled:cursor-not-allowed">
          {uploading ? 'Enviando...' : 'Salvar Nova Foto'}
        </button>
      </div>

      {/* --- SEÇÃO 2: INFORMAÇÕES DO PERFIL --- */}
      <form onSubmit={handleProfileUpdate} className="space-y-4">
        <h4 className="font-bold text-white text-lg border-b-2 border-zinc-700 w-full text-center pb-2">Editar Informações</h4>
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">Nome de Usuário</label>
          <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 bg-zinc-800 rounded text-white focus:outline-none focus:border-[#f1c40f] border-2 border-transparent transition-colors"/>
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">Descrição (Bio)</label>
          <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows="4" className="w-full p-3 bg-zinc-800 rounded text-white focus:outline-none focus:border-[#f1c40f] border-2 border-transparent transition-colors"/>
        </div>
        <button type="submit" disabled={saving} className="w-full bg-[#f1c40f] text-black font-bold py-3 rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-zinc-500 disabled:cursor-not-allowed">
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
    </div>
  );
}