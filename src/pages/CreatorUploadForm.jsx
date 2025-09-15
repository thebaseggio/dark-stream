// src/pages/CreatorUploadForm.jsx (versão final)

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useUpload } from '../contexts/UploadProvider';
import { useNotification } from '../contexts/NotificationProvider.jsx';

export default function CreatorUploadForm({ user, onSuccess, videoToEdit }) {
    const { startUpload, uploadState } = useUpload();
    const { showNotification } = useNotification();

    const [formData, setFormData] = useState({ title: '', description: '', category: '', tags: '' });
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (videoToEdit) {
            setFormData({
                title: videoToEdit.title || '',
                description: videoToEdit.description || '',
                category: videoToEdit.category || '',
                tags: (videoToEdit.tags || []).join(', '),
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
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setIsSubmitting(true);

        try {
            if (videoToEdit) {
                // Lógica de edição
                const { error } = await supabase.from('videos').update({
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
                }).eq('id', videoToEdit.id);
                if (error) throw error;
                showNotification('success', 'Informações do vídeo atualizadas com sucesso!');
                if (onSuccess) onSuccess();
            } else {
                // Lógica de Adição (novo upload)
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
                    views: 0,
                    gostei_muito: 0,
                    gostei: 0,
                    nao_gostei: 0
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
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="category" className="block text-sm font-medium mb-1">Categoria</label>
                    <input type="text" name="category" value={formData.category} onChange={handleChange} disabled={isSubmitting} className="w-full bg-zinc-800 rounded border border-zinc-700 p-2 disabled:opacity-50" />
                </div>
                 <div>
                    <label htmlFor="tags" className="block text-sm font-medium mb-1">Tags (separadas por vírgula)</label>
                    <input type="text" name="tags" value={formData.tags} onChange={handleChange} disabled={isSubmitting} className="w-full bg-zinc-800 rounded border border-zinc-700 p-2 disabled:opacity-50" />
                </div>
            </div>

            {localError && <p className="text-red-500 text-sm mt-2">{localError}</p>}
            
            <button type="submit" disabled={isSubmitting || uploadState.status === 'uploading'} className="w-full bg-[#8e44ad] hover:bg-[#803d9c] text-white font-bold py-3 rounded-lg transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed">
                {isSubmitting ? 'Preparando...' 
                 : uploadState.status === 'uploading' ? `Enviando... ${uploadState.progress}%` 
                 : (videoToEdit ? 'Salvar Alterações' : 'Fazer Upload')}
            </button>
        </form>
    );
}