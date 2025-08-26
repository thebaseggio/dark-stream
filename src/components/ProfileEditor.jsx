// src/components/ProfileEditor.jsx

import React, { useState } from 'react';
import { supabase } from '../supabase';

export default function ProfileEditor({ user, profile, onUploadSuccess }) {
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
    if (!avatarFile) {
      alert("Por favor, selecione uma imagem primeiro.");
      return;
    }

    try {
      setUploading(true);

      const fileExt = avatarFile.name.split('.').pop();
      // The file path is structured as `public/folderName/fileName`
      // Our policy requires the folderName to be the user's ID.
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload the file to the 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
            upsert: true // This will overwrite the file if it already exists
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const newAvatarUrl = urlData.publicUrl;

      // Update the 'creatorAvatar' column in the user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ creatorAvatar: newAvatarUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      alert('Foto de perfil atualizada com sucesso!');
      if (onUploadSuccess) {
        onUploadSuccess(newAvatarUrl); // Send the new URL back to the parent
      }
    } catch (error) {
      alert(`Erro ao atualizar a foto: ${error.message}`);
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