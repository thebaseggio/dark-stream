import React, { useState, useEffect, Fragment } from 'react';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';
import AnimatedPage from '../AnimatedPage';
import DashboardChart from './DashboardChart';
import RecentComments from "../components/RecentComments"; 
import { Dialog, Transition } from '@headlessui/react';
import ProfileEditor from '../components/ProfileEditor';
import SubscribersChart from './SubscribersChart';

// --- DEFINIÇÃO DOS COMPONENTES VISUAIS ---
// Colocamos todos aqui fora para melhor organização e performance

const EditIcon = (props) => ( <svg {...props} viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg> );
const DeleteIcon = (props) => ( <svg {...props} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg> );

const TopVideoCard = ({ video, timePeriod }) => {
    const periodText = timePeriod > 0 ? `Últimos ${timePeriod} dias` : 'Todo o Período';

    if (!video) {
        return (
            <div className="bg-zinc-800/50 border border-dashed border-zinc-700 p-6 rounded-lg text-center col-span-full">
                {/* Usando a variável aqui */}
                <p className="font-semibold text-white">Nenhum vídeo se destacou em "{periodText}".</p>
                <p className="text-sm text-zinc-400 mt-1">Continue criando para ver suas estatísticas aqui!</p>
            </div>
        );
    }
    return (
        <div className="bg-zinc-900 p-6 rounded-lg col-span-full grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8">
                <p className="text-sm font-bold text-[#f1c40f] tracking-wider uppercase">Vídeo em Destaque ({periodText})</p>
                <h3 className="text-2xl font-bold text-white mt-2 hover:text-yellow-400 transition-colors">
                    <Link to={`/video/${video.id}`}>{video.title}</Link>
                </h3>
                <p className="text-4xl font-bold text-white mt-4">{video.recent_views_count.toLocaleString('pt-BR')} <span className="text-lg font-normal text-zinc-400">views</span></p>
            </div>
            <div className="md:col-span-4 flex justify-center md:justify-end">
                <Link to={`/video/${video.id}`}>
                    <img src={video.thumbnail} alt={video.title} className="w-full max-w-xs md:w-48 rounded-lg aspect-video object-cover shadow-lg shadow-black/30 hover:scale-105 transition-transform duration-300"/>
                </Link>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export default function CreatorDashboard({ user, profile, onUploadClick, onEditClick, onProfileUpdate, onSuccess }) {
    const [myVideos, setMyVideos] = useState([]);
    const [isLoadingVideos, setIsLoadingVideos] = useState(true);
    const [stats, setStats] = useState({ views: 0, subscribers: 0, super_likes: 0, likes: 0, dislikes: 0 });
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [timePeriod, setTimePeriod] = useState(7); // 0 = Todo o Período
    const [topVideo, setTopVideo] = useState(null);

    const fetchMyData = async () => {
        if (!user) return;
        setIsLoadingVideos(true);

        // --- LÓGICA DE BUSCA TOTALMENTE REFEITA PARA SUPORTAR O FILTRO DE PERÍODO ---
        
        // 1. Define a data de início para os filtros. Se 'timePeriod' for 0, o filtro não será aplicado.
        let startDate = null;
        if (timePeriod > 0) {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - timePeriod);
        }

        // 2. Busca os IDs de todos os vídeos do criador (isso não depende do período)
        const { data: videosData, error: videosError } = await supabase
            .from('videos').select('id').eq('creator_id', user.id);
        if (videosError) { console.error(videosError); setIsLoadingVideos(false); return; }
        const videoIds = videosData.map(v => v.id);

        // 3. Constrói as buscas para os cards de estatísticas, aplicando o filtro de data condicionalmente
        let viewsQuery = supabase.from('views').select('id', { count: 'exact', head: true }).in('video_id', videoIds);
        let subsQuery = supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('creator_id', user.id);
        let ratingsQuery = supabase.from('ratings').select('rating_value').in('video_id', videoIds);

        if (startDate) {
            viewsQuery = viewsQuery.gte('created_at', startDate.toISOString());
            subsQuery = subsQuery.gte('created_at', startDate.toISOString());
            ratingsQuery = ratingsQuery.gte('created_at', startDate.toISOString());
        }

        // 4. Executa todas as buscas em paralelo, incluindo a do vídeo em destaque que já usa o 'timePeriod'
        const [
            subsRes,
            totalViewsRes,
            ratingsRes,
            topVideoRes
        ] = await Promise.all([
            subsQuery,
            viewsQuery,
            ratingsQuery,
            supabase.rpc('get_top_performing_video', { creator_id_param: user.id, days_param: timePeriod })
        ]);

        // 5. Processa os resultados e atualiza o estado dos cards e do vídeo em destaque
        const totalRatings = ratingsRes.data?.reduce((acc, rating) => {
            if (rating.rating_value === 2) acc.super_likes += 1;
            if (rating.rating_value === 1) acc.likes += 1;
            if (rating.rating_value === -1) acc.dislikes += 1;
            return acc;
        }, { super_likes: 0, likes: 0, dislikes: 0 }) || { super_likes: 0, likes: 0, dislikes: 0 };
        
        setStats({
            views: totalViewsRes.count || 0,
            subscribers: subsRes.count || 0,
            ...totalRatings
        });
        setTopVideo(topVideoRes.data?.[0] || null);
        
        // 6. Busca os dados completos para a tabela "Seu Conteúdo" (que mostra estatísticas vitalícias)
        // (Esta parte não foi alterada, pois a tabela continua mostrando os totais por vídeo)
        const { data: fullVideosData } = await supabase.from('videos').select('*').in('id', videoIds).order('created_at', { ascending: false });
        const { data: ratingsPerVideoRes } = await supabase.rpc('get_rating_counts_for_videos', { video_ids: videoIds });
        const { data: viewsPerVideo } = await supabase.from('views').select('video_id').in('video_id', videoIds);

        const ratingsMap = new Map(ratingsPerVideoRes?.map(r => [r.video_id, r]));
        const viewsCountMap = new Map();
        viewsPerVideo?.forEach(view => {
            viewsCountMap.set(view.video_id, (viewsCountMap.get(view.video_id) || 0) + 1);
        });

        const enrichedVideos = fullVideosData.map(video => ({
            ...video,
            stats: {
                views: viewsCountMap.get(video.id) || 0,
                likes: ratingsMap.get(video.id)?.likes_count || 0,
                super_likes: ratingsMap.get(video.id)?.super_likes_count || 0,
                dislikes: ratingsMap.get(video.id)?.dislikes_count || 0,
            }
        }));

        setMyVideos(enrichedVideos);
        setIsLoadingVideos(false);
    };

    useEffect(() => {
        fetchMyData();
    }, [user, timePeriod]);

    const handleDelete = async (videoId) => {
        if (window.confirm("Tem certeza que deseja excluir este vídeo? Esta ação não pode ser desfeita.")) {
            const { error } = await supabase.from('videos').delete().eq('id', videoId);
            if (error) {
                onSuccess('error', `Erro: ${error.message}`);
            } else {
                onSuccess('success', "Vídeo excluído com sucesso!");
                fetchMyData();
            }
        }
    };
    
    if (!user) {
        return ( <AnimatedPage><div className="text-center p-8"><h1 className="text-2xl font-bold">Acesso Negado</h1><p className="mt-2">Você precisa estar logado.</p></div></AnimatedPage> );
    }
    
return (
    <>
        <AnimatedPage>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* --- 1. Cabeçalho do Perfil --- */}
                <div className="bg-zinc-900 p-6 sm:p-8 rounded-lg grid grid-cols-12 items-center gap-y-6 md:gap-x-6">
                    <div className="col-span-12 md:col-span-2 flex justify-center">
                        <button onClick={() => setIsProfileModalOpen(true)} className="relative group/avatar flex-shrink-0" title="Editar perfil">
                            <img src={profile?.creatorAvatar || `https://ui-avatars.com/api/?name=${profile?.username?.charAt(0)}&background=f1c40f&color=000`} alt={profile?.username} className="w-24 h-24 rounded-full object-cover border-4 border-zinc-700/50 transition-all duration-300 group-hover/avatar:border-[#f1c40f] shadow-lg shadow-black/30"/>
                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"><span className="text-white text-xs font-bold">Editar</span></div>
                        </button>
                    </div>
                    <div className="col-span-12 md:col-span-7 text-center md:text-left">
                        <p className="text-sm font-bold text-[#f1c40f] tracking-wider">PAINEL DO PARCEIRO</p>
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                            <h1 className="text-3xl lg:text-4xl font-bold text-white mt-1">Olá, {profile?.username || 'Criador'}!</h1>
                            <button onClick={() => setIsProfileModalOpen(true)} title="Editar nome e descrição" className="text-zinc-400 hover:text-white transition-colors mt-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                            </button>
                        </div>
                        <p className="text-gray-300 text-sm mt-3 leading-relaxed">{profile?.bio || 'Bem-vindo(a) ao seu painel.'}</p>
                    </div>
                    <div className="col-span-12 md:col-span-3 flex justify-center md:justify-end">
                        <button onClick={onUploadClick} title="Fazer Upload de Vídeo" className="bg-[#f1c40f] text-black font-bold rounded-lg hover:bg-opacity-90 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 px-5 py-3 w-full md:w-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                            <span className="hidden sm:inline">Novo Vídeo</span>
                        </button>
                    </div>
                </div>
                
                {/* --- 2. Filtro de Período Global --- */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Visão Geral</h2>
                    <div className="flex items-center gap-2 rounded-lg bg-zinc-800 p-1">
                        <button onClick={() => setTimePeriod(7)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${timePeriod === 7 ? 'bg-[#f1c40f] text-black' : 'text-zinc-300 hover:bg-zinc-700'}`}>7 dias</button>
                        <button onClick={() => setTimePeriod(30)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${timePeriod === 30 ? 'bg-[#f1c40f] text-black' : 'text-zinc-300 hover:bg-zinc-700'}`}>30 dias</button>
                        <button onClick={() => setTimePeriod(90)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${timePeriod === 90 ? 'bg-[#f1c40f] text-black' : 'text-zinc-300 hover:bg-zinc-700'}`}>90 dias</button>
                        <button onClick={() => setTimePeriod(0)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${timePeriod === 0 ? 'bg-[#f1c40f] text-black' : 'text-zinc-300 hover:bg-zinc-700'}`}>Todo o Período</button>
                    </div>
                </div>

                {/* --- 3. Card de Destaque --- */}
                <TopVideoCard video={topVideo} timePeriod={timePeriod} />
                
                {/* --- 4. Painel de Estatísticas --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-zinc-900 p-6 rounded-lg">
                        <p className="text-sm font-medium text-gray-400">Total de Vídeos</p>
                        <p className="text-3xl font-bold mt-1">{isLoadingVideos ? '...' : myVideos.length}</p>
                    </div>
                    <div className="bg-zinc-900 p-6 rounded-lg">
                        <p className="text-sm font-medium text-gray-400">Total de Views</p>
                        <p className="text-3xl font-bold mt-1">{isLoadingVideos ? '...' : stats.views.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="bg-zinc-900 p-6 rounded-lg">
                        <p className="text-sm font-medium text-gray-400">Inscritos</p>
                        <p className="text-3xl font-bold mt-1">{isLoadingVideos ? '...' : stats.subscribers.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="bg-zinc-900 p-6 rounded-lg">
                        <p className="text-sm font-medium text-gray-400">Gostei Muito</p>
                        <p className="text-3xl font-bold mt-1 flex items-center gap-2"><span>❤️</span><span>{isLoadingVideos ? '...' : stats.super_likes.toLocaleString('pt-BR')}</span></p>
                    </div>
                    <div className="bg-zinc-900 p-6 rounded-lg">
                        <p className="text-sm font-medium text-gray-400">Gostei</p>
                        <p className="text-3xl font-bold mt-1 flex items-center gap-2"><span>👍</span><span>{isLoadingVideos ? '...' : stats.likes.toLocaleString('pt-BR')}</span></p>
                    </div>
                    <div className="bg-zinc-900 p-6 rounded-lg">
                        <p className="text-sm font-medium text-gray-400">Não Gostei</p>
                        <p className="text-3xl font-bold mt-1 flex items-center gap-2"><span>👎</span><span>{isLoadingVideos ? '...' : stats.dislikes.toLocaleString('pt-BR')}</span></p>
                    </div>
                </div>
                
                {/* --- 5. Gráficos de Performance --- */}
                <div className="pt-6 border-t border-zinc-800 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <DashboardChart userId={user.id} timePeriod={timePeriod} />
                    <SubscribersChart userId={user.id} timePeriod={timePeriod} />
                </div>

                {/* --- 6. Comentários Recentes --- */}
                <div className="pt-6 border-t border-zinc-800">
                    <RecentComments userId={user?.id} />
                </div>
                    {/* Seção para o Conteúdo */}
    <div className="pt-6 border-t border-zinc-800 bg-zinc-900 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-white mb-4">Seu Conteúdo</h2>
        {isLoadingVideos ? (
            <p className="text-gray-400 text-center py-4">Carregando seus vídeos...</p>
        ) : myVideos.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left align-middle">
                    <thead className="text-xs text-gray-400 uppercase">
                        <tr>
                            <th className="px-4 py-3">Vídeo</th>
                            <th className="px-4 py-3 text-center">Views</th>
                            <th className="px-4 py-3 text-center">❤️</th>
                            <th className="px-4 py-3 text-center">👍</th>
                            <th className="px-4 py-3 text-center">👎</th>
                            <th className="px-4 py-3 hidden md:table-cell">Data de Envio</th>
                            <th className="px-4 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myVideos.map(video => (
                            <tr key={video.id} className="border-t border-zinc-800 hover:bg-zinc-800/50">
                                <td className="px-4 py-3 font-medium">
                                    <div className="flex items-center gap-4">
                                        <img src={video.thumbnail || `...`} alt={video.title} className="w-28 h-16 rounded-md object-cover hidden md:block" />
                                        <div>
                                            <Link to={`/video/${video.id}`} target="_blank" className="hover:text-[#f1c40f] hover:underline" title="Ver página do vídeo">{video.title}</Link>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center font-semibold">{video.stats.views.toLocaleString('pt-BR')}</td>
                                <td className="px-4 py-3 text-center">{video.stats.super_likes.toLocaleString('pt-BR')}</td>
                                <td className="px-4 py-3 text-center">{video.stats.likes.toLocaleString('pt-BR')}</td>
                                <td className="px-4 py-3 text-center">{video.stats.dislikes.toLocaleString('pt-BR')}</td>
                                <td className="px-4 py-3 hidden md:table-cell">{new Date(video.created_at).toLocaleDateString()}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-3 justify-center">
                                        <button onClick={() => onEditClick(video)} className="text-zinc-400 hover:text-blue-400 transition-colors" title="Editar"><EditIcon className="w-5 h-5" /></button>
                                        <button onClick={() => handleDelete(video.id)} className="text-zinc-400 hover:text-red-500 transition-colors" title="Excluir"><DeleteIcon className="w-5 h-5" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="text-center py-16 px-6">
                <h3 className="text-lg font-medium text-white">Nenhum caso para solucionar ainda...</h3>
                <p className="mt-1 text-sm text-zinc-400">Seu conteúdo aparecerá aqui assim que você fizer o primeiro envio.</p>
            </div>
        )}
    </div>
            </div>
        </AnimatedPage>
        
        {/* Modal de Edição de Perfil */}
        <Transition appear show={isProfileModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setIsProfileModalOpen(false)}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/70" /></Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-zinc-900 p-6 text-left align-middle shadow-xl transition-all">
                            <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-white mb-6">Editar Perfil</Dialog.Title>
                            <ProfileEditor user={user} profile={profile} onSuccess={onSuccess} onUploadSuccess={() => { setIsProfileModalOpen(false); onProfileUpdate(); }} />
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition>
    </>
);
}