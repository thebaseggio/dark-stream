import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useUpload } from '../contexts/UploadProvider';
import { useNotification } from '../contexts/NotificationProvider.jsx';
import Select from 'react-select';
import {
    ACCEPTED_THUMBNAIL_TYPES,
    ACCEPTED_VIDEO_TYPES,
    validateThumbnailFile,
    validateVideoFile,
} from '../utils/uploadValidation.js';

const allCategories = [ 'Nacionais', 'Internacionais', 'Não solucionados', 'Solucionados', 'Serial Killers', 'Documentários', 'Sobrenaturais'];
const uploadBusyStatuses = ['uploading', 'saving'];
const fallbackExtensionsByType = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
};

function getFileExtension(file) {
    return file.name.split('.').pop()?.toLowerCase() || fallbackExtensionsByType[file.type] || 'bin';
}

function normalizeVideoFields(formData, creatorId) {
    return {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        creator_id: creatorId,
        is_short: formData.is_short || false,
        short_type: formData.is_short ? formData.short_type : null,
        parent_video_id: formData.is_short && (formData.short_type === 'update' || formData.short_type === 'intro')
            ? formData.parent_video_id
            : null,
    };
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
    short_type: null 
});
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [parentVideos, setParentVideos] = useState([]);


        useEffect(() => {
        if (videoToEdit) return;

        const fetchUserVideos = async () => {
            if (!user) return;
            
            const { data, error } = await supabase
                .from('videos')
                .select('id, title')
                .eq('creator_id', user.id)
                .eq('is_short', false)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Erro ao buscar vídeos do usuário:", error);
            } else {
                setParentVideos(data);
            }
        };

        fetchUserVideos();
    }, [user, videoToEdit]);

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

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

        const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files[0]) {
            const selectedFile = files[0];
            const validationError = name === 'videoFile'
                ? validateVideoFile(selectedFile)
                : validateThumbnailFile(selectedFile);

            if (validationError) {
                showNotification('error', validationError);
                e.target.value = '';
                if (name === 'videoFile') setVideoFile(null);
                else if (name === 'thumbnailFile') setThumbnailFile(null);
                return;
            }

            if (name === 'videoFile') setVideoFile(selectedFile);
            else if (name === 'thumbnailFile') setThumbnailFile(selectedFile);
        }
    };

    // Nova função para lidar com a seleção de múltiplas categorias
    const handleCategoryChange = (category) => {
        setFormData(prev => {
            const newCategories = prev.category.includes(category)
                ? prev.category.filter(c => c !== category) // Desmarca
                : [...prev.category, category]; // Marca
            return { ...prev, category: newCategories };
        });
    };
    
  const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
          if (!user) {
              throw new Error('Você precisa estar logado para publicar ou editar vídeos.');
          }

          if (profile?.role !== 'partner') {
              throw new Error('Apenas parceiros podem publicar ou editar vídeos.');
          }

          if (!formData.title.trim()) {
              throw new Error('O título do caso é obrigatório.');
          }

          if (formData.is_short && !formData.short_type) {
              throw new Error('Selecione o tipo do Short.');
          }

          if (formData.is_short && ['update', 'intro'].includes(formData.short_type) && !formData.parent_video_id) {
              throw new Error('Selecione o caso principal para este Short.');
          }

          const videoValidationError = validateVideoFile(videoFile);
          if (videoValidationError) throw new Error(videoValidationError);

          const thumbnailValidationError = validateThumbnailFile(thumbnailFile);
          if (thumbnailValidationError) throw new Error(thumbnailValidationError);

          if (videoToEdit?.creator_id && videoToEdit.creator_id !== user.id) {
              throw new Error('Você não tem permissão para editar este vídeo.');
          }

          if (!videoToEdit && !videoFile) {
              throw new Error('Um arquivo de vídeo é obrigatório.');
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
              const dataToUpdate = {
                  ...baseVideoFields,
                  thumbnail: thumbnailUrl,
              };

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

  const videoOptions = parentVideos.map(video => ({
    value: video.id,
    label: video.title
}));

const handleParentVideoChange = (selectedOption) => {
    setFormData(prev => ({ ...prev, parent_video_id: selectedOption ? selectedOption.value : null }));
};


    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">Título do Caso</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} disabled={isSubmitting || isUploadBusy} className="w-full bg-zinc-800 rounded border border-zinc-700 p-2 focus:outline-none focus:border-[#f1c40f] disabled:opacity-50" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="thumbnailFile" className="block text-sm font-medium mb-1">Thumbnail</label>
                    <input 
                        type="file" id="thumbnailFile" name="thumbnailFile"
                        onChange={handleFileChange}
                        disabled={isSubmitting || isUploadBusy}
                        accept={ACCEPTED_THUMBNAIL_TYPES.join(',')}
                        className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>
                <div>
                    <label htmlFor="videoFile" className="block text-sm font-medium mb-1">Vídeo Principal</label>
                    <input 
                        type="file" id="videoFile" name="videoFile"
                        onChange={handleFileChange}
                        disabled={isSubmitting || isUploadBusy}
                        accept={ACCEPTED_VIDEO_TYPES.join(',')}
                        className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">Descrição</label>
                <textarea name="description" rows="4" value={formData.description} onChange={handleChange} disabled={isSubmitting || isUploadBusy} className="w-full bg-zinc-800 rounded border border-zinc-700 p-2 disabled:opacity-50"></textarea>
            </div>
                    <div className="space-y-2">
<div className="space-y-4 rounded-lg border border-zinc-700 p-4">
    <div className="flex items-center gap-3">
        <input
            type="checkbox"
            id="is_short"
            name="is_short"
            checked={formData.is_short || false}
            onChange={(e) => setFormData(prev => ({ ...prev, is_short: e.target.checked, short_type: e.target.checked ? prev.short_type : null }))}
            className="h-4 w-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
        />
        <label htmlFor="is_short" className="text-sm font-medium">Este vídeo é um Short?</label>
    </div>

    {/* Conteúdo que só aparece quando 'is_short' está marcado */}
    {formData.is_short && (
        <div className="pl-7 space-y-4">
            {/* Seletor de Tipo de Short */}
            <div>
                <p className="text-sm text-zinc-400 mb-2">Qual o tipo de Short?</p>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setFormData(prev => ({...prev, short_type: 'update'}))} 
                        className={`px-3 py-1 text-sm rounded-full ${formData.short_type === 'update' ? 'bg-blue-500 text-white font-bold' : 'bg-zinc-700 hover:bg-zinc-600'}`}>
                        Update
                    </button>
                    <button type="button" onClick={() => setFormData(prev => ({...prev, short_type: 'intro'}))} 
                        className={`px-3 py-1 text-sm rounded-full ${formData.short_type === 'intro' ? 'bg-purple-600 text-white font-bold' : 'bg-zinc-700 hover:bg-zinc-600'}`}>
                        Prévia
                    </button>
                    <button type="button" onClick={() => setFormData(prev => ({...prev, short_type: 'flash'}))} 
                        className={`px-3 py-1 text-sm rounded-full ${formData.short_type === 'flash' ? 'bg-yellow-500 text-black font-bold' : 'bg-zinc-700 hover:bg-zinc-600'}`}>
                        Flash
                    </button>
                </div>
            </div>

            {/* Dropdown condicional para selecionar o vídeo principal */}
            {(formData.short_type === 'update' || formData.short_type === 'intro') && (
                <div>
                    <label htmlFor="parent_video_id" className="block text-sm font-medium mb-1">Selecione o caso principal</label>
                    <Select
                        id="parent_video_id"
                        name="parent_video_id"
                        options={videoOptions}
                        isClearable
                        isSearchable
                        placeholder="Digite para buscar um vídeo..."
                        onChange={handleParentVideoChange}
                        value={videoOptions.find(option => option.value === formData.parent_video_id)}
                        styles={{
                            control: (base) => ({ ...base, backgroundColor: '#27272a', borderColor: '#3f3f46' }),
                            singleValue: (base) => ({ ...base, color: 'white' }),
                            input: (base) => ({ ...base, color: 'white' }),
                            menu: (base) => ({ ...base, backgroundColor: '#27272a' }),
                            option: (base, { isFocused }) => ({
                                ...base,
                                backgroundColor: isFocused ? '#3f3f46' : '#27272a',
                                color: 'white',
                                ':active': { backgroundColor: '#52525b' },
                            }),
                        }}
                    />
                </div>
            )}
        </div>
    )}
</div>
</div>
    
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"> {/* Ocupa a largura inteira */}
                    <label className="block text-sm font-medium mb-2">Categoria(s)</label>
                    <div className="flex flex-wrap gap-2">
                        {allCategories.map(cat => (
                            <button
                                type="button" // Importante para não submeter o formulário
                                key={cat}
                                onClick={() => handleCategoryChange(cat)}
                                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                    formData.category.includes(cat)
                                        ? 'bg-[#f1c40f] text-black font-bold'
                                        : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label htmlFor="tags" className="block text-sm font-medium mb-1">Tags (separadas por vírgula)</label>
                    <input type="text" name="tags" value={formData.tags} onChange={handleChange} disabled={isSubmitting || isUploadBusy} className="w-full bg-zinc-800 rounded border border-zinc-700 p-2" />
                </div>
            </div>

            <button type="submit" disabled={isSubmitting || isUploadBusy} className="w-full bg-[#8e44ad] hover:bg-[#803d9c] text-white font-bold py-3 rounded-lg transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed">
                {isSubmitting ? 'Preparando...' 
                 : uploadState.status === 'uploading' ? `Enviando... ${uploadState.progress}%`
                 : uploadState.status === 'saving' ? 'Salvando...'
                 : (videoToEdit ? 'Salvar Alterações' : 'Fazer Upload')}
            </button>
        </form>
    );
}