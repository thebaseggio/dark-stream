// src/pages/CreatorUploadForm.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import * as tus from 'tus-js-client'; // Importando a biblioteca TUS

export default function CreatorUploadForm({ user, onSuccess, videoToEdit }) {
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        tags: '',
    });
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0); // Novo estado para o progresso
    const [error, setError] = useState('');

    useEffect(() => {
        if (videoToEdit) {
            setFormData({
                title: videoToEdit.title || '',
                description: videoToEdit.description || '',
                category: videoToEdit.category || '',
                tags: (videoToEdit.tags || []).join(', '),
            });
        } else {
            setFormData({ title: '', description: '', category: '', tags: '' });
        }
    }, [videoToEdit]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files.length > 0) {
            if (name === 'videoFile') setVideoFile(files[0]);
            else if (name === 'thumbnailFile') setThumbnailFile(files[0]);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setUploadProgress(0);
        setError('');

        try {
            if (videoToEdit) {
                // --- MODO EDIÇÃO (LÓGICA INALTERADA) ---
                if (!formData.title) throw new Error('O título é obrigatório.');

                const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
                const dataToUpdate = {
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    tags: tagsArray.length > 0 ? tagsArray : null,
                };
                const { error: updateError } = await supabase.from('videos').update(dataToUpdate).eq('id', videoToEdit.id);
                if (updateError) throw updateError;
                alert('Vídeo atualizado com sucesso!');
            
            } else {
                // --- MODO ADIÇÃO (UPLOAD COM TUS) ---
                if (!videoFile || !formData.title) throw new Error('Um arquivo de vídeo e um título são obrigatórios.');

                // 1. Upload da Thumbnail (método padrão, pois é um arquivo pequeno)
                let thumbnailUrl = '';
                if (thumbnailFile) {
                    const thumbFileExt = thumbnailFile.name.split('.').pop();
                    const thumbFileName = `thumb-${user.id}-${Date.now()}.${thumbFileExt}`;
                    const { error: uploadThumbError } = await supabase.storage.from('thumbnails').upload(thumbFileName, thumbnailFile);
                    if (uploadThumbError) throw uploadThumbError;
                    const { data: thumbUrlData } = supabase.storage.from('thumbnails').getPublicUrl(thumbFileName);
                    thumbnailUrl = thumbUrlData.publicUrl;
                }

                // 2. Upload do VÍDEO com TUS (para arquivos grandes)
                const videoFileExt = videoFile.name.split('.').pop();
                const videoFileName = `video-${user.id}-${Date.now()}.${videoFileExt}`;

                // Envolvemos o upload do TUS em uma Promise para usar com async/await
                await new Promise(async (resolve, reject) => {
                    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                    if (sessionError || !session) {
                        return reject(sessionError || new Error('Sessão não encontrada. Faça login novamente.'));
                    }

                    const upload = new tus.Upload(videoFile, {
                        endpoint: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/upload/resumable`,
                        retryDelays: [0, 3000, 5000, 10000, 20000],
                        headers: {
                            authorization: `Bearer ${session.access_token}`,
                        },
                        metadata: {
                            bucketName: 'videos', // Verifique se este é o nome do seu bucket de vídeos
                            objectName: videoFileName,
                            contentType: videoFile.type,
                        },
                        onError: (error) => {
                            console.error("Falha no upload do vídeo:", error);
                            reject(error);
                        },
                        onProgress: (bytesUploaded, bytesTotal) => {
                            const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(0);
                            setUploadProgress(percentage);
                        },
                        onSuccess: () => {
                            console.log("Upload do vídeo concluído com sucesso!");
                            resolve();
                        },
                    });

                    // Inicia o upload
                    upload.start();
                });

                // 3. Obter a URL pública do vídeo que acabamos de enviar
                const { data: videoUrlData } = supabase.storage.from('videos').getPublicUrl(videoFileName);

                // 4. Inserir os metadados do vídeo no banco de dados
                const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
                const videoMetadata = {
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    tags: tagsArray.length > 0 ? tagsArray : null,
                    videoUrl: videoUrlData.publicUrl,
                    thumbnail: thumbnailUrl,
                    creator_id: user.id,
                };
                
                const { error: insertError } = await supabase.from('videos').insert([videoMetadata]);
                if (insertError) throw insertError;
                
                alert('Vídeo enviado com sucesso!');
            }

            if (onSuccess) onSuccess();

        } catch (error) {
            setError(`Erro: ${error.message}`);
        } finally {
            setIsSubmitting(false);
            setUploadProgress(0); // Reseta o progresso ao finalizar
        }
    try {
        if (!videoFile || !formData.title) throw new Error('Um arquivo de vídeo e um título são obrigatórios.');
        if (uploadState.status === 'uploading') throw new Error('Aguarde o upload atual terminar antes de enviar outro.');

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Sessão inválida. Por favor, faça login novamente.');

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
        };

        const workerData = {
            file: videoFile,
            token: session.access_token,
            supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
            bucketName: 'videos',
            objectName: videoFileName
        };
        
        // Dispara o upload e passa os metadados para o Context
        startUpload(workerData, metadataToSave);
        
        // A única notificação que o formulário dispara é esta:
        showNotification('info', 'Upload iniciado! Acompanhe o progresso no canto da tela.');
        
        if (onSuccess) onSuccess(); // Fecha o modal ou redireciona a página

    } catch (error) {
        showNotification('error', `Erro: ${error.message}`);
    }
};

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">Título do Caso</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} disabled={isSubmitting} className="w-full bg-zinc-800 rounded border border-zinc-700 p-2 focus:outline-none focus:border-[#f1c40f] disabled:opacity-50" />
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

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            
            {/* Barra de Progresso que só aparece durante o upload */}
            {isSubmitting && !videoToEdit && (
                <div className="w-full bg-zinc-700 rounded-full h-2.5">
                    <div className="bg-[#f1c40f] h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
            )}
            
            <button type="submit" disabled={isSubmitting} className="w-full bg-[#8e44ad] hover:bg-[#803d9c] text-white font-bold py-3 rounded-lg transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed">
                {isSubmitting ? 
                    (videoToEdit ? 'Atualizando...' : `Enviando... ${uploadProgress}%`) : 
                    (videoToEdit ? 'Salvar Alterações' : 'Fazer Upload')
                }
            </button>
        </form>
    );
}