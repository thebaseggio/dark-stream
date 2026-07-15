import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import {
  resolveAvatarUrl,
  resolveBannerUrl,
  uploadAvatarImage,
  uploadBannerImage,
  persistProfileUpdate,
  persistAvatarUrl,
  persistBannerUrl,
  isValidRenderableUrl,
} from '../utils/profileMedia';

const CameraIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z" />
    <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
  </svg>
);

const inputClass =
  'w-full px-4 py-3 bg-[#121212] border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#eab308] transition-colors';

const labelClass = 'block text-sm text-neutral-400 mb-2';

function ImageUploadCard({
  title,
  description,
  preview,
  fallbackPreview,
  alt,
  aspectClass,
  inputId,
  onChange,
  onUpload,
  uploading,
  hasFile,
  uploadLabel,
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm text-white">{title}</p>
        {description && <p className="text-xs text-neutral-400 mt-1">{description}</p>}
      </div>

      <div className={`relative overflow-hidden border border-neutral-800 bg-black ${aspectClass}`}>
        <img
          src={preview || fallbackPreview}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="file"
          id={inputId}
          className="hidden"
          accept="image/*"
          onChange={onChange}
          disabled={uploading}
        />
        <label
          htmlFor={inputId}
          className="inline-flex items-center gap-2 cursor-pointer border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 text-xs font-mono uppercase tracking-wider px-3 py-2 transition-colors"
        >
          <CameraIcon className="w-4 h-4" />
          Escolher
        </label>
        {hasFile && (
          <button
            type="button"
            onClick={onUpload}
            disabled={uploading}
            className="border border-neutral-800 text-white hover:border-[#eab308] hover:text-[#eab308] text-xs font-mono uppercase tracking-wider px-3 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Enviando...' : uploadLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProfileEditor({ user, profile, onUploadSuccess, onSaveComplete, onSuccess, mode = 'visitor' }) {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saving, setSaving] = useState(false);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const [savedAvatarUrl, setSavedAvatarUrl] = useState(null);
  const [savedBannerUrl, setSavedBannerUrl] = useState(null);

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [xUrl, setXUrl] = useState('');

  useEffect(() => {
    if (profile) {
      const avatar = resolveAvatarUrl(profile);
      const banner = resolveBannerUrl(profile);

      setAvatarPreview(avatar || null);
      setBannerPreview(banner || null);
      setSavedAvatarUrl(avatar || null);
      setSavedBannerUrl(banner || null);
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setYoutubeUrl(profile.youtube_url || '');
      setInstagramUrl(profile.instagram_url || '');
      setXUrl(profile.x_url || '');
    }
  }, [profile]);

  const handleAvatarChange = (event) => {
    if (event.target.files?.[0]) {
      const file = event.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (event) => {
    if (event.target.files?.[0]) {
      const file = event.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadImage = async (file, storageBucket, successMessage) => {
    if (!file) {
      onSuccess('error', 'Por favor, selecione uma imagem primeiro.');
      return;
    }

    const isAvatar = storageBucket === 'avatars';
    if (isAvatar) setUploadingAvatar(true);
    else setUploadingBanner(true);

    try {
      const { publicUrl } = isAvatar
        ? await uploadAvatarImage(user.id, file)
        : await uploadBannerImage(user.id, file);

      console.log('[Upload Debug] URL pública gerada:', publicUrl);

      const { data: updatedProfile, error: saveError } = isAvatar
        ? await persistAvatarUrl(supabase, user.id, publicUrl)
        : await persistBannerUrl(supabase, user.id, publicUrl);

      if (saveError || !updatedProfile) {
        throw saveError || new Error('Não foi possível salvar a URL no perfil.');
      }

      if (isAvatar) {
        setAvatarFile(null);
        setSavedAvatarUrl(publicUrl);
        setAvatarPreview(resolveAvatarUrl(updatedProfile) || publicUrl);
      } else {
        setBannerFile(null);
        setSavedBannerUrl(publicUrl);
        setBannerPreview(resolveBannerUrl(updatedProfile) || publicUrl);
      }

      onSuccess('success', successMessage);
      if (onUploadSuccess) await onUploadSuccess(updatedProfile);
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      onSuccess('error', `Erro ao enviar imagem: ${error.message}`);
    } finally {
      if (isAvatar) setUploadingAvatar(false);
      else setUploadingBanner(false);
    }
  };

  const buildProfilePayload = () => {
    const payload = {
      username,
      bio,
      youtube_url: youtubeUrl || null,
      instagram_url: instagramUrl || null,
      x_url: xUrl || null,
    };

    if (savedAvatarUrl && isValidRenderableUrl(savedAvatarUrl)) {
      payload.avatar_url = savedAvatarUrl;
      payload.creatorAvatar = savedAvatarUrl;
    }

    if (mode === 'partner' && savedBannerUrl && isValidRenderableUrl(savedBannerUrl)) {
      payload.banner_url = savedBannerUrl;
    }

    return payload;
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let payload = buildProfilePayload();

      if (avatarFile) {
        const { publicUrl } = await uploadAvatarImage(user.id, avatarFile);
        payload = { ...payload, avatar_url: publicUrl, creatorAvatar: publicUrl };
        setSavedAvatarUrl(publicUrl);
        setAvatarFile(null);
      }

      if (mode === 'partner' && bannerFile) {
        const { publicUrl } = await uploadBannerImage(user.id, bannerFile);
        payload = { ...payload, banner_url: publicUrl };
        setSavedBannerUrl(publicUrl);
        setBannerFile(null);
      }

      const { data: updatedProfile, error } = await persistProfileUpdate(supabase, user.id, payload);

      if (error || !updatedProfile) {
        throw error || new Error('Não foi possível salvar o perfil.');
      }

      setSavedAvatarUrl(resolveAvatarUrl(updatedProfile) || savedAvatarUrl);
      setSavedBannerUrl(resolveBannerUrl(updatedProfile) || savedBannerUrl);

      onSuccess('success', 'Alterações salvas com sucesso!');
      if (onSaveComplete) await onSaveComplete(updatedProfile);
      else if (onUploadSuccess) await onUploadSuccess(updatedProfile);
    } catch (error) {
      console.error('Erro ao atualizar informações:', error);
      onSuccess('error', `Erro ao atualizar informações: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const avatarFallback = `https://ui-avatars.com/api/?name=${username.charAt(0) || 'U'}&background=121212&color=eab308&bold=true`;
  const bannerFallback = 'https://placehold.co/1200x400/0a0a0a/404040?text=Banner+do+Canal';

  const formFields = (
    <>
      <div>
        <label htmlFor="username" className={labelClass}>Nome de Usuário</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="bio" className={labelClass}>Descrição (Bio)</label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder="Conte um pouco sobre você ou seu canal..."
          className={`${inputClass} resize-y min-h-[120px]`}
        />
      </div>

      {mode === 'partner' && (
        <>
          <div>
            <label htmlFor="youtubeUrl" className={labelClass}>Link do YouTube</label>
            <input
              type="url"
              id="youtubeUrl"
              placeholder="https://youtube.com/..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="instagramUrl" className={labelClass}>Link do Instagram</label>
            <input
              type="url"
              id="instagramUrl"
              placeholder="https://instagram.com/..."
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="xUrl" className={labelClass}>Link do X (Twitter)</label>
            <input
              type="url"
              id="xUrl"
              placeholder="https://x.com/..."
              value={xUrl}
              onChange={(e) => setXUrl(e.target.value)}
              className={inputClass}
            />
          </div>
        </>
      )}
    </>
  );

  if (mode === 'partner') {
    return (
      <div className="max-h-[75vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10">
          <div className="md:col-span-5 space-y-8">
            <div>
              <h4 className="font-anton text-lg text-white">Identidade Visual</h4>
              <p className="text-sm text-neutral-400 mt-2">
                Personalize como seu canal aparece para os investigadores.
              </p>
            </div>

            <ImageUploadCard
              title="Foto de Perfil"
              description="Exibida ao lado do nome no seu QG."
              preview={avatarPreview}
              fallbackPreview={avatarFallback}
              alt="Avatar"
              aspectClass="w-36 h-36 mx-auto md:mx-0"
              inputId="avatar-upload"
              onChange={handleAvatarChange}
              onUpload={() => handleUploadImage(avatarFile, 'avatars', 'Foto de perfil atualizada!')}
              uploading={uploadingAvatar}
              hasFile={!!avatarFile}
              uploadLabel="Enviar foto"
            />

            <ImageUploadCard
              title="Imagem de Capa"
              description="Banner exibido no topo do seu canal — proporção panorâmica."
              preview={bannerPreview}
              fallbackPreview={bannerFallback}
              alt="Banner"
              aspectClass="w-full aspect-[21/9] min-h-[120px]"
              inputId="banner-upload"
              onChange={handleBannerChange}
              onUpload={() => handleUploadImage(bannerFile, 'banners', 'Imagem de capa atualizada!')}
              uploading={uploadingBanner}
              hasFile={!!bannerFile}
              uploadLabel="Enviar capa"
            />
          </div>

          <div className="md:col-span-7">
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <h4 className="font-anton text-lg text-white">Informações de Cadastro</h4>
                <p className="text-sm text-neutral-400 mt-2">
                  Dados públicos exibidos no perfil do parceiro.
                </p>
              </div>

              {formFields}

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="submit"
                  disabled={saving || uploadingAvatar || uploadingBanner}
                  className="flex-1 bg-[#eab308] text-black font-mono uppercase tracking-wider text-xs px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 flex flex-col items-center md:items-start">
          <ImageUploadCard
            title="Foto de Perfil"
            preview={avatarPreview}
            fallbackPreview={avatarFallback}
            alt="Avatar"
            aspectClass="w-32 h-32"
            inputId="avatar-upload-visitor"
            onChange={handleAvatarChange}
            onUpload={() => handleUploadImage(avatarFile, 'avatars', 'Foto de perfil atualizada!')}
            uploading={uploadingAvatar}
            hasFile={!!avatarFile}
            uploadLabel="Enviar foto"
          />
        </div>

        <div className="md:col-span-7">
          <form onSubmit={handleProfileUpdate} className="space-y-5">
            {formFields}
            <button
              type="submit"
              disabled={saving || uploadingAvatar}
              className="w-full sm:w-auto bg-[#eab308] text-black font-mono uppercase tracking-wider text-xs px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
