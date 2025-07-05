// src/pages/CreatorUploadForm.jsx

import React, { useState, useEffect, Fragment } from 'react';
import { supabase } from '../supabase';
import { Listbox, Transition } from '@headlessui/react';

const categories = [ '', 'Nacionais', 'Internacionais', 'Não solucionados', 'Solucionados', 'Serial Killers', 'Documentários', 'Sobrenaturais' ];

export default function CreatorUploadForm({ user, onSuccess, videoToEdit, initialFocusRef }) {
    
    const [formData, setFormData] = useState({
        title: '', videoUrl: '', description: '', category: categories[0], tags: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

useEffect(() => {
    // Função interna para gerar um estado inicial limpo
    const getInitialState = () => ({
        title: '', videoUrl: '', description: '', category: categories[0], tags: '',
        creatorId: user?.id,
        creatorName: user?.user_metadata?.username || 'Criador',
        creatorAvatar: user?.user_metadata?.avatar_url || ''
    });

    // A lógica de preenchimento só acontece se estivermos em modo de edição
    if (videoToEdit) {
        let tagsAsString = ''; // Prepara uma string vazia para as tags

        // Verifica se 'videoToEdit.tags' existe e não está vazio
        if (videoToEdit.tags && videoToEdit.tags.length > 0) {
            // Se for um array (formato correto), junta com vírgula
            if (Array.isArray(videoToEdit.tags)) {
                tagsAsString = videoToEdit.tags.join(', ');
            } 
            // Se for um texto (formato antigo/legado), apenas usa o texto
            else if (typeof videoToEdit.tags === 'string') {
                tagsAsString = videoToEdit.tags;
            }
            // Se for qualquer outra coisa (como o lixo de dados), 'tagsAsString' permanece vazio, limpando o campo.
        }
        
        setFormData({
            ...getInitialState(),
            ...videoToEdit,
            tags: tagsAsString // Define o valor limpo e preparado
        });
    } else {
        // Se for para criar um novo vídeo, apenas usa o estado inicial limpo
        setFormData(getInitialState());
    }
}, [videoToEdit, user]); // Roda sempre que o modo ou o usuário mudar

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.videoUrl || !formData.category) {
            setError('Título, URL e Categoria são obrigatórios.');
            return;
        }
        setIsSubmitting(true);
        setError('');

        const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        let queryError;

        if (videoToEdit) {
            const dataToUpdate = {
                title: formData.title, videoUrl: formData.videoUrl, description: formData.description,
                category: formData.category, tags: tagsArray.length > 0 ? tagsArray : null,
            };
            const { error } = await supabase.from('videos').update(dataToUpdate).eq('id', videoToEdit.id);
            queryError = error;
        } else {
            const dataToInsert = { ...formData, tags: tagsArray.length > 0 ? tagsArray : null };
            delete dataToInsert.id;
            const { error } = await supabase.from('videos').insert([dataToInsert]);
            queryError = error;
        }

        if (queryError) {
            setError(`Erro: ${queryError.message}`);
        } else {
            alert(videoToEdit ? 'Vídeo atualizado com sucesso!' : 'Vídeo adicionado com sucesso!');
            if (onSuccess) onSuccess();
        }
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">Título do Caso</label>
                <input 
                    ref={initialFocusRef}
                    type="text" 
                    name="title" 
                    id="title" 
                    value={formData.title} 
                    onChange={handleChange} 
                    className="w-full bg-zinc-800 rounded border border-zinc-700 p-2 focus:outline-none focus:border-[#f1c40f]" 
                />
            </div>
            <div>
                <label htmlFor="videoUrl" className="block text-sm font-medium mb-1">URL de Embed do Vídeo</label>
                <input 
                    type="url" 
                    name="videoUrl" 
                    id="videoUrl" 
                    value={formData.videoUrl} 
                    onChange={handleChange} 
                    className="w-full bg-zinc-800 rounded border border-zinc-700 p-2 focus:outline-none focus:border-[#f1c40f]" 
                />
                <p className="mt-1 text-xs text-gray-400">Ex: https://www.youtube.com/embed/CODIGO_DO_VIDEO</p>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">Descrição</label>
                <textarea 
                    name="description" 
                    id="description" 
                    rows="4" 
                    value={formData.description} 
                    onChange={handleChange} 
                    className="w-full bg-zinc-800 rounded border border-zinc-700 p-2 focus:outline-none focus:border-[#f1c40f] scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-zinc-800"
                ></textarea>
            </div>
            <div className="space-y-2 bg-black/20 p-4 rounded-md border border-zinc-800">
                <label className="block text-sm font-medium text-gray-300">Organização</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Listbox value={formData.category} onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                            <div className="relative">
                                <Listbox.Label className="block text-xs font-medium mb-1 text-gray-400">Categoria</Listbox.Label>
                                <Listbox.Button className="relative w-full cursor-default rounded border border-zinc-700 bg-zinc-800 p-2 h-10 flex items-center text-left focus:outline-none focus-visible:border-[#f1c40f] sm:text-sm">
                                    <span className="block truncate">{formData.category}</span>
                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-gray-400"><path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.24a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" /></svg>
                                    </span>
                                </Listbox.Button>
                                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                    <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-zinc-900 py-1 text-base shadow-lg ring-1 ring-zinc-700 focus:outline-none sm:text-sm z-10 scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-zinc-800">
                                        {categories.map((cat, catIdx) => (
                                            <Listbox.Option key={catIdx} className={({ active }) => `relative cursor-default select-none py-2 pl-4 pr-4 ${ active ? 'bg-zinc-800 text-[#f1c40f]' : 'text-gray-300' }`} value={cat}>
                                                {({ selected }) => (<span className={`block truncate ${ selected ? 'font-medium text-[#f1c40f]' : 'font-normal' }`}>{cat}</span>)}
                                            </Listbox.Option>
                                        ))}
                                    </Listbox.Options>
                                </Transition>
                            </div>
                        </Listbox>
                    </div>
                    <div>
                        <label htmlFor="tags" className="block text-xs font-medium mb-1 text-gray-400">Tags</label>
                        <input type="text" name="tags" id="tags" value={formData.tags} onChange={handleChange} className="w-full bg-zinc-800 rounded border border-zinc-700 p-2 h-10 focus:outline-none focus:border-[#f1c40f] sm:text-sm" />
                        <p className="mt-1 text-xs text-gray-500">Separe com vírgulas.</p>
                    </div>
                </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button type="submit" disabled={isSubmitting} className="w-full bg-[#8e44ad] hover:bg-[#803d9c] text-white font-bold py-3 rounded-lg transition-colors duration-200 disabled:bg-gray-500 flex justify-center">
                {isSubmitting ? <Spinner /> : (videoToEdit ? 'Salvar Alterações' : 'Adicionar Vídeo')}
            </button>
        </form>
    );
}