// src/pages/CreatorUploadForm.jsx

import React, { useState, Fragment, useEffect } from 'react';
import { supabase } from '../supabase';
import { Listbox, Transition } from '@headlessui/react';

const categories = [
    '', 'Nacionais', 'Internacionais', 'Não solucionados', 'Solucionados', 'Serial Killers', 'Documentários', 'Sobrenaturais'
];

// O formulário agora recebe o 'user' e uma função 'onSuccess' como props
export default function CreatorUploadForm({ user, onSuccess, videoToEdit }) {
    
    // TODA A LÓGICA DO FORMULÁRIO AGORA VIVE AQUI
    const initialState = {
        title: '',
        videoUrl: '',
        description: '',
        category: categories[0],
        tags: '',
        creatorId: user?.id,
        creatorName: user?.user_metadata?.username || 'Nome do Criador',
        creatorAvatar: user?.user_metadata?.avatar_url || ''
    };

    const [formData, setFormData] = useState(initialState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    // 👇 NOVO EFEITO: para preencher o formulário quando estiver em modo de edição
    useEffect(() => {
        if (videoToEdit) {
            // Se recebemos um vídeo para editar, preenchemos o formulário com seus dados
            setFormData({
                ...videoToEdit,
                tags: (videoToEdit.tags || []).join(', ') // Converte o array de tags de volta para string
            });
        } else {
            // Se não, garantimos que o formulário esteja com os dados iniciais (modo de adição)
            setFormData(initialState);
        }
    }, [videoToEdit]); // Roda sempre que o 'videoToEdit' mudar
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.videoUrl) {
            setError('Título e URL do Vídeo são obrigatórios.');
            return;
        }
        setIsSubmitting(true);
                // 👇 LÓGICA INTELIGENTE: UPDATE vs INSERT 👇
        let error;
        if (videoToEdit) {
            // MODO EDIÇÃO: Executa um update
            const { error: updateError } = await supabase
                .from('videos')
                .update(videoData)
                .eq('id', videoToEdit.id);
            error = updateError;
        } else {
            // MODO ADIÇÃO: Executa um insert
            const { error: insertError } = await supabase
                .from('videos')
                .insert([videoData]);
            error = insertError;
        }

        if (error) {
            alert(`Erro: ${error.message}`);
        } else {
            alert(videoToEdit ? 'Vídeo atualizado com sucesso!' : 'Vídeo adicionado com sucesso!');
            if (onSuccess) {
                onSuccess(); // Avisa o pai sobre o sucesso
            }
        }
        setIsSubmitting(false);
    };

    return (
        // O <form> completo que criamos anteriormente
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Título, URL e Descrição */}
            <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">Título do Caso</label>
                <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} className="w-full bg-zinc-800 rounded border border-zinc-700 p-2 focus:outline-none focus:border-[#f1c40f]" />
            </div>
            <div>
                <label htmlFor="videoUrl" className="block text-sm font-medium mb-1">URL de Embed do Vídeo</label>
                <input type="url" name="videoUrl" id="videoUrl" value={formData.videoUrl} onChange={handleChange} className="w-full bg-zinc-800 rounded border border-zinc-700 p-2 focus:outline-none focus:border-[#f1c40f]" />
                <p className="mt-1 text-xs text-gray-400">Ex: https://www.youtube.com/embed/CODIGO_DO_VIDEO</p>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">Descrição</label>
                <textarea name="description" id="description" rows="4" value={formData.description} onChange={handleChange} className="w-full bg-zinc-800 rounded border border-zinc-700 p-2 focus:outline-none focus:border-[#f1c40f]"></textarea>
            </div>

            {/* Seção de Organização */}
            <div className="space-y-2 bg-black/20 p-4 rounded-md border border-zinc-800">
                <label className="block text-sm font-medium text-gray-300"></label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Coluna da Categoria */}
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
                                    <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-black py-1 text-base shadow-lg ring-1 ring-black/5 ring-offset-2 ring-offset-[#f1c40f] focus:outline-none sm:text-sm z-10 scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-zinc-800">
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
                    {/* Coluna das Tags */}
                    <div>
                        <label htmlFor="tags" className="block text-xs font-medium mb-1 text-gray-400">Tags</label>
                        <input type="text" name="tags" id="tags" value={formData.tags} onChange={handleChange} className="w-full bg-zinc-800 rounded border border-zinc-700 p-2 h-10 focus:outline-none focus:border-[#f1c40f] sm:text-sm" />
                        <p className="mt-1 text-xs text-gray-500">Separe com vírgulas.</p>
                    </div>
                </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={isSubmitting} className="w-full bg-[#f1c40f] ...">
                {isSubmitting ? 'Salvando...' : (videoToEdit ? 'Salvar Alterações' : 'Adicionar Vídeo')}
            </button>
        </form>
    );
}