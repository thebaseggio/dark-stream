// src/App.jsx
import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link,
    useNavigate,
    useLocation,
    Outlet,
    useSearchParams,
} from 'react-router-dom';

// 1. --- CONEXÃO REAL COM O SUPABASE ---
// Apenas a importação do seu arquivo supabase.js. Nenhum código de simulação.
import { supabase, loadAllVideos, loadAllCreators } from './supabase';


// 2. --- CONTEXTOS GLOBAIS ---
const AuthContext = createContext(null);
const VideoContext = createContext(null);

function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user || null); setLoading(false); });
        const { data: listener } = supabase.auth.onAuthStateChange((_, session) => { setUser(session?.user || null); if(loading) setLoading(false); });
        return () => listener.subscription.unsubscribe();
    }, [loading]);

    return <AuthContext.Provider value={{ user, signOut: () => supabase.auth.signOut() }}>{!loading && children}</AuthContext.Provider>;
}

function VideoProvider({children}) {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const deriveYouTubeThumb = (url) => {
        if (!url) return '';
        return `https://img.youtube.com/vi/${url.split('/').pop().split('?')[0]}/hqdefault.jpg`;
    }
    
    const fetchVideos = async () => {
        setLoading(true);
        const { data, error } = await loadAllVideos();
        if (data) {
            setVideos(data.map(v => ({...v, thumbnail: v.thumbnail || deriveYouTubeThumb(v.videoUrl)})));
        }
        if(error) console.error("Erro ao carregar vídeos:", error);
        setLoading(false);
    };

    useEffect(() => { fetchVideos(); }, []);

    const handleAddOrUpdateVideo = async (videoData, idToEdit) => {
        if(idToEdit) {
            await supabase.from('videos').update(videoData).eq('id', idToEdit);
        } else {
            await supabase.from('videos').insert([{ ...videoData, views: 0 }]);
        }
        await fetchVideos();
        navigate('/casos');
    };

    const handleDeleteVideo = async (id) => {
        await supabase.from('videos').delete().eq('id', id);
        await fetchVideos();
    };

    const value = { videos, loading, handleAddOrUpdateVideo, handleDeleteVideo };
    
    return <VideoContext.Provider value={value}>{children}</VideoContext.Provider>;
}

const useAuth = () => useContext(AuthContext);
const useVideos = () => useContext(VideoContext);


// 3. --- COMPONENTES DE PÁGINA E LAYOUT ---
const PlaceholderPage = ({ title }) => (<div className="text-center p-10"><h1 className="text-3xl font-bold">{title}</h1><p className="text-gray-400 mt-2">Esta página ainda está em construção.</p></div>);
const SkeletonCard = () => <div className="bg-zinc-900 rounded-lg p-3 h-[300px] animate-pulse"></div>;
const SkeletonCreatorCard = () => <div className="bg-zinc-900 rounded-lg p-4 h-[250px] animate-pulse"></div>;
const VideoPlayer = () => <PlaceholderPage title="Player de Vídeo" />;
const CreatorPanel = () => <PlaceholderPage title="Painel de Criador" />;
const MyVideos = () => <PlaceholderPage title="Meus Vídeos" />;


function CreatorsPage() {
    const [creators, setCreators] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAllCreators().then(response => {
            setCreators(response.data || []);
            setLoading(false);
        }).catch(err => {
            console.error("Erro ao carregar criadores:", err);
            setLoading(false);
        });
    }, []);

    return (
        <div className="px-4 sm:px-6 md:px-10 lg:px-20 py-6">
            <h1 className="text-3xl font-bold text-white mb-6">Nossos Criadores</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <SkeletonCreatorCard key={i} />)
                ) : (
                    creators.map(creator => (
                        <div key={creator.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col items-center text-center hover:border-[#f1c40f] transition-colors duration-300">
                            <img src={creator.avatar_url} alt={creator.name} className="w-24 h-24 rounded-full border-2 border-[#8e44ad] mb-4" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/1f2937/ffffff?text=Avatar'; }}/>
                            <h2 className="text-xl font-bold text-white">{creator.name}</h2>
                            <p className="text-gray-400 mt-2 flex-grow min-h-[40px]">{creator.bio}</p>
                            <Link to={`/creator/${creator.id}`} className="mt-4 w-full bg-[#f1c40f] hover:bg-[#f1c40f]/90 text-black font-bold py-2 px-4 rounded-lg">
                                Ver Canal
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <header className="absolute top-0 left-0 right-0 z-10 p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <img src="/logo.png" alt="Dark Stream" className="h-16 w-auto" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/200x60/000000/f1c40f?text=DARK+STREAM'; }} />
                    <div>
                        <Link to="/casos" className="text-white font-semibold px-4 py-2 rounded-md hover:bg-zinc-800 transition-colors">Explorar Casos</Link>
                        <Link to="/login" className="bg-[#8e44ad] hover:bg-[#8e44ad]/90 text-white font-semibold ml-2 px-4 py-2 rounded-md transition-colors">Entrar</Link>
                    </div>
                </div>
            </header>
            <main className="flex-grow flex items-center justify-center text-center px-4 relative">
                <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('https://placehold.co/1920x1080/000000/111111?text=.')" }}></div>
                <div className="relative z-10">
                    <h1 className="text-5xl md:text-7xl font-bold mb-4">Histórias que precisam ser contadas.</h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8">O ponto de encontro para fãs e criadores de True Crime. Mergulhe em investigações profundas e desvende os maiores mistérios.</p>
                    <Link to="/casos" className="bg-[#f1c40f] hover:bg-[#f1c40f]/90 text-black font-bold py-3 px-8 rounded-lg text-lg transition-transform duration-200 hover:scale-105">Comece a Explorar</Link>
                </div>
            </main>
        </div>
    );
}

function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setErrorMsg(error.message); } else { navigate('/casos'); }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <Link to="/" className="flex justify-center mb-6"><img src="/logo.png" alt="Dark Stream" className="h-[4.5rem] w-auto" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/200x60/000000/f1c40f?text=DARK+STREAM'; }} /></Link>
                <form onSubmit={handleLogin} className="w-full bg-zinc-900 p-6 rounded">
                    <h2 className="text-2xl mb-4 text-center">Login</h2>
                    {errorMsg && <p className="text-red-500 mb-2">{errorMsg}</p>}
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full mb-3 p-2 bg-zinc-800 rounded text-white" />
                    <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full mb-4 p-2 bg-zinc-800 rounded text-white" />
                    <button type="submit" className="w-full bg-[#8e44ad] hover:bg-[#8e44ad]/90 py-2 rounded">Entrar</button>
                </form>
            </div>
        </div>
    );
}

