import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useUpload } from '../contexts/UploadProvider';
import { useNotification } from '../contexts/NotificationProvider.jsx';
import Select from 'react-select';
import FileDropzone from '../components/upload/FileDropzone';
import {
    ACCEPTED_THUMBNAIL_TYPES,
    ACCEPTED_VIDEO_TYPES,
    MAX_THUMBNAIL_SIZE_BYTES,
    MAX_VIDEO_SIZE_BYTES,
    formatFileSize,
    validateThumbnailFile,
    validateVideoFile,
} from '../utils/uploadValidation.js';

const allCategories = [
  'Nacionais', 'Internacionais', 'Não solucionados', 'Solucionados',
  'Serial Killers', 'Documentários', 'Sobrenaturais',
];

const uploadBusyStatuses = ['uploading', 'saving'];

const SHORT_TYPE_OPTIONS = [
  { value: 'update', label: 'Atualização' },
  { value: 'intro', label: 'Prévia' },
  { value: 'flash', label: 'Flash' },
];

const fallbackExtensionsByType = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: '#121212',
    borderColor: state.isFocused ? '#a855f7' : '#3f3f46',
    boxShadow: 'none',
    minHeight: '44px',
    '&:hover': { borderColor: '#a855f7' },
  }),
  singleValue: (base) => ({ ...base, color: 'white' }),
  input: (base) => ({ ...base, color: 'white' }),
  placeholder: (base) => ({ ...base, color: '#71717a', fontSize: '13px' }),
  menu: (base) => ({ ...base, backgroundColor: '#121212', border: '1px solid #3f3f46' }),
  option: (base, { isFocused, isSelected }) => ({
    ...base,
    backgroundColor: isSelected ? '#7c3aed' : isFocused ? '#1a1a1a' : '#121212',
    color: 'white',
    fontSize: '13px',
    ':active': { backgroundColor: '#6d28d9' },
  }),
};

function getFileExtension(file) {
  return file.name.split('.').pop()?.toLowerCase() || fallbackExtensionsByType[file.type] || 'bin';
}

function normalizeVideoFields(formData, creatorId) {
  return {
    title: formData.title.trim(),
    description: formData.description.trim(),
    category: formData.category,
    tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    creator_id: creatorId,
    is_short: Boolean(formData.is_short),
    short_type: formData.is_short ? formData.short_type || 'update' : null,
    parent_video_id: formData.is_short && formData.parent_video_id
      ? formData.parent_video_id
      : null,
  };
}

