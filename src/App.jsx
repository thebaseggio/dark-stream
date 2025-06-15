// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate
} from 'react-router-dom';
import { supabase, loadAllVideos } from './supabase';
import VideoPlayer from './pages/VideoPlayer';
import CreatorPanel from './pages/CreatorPanel';
import MyVideos from './pages/MyVideos';

// Deriva a URL da thumbnail do YouTube a partir do link de embed
function deriveYouTubeThumb(embedUrl) {
  const urlParts = embedUrl.split('/');
  const videoIdWithParams = urlParts[urlParts.length - 1];
  const videoId = videoIdWithParams.split('?')[0];
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

// Página de login
function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMsg(error.message);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-zinc-900 p-6 rounded"
      >
        <h2 className="text-2xl mb-4">Login</h2>
        {errorMsg && <p className="text-red-500 mb-2">{errorMsg}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full mb-3 p-2 bg-zinc-800 rounded text-white"
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full mb-4 p-2 bg-zinc-800 rounded text-white"
        />
        <button
          type="submit"
          className="w-full bg-[#8e44ad] hover:bg-[#8e44ad]/90 py-2 rounded"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [videos, setVideos] = useState([]);
  const [videoToEdit, setVideoToEdit] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownTimer = useRef(null);
  const [showCreatorsDropdown, setShowCreatorsDropdown] = useState(false);
  const creatorsTimer = useRef(null);
  const [rotatedCards, setRotatedCards] = useState({});

  // Monitora sessão/auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Carrega vídeos
  useEffect(() => {
    let mounted = true;
    loadAllVideos()
      .then((data) => {
        if (!mounted) return;
        setVideos(
          data.map((v) => ({
            ...v,
            thumbnail: v.thumbnail || deriveYouTubeThumb(v.videoUrl),
          }))
        );
      })
      .catch(console.error);
    return () => { mounted = false; };
  }, []);

  const openDropdown = () => {
    if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
    setShowDropdown(true);
  };
  const closeDropdown = () => {
    dropdownTimer.current = setTimeout(() => setShowDropdown(false), 100);
  };
  const openCreatorsDropdown = () => {
    if (creatorsTimer.current) clearTimeout(creatorsTimer.current);
    setShowCreatorsDropdown(true);
  };
  const closeCreatorsDropdown = () => {
    creatorsTimer.current = setTimeout(() => setShowCreatorsDropdown(false), 100);
  };

  const toggleCardRotation = (id) => {
    setRotatedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory((prev) => (prev === category ? '' : category));
    setShowDropdown(false);
  };

  const handleAddVideo = async (newVideo) => {
    if (videoToEdit) {
      await supabase.from('videos').update(newVideo).eq('id', videoToEdit.id);
      setVideoToEdit(null);
    } else {
      await supabase.from('videos').insert([{ ...newVideo, views: 0 }]);
    }
    const data = await loadAllVideos();
    setVideos(
      data.map((v) => ({
        ...v,
        thumbnail: v.thumbnail || deriveYouTubeThumb(v.videoUrl),
      }))
    );
  };

  const handleDeleteVideo = async (id) => {
    await supabase.from('videos').delete().eq('id', id);
    const data = await loadAllVideos();
    setVideos(
      data.map((v) => ({
        ...v,
        thumbnail: v.thumbnail || deriveYouTubeThumb(v.videoUrl),
      }))
    );
  };

  const handleEditVideo = (video) => {
    setVideoToEdit(video);
    navigate('/painel');
  };

  const categories = [
    { key: 'investigativos', label: 'Investigativos' },
    { key: 'desaparecimentos', label: 'Desaparecimentos' },
    { key: 'nao-solucionados', label: 'Casos não solucionados' },
    { key: 'crimes-famosos', label: 'Crimes Famosos' },
    { key: 'serial-killers', label: 'Serial Killers' },
    { key: 'podcasts-entrevistas', label: 'Podcasts e Entrevistas' },
    { key: 'documentarios', label: 'Documentários' },
    { key: 'casos-sobrenaturais', label: 'Casos Sobrenaturais' },
  ];
  const creators = ['Perfil 1', 'Perfil 2', 'Perfil 3'];

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <nav className="bg-black border-b border-[#f1c40f] p-4 flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center gap-6">
          <Link to="/" className="focus:outline-none">
            <img src="/logo.png" alt="Dark Stream" className="h-20 w-auto" />
          </Link>
          {/* Categorias */}
          <div
            className="relative hidden sm:block"
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdown}
          >
            <button className="bg-[#f1c40f] hover:bg-[#f1c40f]/90 text-black font-semibold px-4 py-1.5 rounded">
              Categorias <span className="ml-1">▼</span>
            </button>
            {showDropdown && (
              <ul className="absolute left-0 mt-2 bg-black border-[#f1c40f] rounded shadow-md py-2 w-56 z-10">
                {categories.map((c) => (
                  <li key={c.key}>
                    <button
                      onClick={() => handleCategoryFilter(c.key)}
                      className={`block w-full text-left px-4 py-2 text-gray-300 hover:bg-zinc-700 ${
                        selectedCategory === c.key ? 'bg-zinc-700' : ''
                      }`}
                    >
                      {c.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Criadores */}
          <div
            className="relative hidden sm:block"
            onMouseEnter={openCreatorsDropdown}
            onMouseLeave={closeCreatorsDropdown}
          >
            <button className="bg-[#f1c40f] hover:bg-[#f1c40f]/90 text-black font-semibold px-4 py-1.5 rounded">
              Criadores <span className="ml-1">▼</span>
            </button>
            {showCreatorsDropdown && (
              <ul className="absolute left-0 mt-2 bg-black border border-[#f1c40f] rounded shadow-md py-2 w-40 z-10">
                {creators.map((name) => (
                  <li key={name}>
                    <a href="#" className="block px-4 py-2 text-gray-300 hover:bg-zinc-700">
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* Menu direito */}
        <div className="flex gap-2 mt-2 sm:mt-0">
          <Link to="/">
            <button className="bg-[#f1c40f] hover:bg-[#f1c40f]/90 text-black font-semibold px-4 py-1.5 rounded">
              Início
            </button>
          </Link>
          {user ? (
            <>
              <Link to="/painel">
                <button className="bg-[#8e44ad] hover:bg-[#8e44ad]/90 text-white font-semibold px-4 py-1.5 rounded">
                  Painel de Criador
                </button>
              </Link>
              <Link to="/meus-videos">
                <button className="bg-[#8e44ad] hover:bg-[#8e44ad]/90 text-white font-semibold px-4 py-1.5 rounded">
                  Meus Vídeos
                </button>
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate('/');
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-1.5 rounded"
              >
                Sair
              </button>
            </>
          ) : (
            <Link to="/login">
              <button className="bg-[#8e44ad] hover:bg-[#8e44ad]/90 text-white font-semibold px-4 py-1.5 rounded">
                Entrar
              </button>
            </Link>
          )}
        </div>
      </nav>
      {/* Rotas */}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/" 
          element={
            <main className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-4 pb-10 max-w-7xl mx-auto">
              {videos
                .filter((v) => !selectedCategory || v.category === selectedCategory)
                .map((video) => (
<div
  key={video.id}
  className="transform transition-transform duration-200 group perspective-[1000px]"
>
  <div
    className={`relative w-full max-w-md mx-auto
      min-h-[340px]
      transition-transform duration-500 [transform-style:preserve-3d] ${
        rotatedCards[video.id] ? '[transform:rotateY(180deg)]' : ''
      }`}
  >
    {/* ─── Frente ────────────────────────────────────────── */}
    <div className="absolute inset-0 bg-black border-2 border-[#f1c40f] rounded-lg p-4 flex flex-col justify-between [backface-visibility:hidden]">
      <img
        src={video.thumbnail}
        alt={video.title}
        className="rounded-md object-cover w-full h-48 mb-2"  /* ↓ margem */
      />
      <h2 className="text-white text-l font-bold uppercase tracking-wide">
        {video.title}
      </h2>
      <div className="mt-auto flex justify-between gap-2">
        <Link
          to={`/video/${video.id}`}
          className="bg-[#f1c40f] hover:bg-[#f1c40f]/90 text-[#040402] font-bold py-2 px-4 rounded text-sm text-center flex-1"
        >
        🎬Assistir agora
        </Link>
        <button
          onClick={() => toggleCardRotation(video.id)}
          className="bg-gray-700 hover:bg-gray-600/90 font-semibold py-2 px-4 rounded text-sm text-center flex-1"
        >
          ℹ️Mais Info
        </button>
      </div>
    </div>

    {/* ─── Verso ─────────────────────────────────────────── */}
    <div
      onClick={() => navigate(`/canal/${video.creatorId}`)}
      className="absolute inset-0 bg-zink-800 border-2 border-[#f1c40f] rounded-lg p-4 flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden] cursor-pointer"
    >
      {/* Sub-card 1 */}
      <div className="bg-zinc-900 rounded-lg p-3 flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <img
            src={video.creatorAvatar}
            alt={video.creatorName}
            className="w-8 h-8 rounded-full"
          />
          <span className="text-white font-semibold">
            {video.creatorName}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); /* handleFollow */ }}
          className="bg-[#f1c40f] hover:bg-[#f1c40f]/90 text-black text-xs font-semibold px-2 py-1 rounded"
        >
          Seguir
        </button>
      </div>
      {/* Sub-card 2 */}
      <div className="bg-zinc-900 rounded-lg p-3 flex flex-col gap-2 flex-1">
        <h1>Resumo:</h1>
        <p className="text-gray-300 text-sm">
          {video.description}
        </p>
        <div className="flex justify-between text-gray-400 text-xs">
          <span>📅 {video.publishedAt}</span>
          <span>⏱ {video.duration}</span>
          <span>👁️ {video.views || 0}</span>
        </div>
      </div>
      {/* Botão Voltar */}
      <div className="flex justify-center mt-3">
        <button
          onClick={(e) => { e.stopPropagation(); toggleCardRotation(video.id); }}
          className="bg-[#8e44ad] hover:bg-[#8e44ad]/90 text-white text-sm font-semibold px-4 py-2 rounded"
        >
          Voltar
        </button>
      </div>
    </div>
  </div>
</div>
                ))}
            </main>
          }
        />
        <Route
          path="/painel"
          element={<CreatorPanel onAddVideo={handleAddVideo} videoToEdit={videoToEdit} />}
        />
        <Route path="/video/:id" element={<VideoPlayer />} />
        <Route
          path="/meus-videos"
          element={<MyVideos videos={videos} onEdit={handleEditVideo} onDelete={handleDeleteVideo} />}
        />
      </Routes>

      <footer className="bg-black border-t border-[#f1c40f] text-center py-4 text-sm text-gray-400 mt-10">
        <p>© 2025 Dark Stream. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