function MainLayout() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    
    const dropdownTimer = useRef(null);
    const openDropdown = () => { if (dropdownTimer.current) clearTimeout(dropdownTimer.current); setShowDropdown(true); };
    const closeDropdown = () => { dropdownTimer.current = setTimeout(() => setShowDropdown(false), 100); };
    const categories = [
    { key: 'Nacionais', label: 'Nacionais' },
    { key: 'Internacionais', label: 'Internacionais' },
    { key: 'Não solucionados', label: 'Não solucionados' },
    { key: 'Solucionados', label: 'Solucionados' },
    { key: 'Serial Killers', label: 'Serial Killers' },
    { key: 'Documentários', label: 'Documentários' },
    { key: 'Sobrenaturais', label: 'Sobrenaturais' },
];
    
    const handleSearch = (e) => {
        if(e.key === 'Enter' || e.type === 'click') {
            e.preventDefault();
            setSearchParams(prev => {
                if (searchTerm.trim()) {
                    prev.set('q', searchTerm.trim());
                } else {
                    prev.delete('q');
                }
                return prev;
            }, { replace: true });
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-black text-white font-sans">
            <nav className="bg-black px-4 sm:px-6 md:px-10 lg:px-20 py-4 flex flex-col sm:flex-row justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link to="/casos" className="focus:outline-none"><img src="/logo.png" alt="Dark Stream" className="h-[4.5rem] w-auto self-center" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/200x60/000000/f1c40f?text=DARK+STREAM'; }} /></Link>
                    <Link to="/criadores" className="hidden sm:block"><button className="bg-[#f1c40f] hover:bg-[#f1c40f]/90 text-black font-semibold px-4 py-1 rounded">👤 Criadores</button></Link>
                    <div className="relative hidden sm:block" onMouseEnter={openDropdown} onMouseLeave={closeDropdown}>
                        <button className="bg-[#f1c40f] hover:bg-[#f1c40f]/90 text-black font-semibold px-4 py-1 rounded">🖿 Casos <span className="ml-1">▼</span></button>
                        {showDropdown && (
                            <ul className="absolute left-0 mt-2 bg-black border border-[#f1c40f] rounded shadow-md py-2 w-56 z-10">{categories.map((c) => (<li key={c.key}><Link to={`/casos?categoria=${c.key}`} className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-zinc-700">{c.label}</Link></li>))}</ul>
                        )}
                    </div>
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0 items-center">
                    <div className="flex items-center">
                        {showSearch && (
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearch}
                                placeholder="Buscar..."
                                className="bg-zinc-900 border border-[#8e44ad] text-white px-3 py-1.5 rounded w-40 sm:w-64 focus:outline-none transition-all duration-300"
                            />
                        )}
                        <button onClick={() => setShowSearch(!showSearch)} className="bg-[#f1c40f] hover:bg-[#f1c40f]/90 text-black font-bold p-2 rounded ml-2" title="Buscar">🔍</button>
                    </div>

                    {user ? (
                        <>
                            <Link to="/painel"><button className="bg-[#8e44ad] hover:bg-[#8e44ad]/90 text-white font-semibold px-4 py-1.5 rounded">Painel</button></Link>
                            <button onClick={() => { signOut(); navigate('/'); }} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-1 rounded">Sair</button>
                        </>
                    ) : (<Link to="/login"><button className="bg-[#8e44ad] hover:bg-[#8e44ad]/90 text-white font-semibold px-4 py-1 rounded">Entrar</button></Link>)}
                </div>
            </nav>
            <main className="flex-1"><Outlet /></main>
            <footer className="bg-black px-4 sm:px-6 md:px-10 lg:px-20 text-center py-4 text-sm text-gray-400 mt-10"><p>© 2025 Dark Stream. Todos os direitos reservados.</p></footer>
        </div>
    );
}

function CasosPage() {
    const navigate = useNavigate();
    const { videos, loading } = useVideos();
    const [searchParams] = useSearchParams();
    const [rotatedCards, setRotatedCards] = useState({});
    
    const category = searchParams.get('categoria');
    const query = searchParams.get('q');

    const filteredVideos = videos.filter(video => {
        const categoryMatch = !category || video.category === category;
        const searchMatch = !query || video.title.toLowerCase().includes(query.toLowerCase());
        return categoryMatch && searchMatch;
    });

    const toggleCardRotation = (id) => setRotatedCards(p => ({ ...p, [id]: !p[id] }));
    const pageTitle = query ? `Buscando por: "${query}"` : (category ? `Casos: ${category}` : 'Casos em destaque');

    return (
        <main className="mt-6">
            <section className="px-4 sm:px-6 md:px-10 lg:px-20">
                <h2 className="text-white text-2xl mb-6 text-left px-4">{pageTitle}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-4 pb-10">
                    {loading ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                        : filteredVideos.map((video) => (
                             <div key={video.id} className="transform transition-transform duration-300 group hover:scale-[1.03] perspective-[1000px]">
                                <div className={`relative w-full max-w-[280px] mx-auto min-h-[300px] transition-transform duration-500 [transform-style:preserve-3d] ${rotatedCards[video.id] ? '[transform:rotateY(180deg)]' : ''}`}>
                                    <div className="absolute inset-0 bg-black border-2 border-[#f1c40f] rounded-lg p-3 flex flex-col justify-between h-full [backface-visibility:hidden] cursor-pointer" onClick={() => navigate(`/video/${video.id}`)}>
                                        <img src={video.thumbnail} alt={video.title} className="rounded-md object-cover w-full h-40 mb-2" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/280x160/111/f1c40f?text=Video'; }} />
                                        <h2 className="text-center text-white text-xs sm:text-base capitalize tracking-wide leading-snug mt-[0.55rem] line-clamp-2">{video.title}</h2>
                                        <div className="mt-auto flex justify-between gap-2">
                                            <Link to={`/video/${video.id}`} className="bg-[#f1c40f] hover:bg-[#f1c40f]/90 text-[#040402] font-bold py-2 px-3 rounded text-xs text-center flex-1">🎬 Assistir agora</Link>
                                            <button onClick={(e) => { e.stopPropagation(); toggleCardRotation(video.id); }} className="bg-gray-700 hover:bg-gray-600/90 font-semibold py-2 px-3 rounded text-xs text-center flex-1">ℹ️ Mais Info</button>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 bg-black border-2 border-[#f1c40f] rounded-lg p-4 flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden]">
                                        <div>
                                            <div className="bg-zinc-900 rounded-lg p-3 flex items-center justify-between mb-3"><div className="flex items-center gap-2"><img src={video.creatorAvatar} alt={video.creatorName} className="w-8 h-8 rounded-full" /><span className="text-white font-semibold">{video.creatorName}</span></div></div>
                                            <div className="mb-2 bg-zinc-900 border border-zinc-700 p-2 rounded text-xs"><h3 className="text-white font-semibold mb-1 line-clamp-2">🎥 {video.title}</h3><p className="mb-1">📂 Categoria: {video.category}</p></div>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); toggleCardRotation(video.id); }} className="border border-[#9c27b0] text-[#9c27b0] hover:bg-[#9c27b0]/20 rounded px-2 py-1 w-full">🠔 Voltar</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </section>
        </main>
    );
}

// 4. --- COMPONENTE PRINCIPAL E ROTAS ---
export default function App() {
    return (
        <Router>
            <AuthProvider>
              <VideoProvider>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route element={<MainLayout />}>
                        <Route path="/casos" element={<CasosPage />} />
                        <Route path="/criadores" element={<CreatorsPage />} />
                        <Route path="/creator/:id" element={<PlaceholderPage title="Página do Canal do Criador" />} />
                        <Route path="/video/:id" element={<VideoPlayer />} />
                        <Route path="/painel" element={<CreatorPanel />} />
                        <Route path="/meus-videos" element={<MyVideos />} />
                    </Route>
                    <Route path="*" element={<PlaceholderPage title="404 - Página Não Encontrada" />} />
                </Routes>
              </VideoProvider>
            </AuthProvider>
        </Router>
    );
}
