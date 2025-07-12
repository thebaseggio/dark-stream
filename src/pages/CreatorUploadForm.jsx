// src/pages/CreatorUploadForm.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

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
    const [error, setError] = useState('');

    // O useEffect para preencher o formulário em modo de edição
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
    
    // 👇 A FUNÇÃO handleSubmit CORRIGIDA E ORGANIZADA 👇
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            if (videoToEdit) {
                // --- MODO EDIÇÃO ---
                if (!formData.title) throw new Error('O título é obrigatório.');

                const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
                const dataToUpdate = {
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    tags: tagsArray.length > 0 ? tagsArray : null,
                };
                // Aqui poderíamos adicionar lógica para atualizar a thumbnail também, se desejado.
                const { error: updateError } = await supabase.from('videos').update(dataToUpdate).eq('id', videoToEdit.id);
                if (updateError) throw updateError;
                alert('Vídeo atualizado com sucesso!');
            } else {
                // --- MODO ADIÇÃO (UPLOAD) ---
                if (!videoFile || !formData.title) throw new Error('Um arquivo de vídeo e um título são obrigatórios.');

                // 1. Upload do vídeo
                const videoFileExt = videoFile.name.split('.').pop();
                const videoFileName = `${user.id}-${Date.now()}.${videoFileExt}`;
                const { error: uploadVideoError } = await supabase.storage.from('videos').upload(videoFileName, videoFile);
                if (uploadVideoError) throw uploadVideoError;
                const { data: videoUrlData } = supabase.storage.from('videos').getPublicUrl(videoFileName);

                // 2. Upload da thumbnail (opcional)
                let thumbnailUrl = '';
                if (thumbnailFile) {
                    const thumbFileExt = thumbnailFile.name.split('.').pop();
                    const thumbFileName = `${user.id}-${Date.now()}.${thumbFileExt}`;
                    const { error: uploadThumbError } = await supabase.storage.from('thumbnails').upload(thumbFileName, thumbnailFile);
                    if (uploadThumbError) throw uploadThumbError;
                    const { data: thumbUrlData } = supabase.storage.from('thumbnails').getPublicUrl(thumbFileName);
                    thumbnailUrl = thumbUrlData.publicUrl;
                }

                // 3. Inserção no banco de dados
                const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
                const videoMetadata = {
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    tags: tagsArray.length > 0 ? tagsArray : null,
                    videoUrl: videoUrlData.publicUrl,
                    thumbnail: thumbnailUrl,
                    creatorId: user.id, // O Supabase vai preencher isso automaticamente se configurado
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
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">Título do Caso</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full bg-zinc-800 rounded border border-zinc-700 p-2 focus:outline-none focus:border-[#f1c40f]" />
            </div>
            
            {/* CONTAINER COM GRID PARA OS UPLOADS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="thumbnailFile" className="block text-sm font-medium mb-1">Thumbnail</label>
                    <input 
                        type="file" id="thumbnailFile" name="thumbnailFile"
                        onChange={handleFileChange}
                        accept="image/jpeg,image/png,image/webp"
                        className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600 cursor-pointer"
                    />
                </div>
                <div>
                    <label htmlFor="videoFile" className="block text-sm font-medium mb-1">Vídeo Principal</label>
                    <input 
                        type="file" id="videoFile" name="videoFile"
                        onChange={handleFileChange}
                        accept="video/mp4,video/webm"
                        className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600 cursor-pointer"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">Descrição</label>
                <textarea name="description" rows="4" value={formData.description} onChange={handleChange} className="w-full bg-zinc-800 rounded border border-zinc-700 p-2"></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="category" className="block text-sm font-medium mb-1">Categoria</label>
                    <input type="text" name="category" value={formData.category} onChange={handleChange} className="w-full bg-zinc-800 rounded border border-zinc-700 p-2" />
                </div>
                 <div>
                    <label htmlFor="tags" className="block text-sm font-medium mb-1">Tags (separadas por vírgula)</label>
                    <input type="text" name="tags" value={formData.tags} onChange={handleChange} className="w-full bg-zinc-800 rounded border border-zinc-700 p-2" />
                </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            
            <button type="submit" disabled={isSubmitting} className="w-full bg-[#8e44ad] hover:bg-[#803d9c] text-white font-bold py-3 rounded-lg transition-colors duration-200 disabled:bg-gray-500">
                {isSubmitting ? 'Enviando...' : 'Fazer Upload'}
            </button>
        </form>
    );
}