import React, { useState, useEffect, Fragment } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import AnimatedPage from './AnimatedPage';
import { Dialog, Transition } from '@headlessui/react';
import CreatorUploadForm from './CreatorUploadForm';

export default function CreatorDashboard({ user, profile }) {
    const navigate = useNavigate();

    // Estados do componente
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [myVideos, setMyVideos] = useState([]);
    const [isLoadingVideos, setIsLoadingVideos] = useState(true);

    const [videoToEdit, setVideoToEdit] = useState(null);

    // Funções para controlar o modal
    const closeModal = () => setIsModalOpen(false);
    const openModal = () => setIsModalOpen(true);

    // Função para buscar os vídeos do usuário logado
    const fetchMyVideos = async () => {
        if (!user) return;
        setIsLoadingVideos(true);
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('creatorId', user.id)
        if (error) {
            console.error("Erro ao buscar vídeos:", error);
        } else {
            setMyVideos(data);
        }
        setIsLoadingVideos(false);
    };

    // Efeito que roda uma vez para buscar os vídeos iniciais
    useEffect(() => {
        fetchMyVideos();
    }, [user]);

    // Função chamada pelo formulário em caso de sucesso no upload
    const handleUploadSuccess = () => {
        closeModal();
        fetchMyVideos(); // Recarrega a lista de vídeos para mostrar o novo!
    };

    const handleEdit = (video) => {
        setVideoToEdit(video); // Guarda o vídeo no estado
        openModal();           // Abre o modal
    };


    const handleDelete = async (videoId) => {
    // 1. Pedir confirmação para evitar exclusões acidentais
    const isConfirmed = window.confirm("Você tem certeza que deseja excluir este vídeo? Esta ação não pode ser desfeita.");

    if (isConfirmed) {
        // 2. Chamar o Supabase para deletar a linha correspondente
        const { error } = await supabase
            .from('videos')
            .delete()
            .eq('id', videoId);

        if (error) {
            alert(`Erro ao excluir vídeo: ${error.message}`);
        } else {
            alert("Vídeo excluído com sucesso!");
            // 3. Recarregar a lista de vídeos para atualizar a tela
            fetchMyVideos();
        }
    }
};

    // Proteção de Rota: se não há usuário, mostra a tela de Acesso Negado
    if (!user) {
        return (
            <AnimatedPage>
                <div className="text-center p-8">
                    <h1 className="text-2xl font-bold">Acesso Negado</h1>
                    <p className="mt-2 text-gray-400">Você precisa estar logado para acessar o painel de criador.</p>
                    <button 
                        onClick={() => navigate('/login')} 
                        className="mt-6 bg-[#f1c40f] text-black font-bold py-2 px-6 rounded-lg"
                    >
                        Fazer Login
                    </button>
                </div>
            </AnimatedPage>
        );
    }
    
    // Se há um usuário, mostra o Dashboard
    return (
        <AnimatedPage>
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* SEÇÃO 1: PERFIL DO CRIADOR E BOTÃO DE UPLOAD */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <img 
                            src={profile?.creatorAvatar || `https://ui-avatars.com/api/?name=${profile?.username?.charAt(0)}&background=f1c40f&color=000`} 
                            alt={profile?.username}
                            className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700"
                        />
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">Olá, {profile?.username || 'Criador'}!</h1>
                            <p className="text-sm text-gray-400">{profile?.bio || 'Bem-vindo(a) ao seu painel.'}</p>
                        </div>
                    </div>
                    <button onClick={openModal} className="bg-[#f1c40f] text-black font-bold py-2 px-5 rounded-lg hover:bg-opacity-90 transition-transform duration-200 hover:scale-105 w-full md:w-auto">
                        Fazer Upload de Vídeo
                    </button>
                </div>

                {/* SEÇÃO 2: CARDS DE ESTATÍSTICAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-zinc-900 p-4 rounded-lg">
                        <p className="text-sm text-gray-400">Total de Vídeos</p>
                        <p className="text-2xl font-bold">{myVideos.length}</p>
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-lg"><p className="text-sm text-gray-400">Total de Views</p><p className="text-2xl font-bold">Em breve</p></div>
                    <div className="bg-zinc-900 p-4 rounded-lg"><p className="text-sm text-gray-400">Total de Curtidas</p><p className="text-2xl font-bold">Em breve</p></div>
                    <div className="bg-zinc-900 p-4 rounded-lg"><p className="text-sm text-gray-400">Inscritos</p><p className="text-2xl font-bold">Em breve</p></div>
                </div>

                {/* SEÇÃO 3: LISTA DE VÍDEOS */}
                <div className="bg-zinc-900 p-4 sm:p-6 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Seu Conteúdo</h2>
                    {isLoadingVideos ? (
                        <p className="text-gray-400 text-center py-4">Carregando seus vídeos...</p>
                    ) : myVideos.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-400 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Título</th>
                                        <th className="px-4 py-3 hidden md:table-cell">Categoria</th>
                                        <th className="px-4 py-3 hidden sm:table-cell">Data de Envio</th>
                                        <th className="px-4 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myVideos.map(video => (
                                        <tr key={video.id} className="border-t border-zinc-800">
                                            <td className="px-4 py-3 font-medium">{video.title}</td>
                                            <td className="px-4 py-3 hidden md:table-cell">{video.category}</td>
                                            <td className="px-4 py-3 hidden sm:table-cell">{new Date(video.created_at).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 flex gap-4 justify-end">
                                    <button onClick={() => handleEdit(video)} className="font-medium text-blue-500 hover:underline">Editar</button>
                                    <button onClick={() => handleDelete(video.id)} className="font-medium text-red-500 hover:underline">Excluir</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-gray-400">Você ainda não enviou nenhum vídeo.</p>
                            <p className="text-gray-500 text-sm mt-1">Clique em "Fazer Upload" para começar a compartilhar suas histórias.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* O MODAL COM O FORMULÁRIO DE UPLOAD */}
            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-20" onClose={closeModal}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/60" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-zinc-900 p-6 text-left align-middle shadow-xl transition-all">
                        <Dialog.Title as="h3" className="text-lg font-medium ...">
                            {videoToEdit ? 'Editar Vídeo' : 'Adicionar Novo Vídeo'}
                        </Dialog.Title>
                                <CreatorUploadForm 
                            user={user} 
                            onSuccess={handleUploadSuccess}
                            videoToEdit={videoToEdit} 
                        />
                            </Dialog.Panel>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </AnimatedPage>
    );
}