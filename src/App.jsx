import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { supabase, loadAllVideos } from './supabase';
import VideoPlayer from './pages/VideoPlayer';
import CreatorPanel from './pages/CreatorPanel';
import MyVideos from './pages/MyVideos';

// Deriva a URL da thumbnail do YouTube a partir do link de embed
function deriveYouTubeThumb(embedUrl) {
  const urlParts = embedUrl.split('/');
  const videoIdWithParams = urlParts[urlParts.length - 1];
  const videoId = videoIdWithParams.split('?')[0]; // Remove parâmetros extras
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function AppContent() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [videos, setVideos] = useState([]);
  const [videoToEdit, setVideoToEdit] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownTimer = useRef(null);
  const [showCreatorsDropdown, setShowCreatorsDropdown] = useState(false);
  const creatorsTimer = useRef(null);
  const [rotatedCards, setRotatedCards] = useState({});

  const openDropdown = () => {
    if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
    setShowDropdown(true);
  };

  const closeDropdown = () => {
    dropdownTimer.current = setTimeout(() => {
      setShowDropdown(false);
    }, 100);
  };

  const openCreatorsDropdown = () => {
    if (creatorsTimer.current) clearTimeout(creatorsTimer.current);
    setShowCreatorsDropdown(true);
  };

  const closeCreatorsDropdown = () => {
    creatorsTimer.current = setTimeout(() => {
      setShowCreatorsDropdown(false);
    }, 100);
  };

  const toggleCardRotation = (id) => {
    setRotatedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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

  useEffect(() => {
    let isMounted = true;
    async function fetchVideos() {
      try {
        const data = await loadAllVideos();
        if (!isMounted) return;
        const withThumbs = data.map((video) => ({
          ...video,
          thumbnail: video.thumbnail || deriveYouTubeThumb(video.videoUrl),
        }));
        setVideos(withThumbs);
      } catch (err) {
        console.error('Erro ao carregar vídeos:', err);
      }
    }
    fetchVideos();
    return () => {
      isMounted = false;
    };
  }, []);

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

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <nav className="bg-black border-b border-[#f1c40f] p-4 flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center gap-6">
          <button type="button" onClick={() => navigate('/')} className="focus:outline-none">
            <img src="/logo.png" alt="Dark Stream" className="h-16 w-auto" />
          </button>
          <div
            className="relative hidden sm:block"
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdown}
          >
            <button type="button" className="text-white font-semibold">Categorias</button>
            {showDropdown && (
              <ul className="absolute bg-black border border-[#f1c40f] mt-2 rounded z-10">
                {categories.map((cat) => (
                  <li key={cat.key}>
                    <button
                      type="button"
                      onClick={() => handleCategoryFilter(cat.key)}
                      className="block px-4 py-2 text-gray-300 hover:bg-zinc-700 w-full text-left"
                    >
                      {cat.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className="relative hidden sm:block"
            onMouseEnter={openCreatorsDropdown}
            onMouseLeave={closeCreatorsDropdown}
          >
            <button type="button" className="text-white font-semibold">Criadores</button>
            {showCreatorsDropdown && (
              <ul className="absolute bg-black border border-[#f1c40f] mt-2 rounded z-10">
                {creators.map((creator, idx) => (
                  <li key={`${creator}-${idx}`}>
                    <a href="#" className="block px-4 py-2 text-gray-300 hover:bg-zinc-700">
                      {creator}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-2 sm:mt-0">
          <Link to="/"><button type="button" className="bg-[#8e44ad] hover:bg-[#8e44ad]/90 text-white font-semibold px-4 py-1.5 rounded">Início</button></Link>
          <Link to="/painel"><button type="button" className="bg-[#8e44ad] hover:bg-[#8e44ad]/90 text-white font-semibold px-4 py-1.5 rounded">Painel de Criador</button></Link>
          <Link to="/meus-videos"><button type="button" className="bg-[#8e44ad] hover:bg-[#8e44ad]/90 text-white font-semibold px-4 py-1.5 rounded">Meus Vídeos</button></Link>
        </div>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <main className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4 pb-10 max-w-7xl mx-auto">
              {videos
                .filter((video) => !selectedCategory || video.category === selectedCategory)
                .map((video) => (
                  <div
                    key={video.id}
                    className="transform transition-transform duration-200 group perspective-[1000px]"
                  >
                    <div
                      className={`relative h-[350px] transition-transform duration-500 [transform-style:preserve-3d] ${
                        rotatedCards[video.id] ? '[transform:rotateY(180deg)]' : ''
                      }`}
                    >
                      <div className="absolute inset-0 bg-black border border-[#f1c40f] rounded-lg p-4 flex flex-col justify-between [backface-visibility:hidden]">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="rounded-md object-cover w-full h-40"
                        />
                        <h2 className="text-white text-base font-semibold mt-2 line-clamp-2">
                          {video.title}
                        </h2>
                        <p className="text-sm text-gray-500 text-center">
                          👁️ {video.views || 0} visualizações
                        </p>
                        <div className="mt-2 flex justify-between gap-2">
                          <Link
                            to={`/video/${video.id}`}
                            className="bg-[#8e44ad] hover:bg-[#8e44ad]/90 py-1 px-2 rounded text-xs text-center w-1/2"
                          >
                            Assistir agora
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleCardRotation(video.id)}
                            className="bg-gray-700 hover:bg-gray-600 py-1 px-2 rounded text-xs w-1/2"
                          >
                            Mais Info
                          </button>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black border border-[#f1c40f] rounded-lg p-4 flex flex-col justify-between items-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
                        <p className="text-sm text-gray-300">📅 {video.publishedAt}</p>
                        <p className="text-sm text-gray-300">⏱ {video.duration}</p>
                        <button
                          type="button"
                          onClick={() => toggleCardRotation(video.id)}
                          className="bg-[#8e44ad] hover:bg-[#8e44ad]/90 py-1 px-3 rounded text-xs"
                        >
                          Voltar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </main>
          }
        />
        <Route path="/painel" element={<CreatorPanel onAddVideo={handleAddVideo} videoToEdit={videoToEdit} />} />
        <Route path="/video/:id" element={<VideoPlayer />} />
        <Route
          path="/meus-videos"
          element={
            <MyVideos
              videos={videos}
              onEdit={handleEditVideo}
              onDelete={handleDeleteVideo}
            />
          }
        />
      </Routes>

      <footer className="bg-black border-t border-[#f1c40f] text-center py-4 text-sm text-gray-400 mt-10">
        <p>© 2025 Dark Stream. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;