function ShortToggle({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-300 disabled:opacity-50 ${
        checked ? 'bg-[#8e44ad]' : 'bg-zinc-700'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-[#f1c40f] shadow transition-transform duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function CreatorUploadForm({ user, profile, onSuccess, videoToEdit }) {
  const { startUpload, uploadState } = useUpload();
  const { showNotification } = useNotification();
  const isUploadBusy = uploadBusyStatuses.includes(uploadState.status);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: [],
    tags: '',
    is_short: false,
    short_type: null,
    parent_video_id: null,
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentVideos, setParentVideos] = useState([]);

  useEffect(() => {
    const fetchUserVideos = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('videos')
        .select('id, title')
        .eq('creator_id', user.id)
        .eq('is_short', false)
        .is('parent_video_id', null)
        .order('created_at', { ascending: false });

      if (!error) setParentVideos(data || []);
    };

    fetchUserVideos();
  }, [user]);

  useEffect(() => {
    if (videoToEdit) {
      setFormData({
        title: videoToEdit.title || '',
        description: videoToEdit.description || '',
        category: Array.isArray(videoToEdit.category) ? videoToEdit.category : [],
        tags: Array.isArray(videoToEdit.tags) ? videoToEdit.tags.join(', ') : '',
        is_short: videoToEdit.is_short || false,
        short_type: videoToEdit.short_type || null,
        parent_video_id: videoToEdit.parent_video_id || null,
      });
    }
  }, [videoToEdit]);

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleVideoFile = (file) => {
    const validationError = validateVideoFile(file);
    if (validationError) {
      showNotification('error', validationError);
      return;
    }
    setVideoFile(file);
  };

  const handleThumbnailFile = (file) => {
    const validationError = validateThumbnailFile(file);
    if (validationError) {
      showNotification('error', validationError);
      return;
    }
    setThumbnailFile(file);
  };

  const handleCategoryChange = (category) => {
    setFormData((prev) => {
      const newCategories = prev.category.includes(category)
        ? prev.category.filter((c) => c !== category)
        : [...prev.category, category];
      return { ...prev, category: newCategories };
    });
  };

  const handleShortToggle = (isShort) => {
    setFormData((prev) => ({
      ...prev,
      is_short: isShort,
      short_type: isShort ? prev.short_type || 'update' : null,
      parent_video_id: isShort ? prev.parent_video_id : null,
    }));
  };

  const videoOptions = parentVideos.map((video) => ({
    value: video.id,
    label: video.title,
  }));

  const handleParentVideoChange = (selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      parent_video_id: selectedOption ? selectedOption.value : null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!user) throw new Error('Você precisa estar logado para publicar ou editar vídeos.');
      if (profile?.role !== 'partner') throw new Error('Apenas parceiros podem publicar ou editar vídeos.');
      if (!formData.title.trim()) throw new Error('O título do caso é obrigatório.');

      if (formData.is_short && !formData.parent_video_id) {
        throw new Error('Selecione o caso principal para vincular este Short.');
      }

      if (!videoToEdit && !videoFile) throw new Error('Um arquivo de vídeo é obrigatório.');
      if (!videoToEdit && !thumbnailFile) throw new Error('Uma thumbnail é obrigatória.');

      if (videoFile) {
        const videoValidationError = validateVideoFile(videoFile);
        if (videoValidationError) throw new Error(videoValidationError);
      }

      if (thumbnailFile) {
        const thumbnailValidationError = validateThumbnailFile(thumbnailFile);
        if (thumbnailValidationError) throw new Error(thumbnailValidationError);
      }

      if (videoToEdit?.creator_id && videoToEdit.creator_id !== user.id) {
        throw new Error('Você não tem permissão para editar este vídeo.');
      }

      if (isUploadBusy) {
        throw new Error('Aguarde o upload atual terminar antes de enviar outro.');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão inválida.');

      const baseVideoFields = normalizeVideoFields(formData, user.id);
      let thumbnailUrl = videoToEdit?.thumbnail || '';

      if (thumbnailFile) {
        const thumbFileExt = getFileExtension(thumbnailFile);
        const thumbFileName = `thumb-${user.id}-${Date.now()}.${thumbFileExt}`;
        const { error: uploadThumbError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbFileName, thumbnailFile, { upsert: Boolean(videoToEdit) });
        if (uploadThumbError) throw uploadThumbError;

        const { data: thumbUrlData } = supabase.storage.from('thumbnails').getPublicUrl(thumbFileName);
        thumbnailUrl = thumbUrlData.publicUrl;
      }

      if (videoToEdit) {
        const dataToUpdate = { ...baseVideoFields, thumbnail: thumbnailUrl };

        if (videoFile) {
          const videoFileExt = getFileExtension(videoFile);
          const videoFileName = `video-${user.id}-${Date.now()}.${videoFileExt}`;

          startUpload({
            file: videoFile,
            token: session.access_token,
            supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
            bucketName: 'videos',
            objectName: videoFileName,
          }, {
            action: 'update',
            id: videoToEdit.id,
            ...dataToUpdate,
          });

          showNotification('info', 'Novo arquivo em upload. As informações serão salvas ao concluir.');
          if (onSuccess) onSuccess();
          return;
        }

        const { error } = await supabase
          .from('videos')
          .update(dataToUpdate)
          .eq('id', videoToEdit.id)
          .eq('creator_id', user.id);
        if (error) throw error;

        showNotification('success', 'Informações do vídeo atualizadas com sucesso!');
        if (onSuccess) onSuccess();
        return;
      }

      const videoFileExt = getFileExtension(videoFile);
      const videoFileName = `video-${user.id}-${Date.now()}.${videoFileExt}`;
      const metadataToSave = {
        action: 'insert',
        ...baseVideoFields,
        thumbnail: thumbnailUrl,
        views: 0,
        gostei_muito: 0,
        gostei: 0,
        nao_gostei: 0,
      };

      startUpload({
        file: videoFile,
        token: session.access_token,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        bucketName: 'videos',
        objectName: videoFileName,
      }, metadataToSave);

      showNotification('info', 'Upload iniciado! Acompanhe o progresso no canto da tela.');
      if (onSuccess) onSuccess();
    } catch (error) {
      showNotification('error', `Erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isSubmitting || isUploadBusy;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          Título do Caso
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          disabled={isDisabled}
          className="mt-2 w-full bg-[#121212] rounded-lg border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FileDropzone
          id="thumbnailFile"
          accept={ACCEPTED_THUMBNAIL_TYPES.join(',')}
          disabled={isDisabled}
          label="Thumbnail"
          hint="Arraste a imagem aqui ou clique para selecionar"
          formatsHint={`JPEG, PNG ou WebP`}
          maxSizeHint={`Máx. ${formatFileSize(MAX_THUMBNAIL_SIZE_BYTES)}`}
          selectedFile={thumbnailFile}
          existingPreviewUrl={videoToEdit?.thumbnail}
          onFileSelect={handleThumbnailFile}
          previewType="image"
        />
        <FileDropzone
          id="videoFile"
          accept={ACCEPTED_VIDEO_TYPES.join(',')}
          disabled={isDisabled}
          label="Vídeo Principal"
          hint="Arraste o vídeo aqui ou clique para selecionar"
          formatsHint="MP4 ou WebM"
          maxSizeHint={`Máx. ${formatFileSize(MAX_VIDEO_SIZE_BYTES)}`}
          selectedFile={videoFile}
          onFileSelect={handleVideoFile}
          previewType="video"
        />
      </div>

      <div>
        <label htmlFor="description" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows="4"
          value={formData.description}
          onChange={handleChange}
          disabled={isDisabled}
          className="mt-2 w-full bg-[#121212] rounded-lg border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50 resize-none"
        />
      </div>

      <div className="rounded-lg border border-zinc-800 bg-[#121212] p-5 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white">Este vídeo é um Short?</p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Shorts são exibidos na seção de atualizações e não aparecem no catálogo principal.
            </p>
          </div>
          <ShortToggle
            checked={formData.is_short}
            disabled={isDisabled}
            onChange={handleShortToggle}
          />
        </div>

        {formData.is_short && (
          <div className="space-y-5 pt-2 border-t border-zinc-800">
            <div>
              <label htmlFor="parent_video_id" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                Vincular ao Caso Principal
              </label>
              <div className="mt-2">
                <Select
                  inputId="parent_video_id"
                  options={videoOptions}
                  isClearable
                  isSearchable
                  isDisabled={isDisabled}
                  placeholder="Selecione o caso ao qual esta atualização pertence…"
                  onChange={handleParentVideoChange}
                  value={videoOptions.find((option) => option.value === formData.parent_video_id) || null}
                  styles={selectStyles}
                  noOptionsMessage={() => 'Nenhum caso longo publicado ainda.'}
                />
              </div>
            </div>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-3">
                Tipo de Short
              </p>
              <div className="flex flex-wrap gap-2">
                {SHORT_TYPE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setFormData((prev) => ({ ...prev, short_type: value }))}
                    className={`px-4 py-1.5 text-xs font-mono uppercase tracking-wider rounded-full transition-colors disabled:opacity-50 ${
                      formData.short_type === value
                        ? 'bg-[#8e44ad] text-[#f1c40f] font-bold'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-3">
            Categoria(s)
          </p>
          <div className="flex flex-wrap gap-2">
            {allCategories.map((cat) => (
              <button
                type="button"
                key={cat}
                disabled={isDisabled}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-full transition-colors disabled:opacity-50 ${
                  formData.category.includes(cat)
                    ? 'bg-[#f1c40f] text-black font-bold'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="tags" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Tags (separadas por vírgula)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            disabled={isDisabled}
            className="mt-2 w-full bg-[#121212] rounded-lg border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isDisabled}
        className="w-full bg-[#8e44ad] hover:bg-[#803d9c] text-white font-mono uppercase tracking-wider text-sm py-3.5 rounded-lg transition-colors duration-200 disabled:bg-zinc-700 disabled:cursor-not-allowed"
      >
        {isSubmitting
          ? 'Preparando…'
          : uploadState.status === 'uploading'
            ? `Enviando… ${uploadState.progress}%`
            : uploadState.status === 'saving'
              ? 'Salvando…'
              : (videoToEdit ? 'Salvar Alterações' : 'Publicar Vídeo')}
      </button>
    </form>
  );
}
