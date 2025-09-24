import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useUpload } from '../contexts/UploadProvider';
import { useNotification } from '../contexts/NotificationProvider.jsx';

const allCategories = [ 'Nacionais', 'Internacionais', 'Não solucionados', 'Solucionados', 'Serial Killers', 'Documentários', 'Sobrenaturais'];

export default function CreatorUploadForm({ user, onSuccess, videoToEdit }) {
    const { startUpload, uploadState } = useUpload();
    const { showNotification } = useNotification();

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
            });
        }
    }, [videoToEdit]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

        const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files[0]) {
            if (name === 'videoFile') setVideoFile(files[0]);
            else if (name === 'thumbnailFile') setThumbnailFile(files[0]);
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
          if (videoToEdit) {
              const dataToUpdate = {
                  title: formData.title,
                  description: formData.description,
                  category: formData.category,
                  tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
              };

              // 1. Verifica se uma nova thumbnail foi enviada
              if (thumbnailFile) {
                  const thumbFileExt = thumbnailFile.name.split('.').pop();
                  const thumbFileName = `thumb-${user.id}-${Date.now()}.${thumbFileExt}`;
                  // Usamos 'upsert: true' para sobrescrever o arquivo antigo se existir um com mesmo nome
                  const { error: uploadThumbError } = await supabase.storage.from('thumbnails').upload(thumbFileName, thumbnailFile, { upsert: true });
                  if (uploadThumbError) throw uploadThumbError;
                  
                  const { data: thumbUrlData } = supabase.storage.from('thumbnails').getPublicUrl(thumbFileName);
                  dataToUpdate.thumbnail = thumbUrlData.publicUrl;
              }

              // 2. Verifica se um novo vídeo foi enviado
              if (videoFile) {
                  // Se um novo vídeo for enviado, usamos o sistema de worker
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session) throw new Error('Sessão inválida.');

                  const videoFileExt = videoFile.name.split('.').pop();
                  const videoFileName = `video-${user.id}-${Date.now()}.${videoFileExt}`;
                  
                  // Atualizamos a URL do vídeo nos dados a serem salvos
                  const { data: videoUrlData } = supabase.storage.from('videos').getPublicUrl(videoFileName);
                  dataToUpdate.videoUrl = videoUrlData.publicUrl;

                   startUpload({
                      file: videoFile,
                      token: session.access_token,
                      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
                      bucketName: 'videos',
                      objectName: videoFileName
                  });
              }

              // 3. Atualiza os metadados no banco de dados
              const { error } = await supabase.from('videos').update(dataToUpdate).eq('id', videoToEdit.id);
              if (error) throw error;
              
              showNotification('success', 'Informações do vídeo atualizadas com sucesso!');
              if (onSuccess) onSuccess();

          } else {
              if (!videoFile || !formData.title) throw new Error('Um arquivo de vídeo e um título são obrigatórios.');
              if (uploadState.status === 'uploading') throw new Error('Aguarde o upload atual terminar antes de enviar outro.');

              const { data: { session } } = await supabase.auth.getSession();
              if (!session) throw new Error('Sessão inválida.');

              let thumbnailUrl = '';
              if (thumbnailFile) {
                  const thumbFileExt = thumbnailFile.name.split('.').pop();
                  const thumbFileName = `thumb-${user.id}-${Date.now()}.${thumbFileExt}`;
                  const { error: uploadThumbError } = await supabase.storage.from('thumbnails').upload(thumbFileName, thumbnailFile);
                  if (uploadThumbError) throw uploadThumbError;
                  const { data: thumbUrlData } = supabase.storage.from('thumbnails').getPublicUrl(thumbFileName);
                  thumbnailUrl = thumbUrlData.publicUrl;
              }

              const videoFileExt = videoFile.name.split('.').pop();
              const videoFileName = `video-${user.id}-${Date.now()}.${videoFileExt}`;

              const metadataToSave = {
                  title: formData.title,
                  description: formData.description,
                  category: formData.category,
                  tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
                  thumbnail: thumbnailUrl,
                  creator_id: user.id,
                  views: 0, gostei_muito: 0, gostei: 0, nao_gostei: 0,
                  is_short: formData.is_short || false,
                  short_type: formData.is_short ? formData.short_type : null,
                  parent_video_id: formData.is_short ? formData.parent_video_id : null,
              };

              const workerData = {
                  file: videoFile,
                  token: session.access_token,
                  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
                  bucketName: 'videos',
                  objectName: videoFileName
              };
              
              startUpload(workerData, metadataToSave);
              showNotification('info', 'Upload iniciado! Acompanhe o progresso no canto da tela.');
              if (onSuccess) onSuccess();
          }
      } catch (error) {
          showNotification('error', `Erro: ${error.message}`);
      } finally {
          setIsSubmitting(false);
      }
  };


    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">Título do Caso</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} disabled={isSubmitting || uploadState.status === 'uploading'} className="w-full bg-zinc-800 rounded border border-zinc-700 p-2 focus:outline-none focus:border-[#f1c40f] disabled:opacity-50" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="thumbnailFile" className="block text-sm font-medium mb-1">Thumbnail</label>
                    <input 
                        type="file" id="thumbnailFile" name="thumbnailFile"
                        onChange={handleFileChange}
                        disabled={isSubmitting}
                        accept="image/jpeg,image/png,image/webp"
                        className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>
                <div>
                    <label htmlFor="videoFile" className="block text-sm font-medium mb-1">Vídeo Principal</label>
                    <input 
                        type="file" id="videoFile" name="videoFile"
                        onChange={handleFileChange}
                        disabled={isSubmitting}
                        accept="video/mp4,video/webm"
                        className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">Descrição</label>
                <textarea name="description" rows="4" value={formData.description} onChange={handleChange} disabled={isSubmitting} className="w-full bg-zinc-800 rounded border border-zinc-700 p-2 disabled:opacity-50"></textarea>
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

    {/* Opções de Tipo de Short (só aparecem se 'is_short' estiver marcado) */}
    {formData.is_short && (
        <div className="pl-7 space-y-2">
            <p className="text-sm text-zinc-400">Qual o tipo de Short?</p>
            <div className="flex flex-wrap gap-2">
                {/* Opção UPDATE */}
                <button type="button" onClick={() => setFormData(prev => ({...prev, short_type: 'update'}))} 
                    className={`px-3 py-1 text-sm rounded-full ${formData.short_type === 'update' ? 'bg-blue-500 text-white font-bold' : 'bg-zinc-700 hover:bg-zinc-600'}`}>
                    Update
                </button>
                {/* Opção PRÉVIA */}
                <button type="button" onClick={() => setFormData(prev => ({...prev, short_type: 'intro'}))} 
                    className={`px-3 py-1 text-sm rounded-full ${formData.short_type === 'intro' ? 'bg-purple-600 text-white font-bold' : 'bg-zinc-700 hover:bg-zinc-600'}`}>
                    Prévia
                </button>
                {/* Opção FLASH */}
                <button type="button" onClick={() => setFormData(prev => ({...prev, short_type: 'flash'}))} 
                    className={`px-3 py-1 text-sm rounded-full ${formData.short_type === 'flash' ? 'bg-yellow-500 text-black font-bold' : 'bg-zinc-700 hover:bg-zinc-600'}`}>
                    Flash
                </button>
            </div>
        </div>
    )}
</div>

            {/* Dropdown condicional que só aparece se 'is_short' for marcado */}
            {formData.is_short && (
                <div className="pl-6">
                    <label htmlFor="parent_video_id" className="block text-sm font-medium mb-1">Selecione o caso principal</label>
                    <select
                        name="parent_video_id"
                        id="parent_video_id"
                        value={formData.parent_video_id || ''}
                        onChange={handleChange}
                        className="w-full bg-zinc-800 rounded border border-zinc-700 p-2 focus:outline-none focus:border-[#f1c40f]"
                    >
                        <option value="">Selecione um vídeo...</option>
                        {parentVideos.map(video => (
                            <option key={video.id} value={video.id}>{video.title}</option>
                        ))}
                    </select>
                </div>
            )}
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
                    <input type="text" name="tags" value={formData.tags} onChange={handleChange} disabled={isSubmitting || uploadState.status === 'uploading'} className="w-full bg-zinc-800 rounded border border-zinc-700 p-2" />
                </div>
            </div>

            <button type="submit" disabled={isSubmitting || uploadState.status === 'uploading'} className="w-full bg-[#8e44ad] hover:bg-[#803d9c] text-white font-bold py-3 rounded-lg transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed">
                {isSubmitting ? 'Preparando...' 
                 : uploadState.status === 'uploading' ? `Enviando... ${uploadState.progress}%` 
                 : (videoToEdit ? 'Salvar Alterações' : 'Fazer Upload')}
            </button>
        </form>
    );
}