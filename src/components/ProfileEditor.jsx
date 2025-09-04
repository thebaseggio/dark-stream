// src/components/ProfileEditor.jsx

import React, { useState } from 'react';
import { supabase } from '../supabase';

// A prop 'onSuccess' foi adicionada para nos permitir mostrar notificações customizadas.
export default function ProfileEditor({ user, profile, onUploadSuccess, onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.creatorAvatar || null);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    // MODIFICAÇÃO 1: Substituímos o 'alert' por uma chamada à função 'onSuccess'.
    if (!avatarFile) {
      if (onSuccess) onSuccess('error', 'Por favor, selecione uma imagem primeiro.');
      return;
    }

    try {
      setUploading(true);

      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const newAvatarUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ creatorAvatar: newAvatarUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // MODIFICAÇÃO 2: Substituímos o 'alert' de sucesso pela chamada à função 'onSuccess'.
      if (onSuccess) onSuccess('success', 'Foto de perfil atualizada com sucesso!');
      
      // onUploadSuccess ainda é útil para avisar o componente pai que os dados precisam ser recarregados.
      if (onUploadSuccess) {
        onUploadSuccess(newAvatarUrl);
      }
    } catch (error) {
      // MODIFICAÇÃO 3: Substituímos o 'alert' de erro pela chamada à função 'onSuccess'.
      if (onSuccess) onSuccess('error', `Erro ao atualizar a foto: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <img
        src={avatarPreview || `https://ui-avatars.com/api/?name=${profile?.username?.charAt(0)}&background=f1c40f&color=000&size=128`}
        alt="Avatar Preview"
        className="w-32 h-32 rounded-full object-cover border-4 border-zinc-700"
      />
      <div className="w-full">
        <label htmlFor="avatar-upload" className="w-full cursor-pointer bg-zinc-700 text-white text-sm font-semibold text-center py-2 px-4 rounded-lg hover:bg-zinc-600 transition-colors block">
          Escolher Imagem
        </label>
        <input
          type="file"
          id="avatar-upload"
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>
      <button
        onClick={handleUpload}
        disabled={uploading || !avatarFile}
        className="w-full bg-[#8e44ad] text-white font-bold py-3 rounded-lg hover:bg-[#803d9c] transition-colors disabled:bg-zinc-500 disabled:cursor-not-allowed"
      >
        {uploading ? 'Enviando...' : 'Salvar Nova Foto'}
      </button>
    </div>
  );
}