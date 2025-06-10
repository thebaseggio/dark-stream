import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase'
import VideoPlayer from './pages/VideoPlayer';
import CreatorPanel from './pages/CreatorPanel';
import MyVideos from './pages/MyVideos';

function AppContent() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [videos, setVideos] = useState([]);
  const [videoToEdit, setVideoToEdit] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownTimer = useRef(null);
  const [showCreatorsDropdown, setShowCreatorsDropdown] = useState(false);
  const creatorsTimer = useRef(null);

  const openDropdown = () => {
    if (dropdownTimer.current) {
      clearTimeout(dropdownTimer.current);
      dropdownTimer.current = null;
    }
    setShowDropdown(true);
  };

  const closeDropdown = () => {
    dropdownTimer.current = setTimeout(() => {
      setShowDropdown(false);
    }, 100);
  };

  const openCreatorsDropdown = () => {
    if (creatorsTimer.current) {
      clearTimeout(creatorsTimer.current);
      creatorsTimer.current = null;
    }
    setShowCreatorsDropdown(true);
  };

  const closeCreatorsDropdown = () => {
    creatorsTimer.current = setTimeout(() => {
      setShowCreatorsDropdown(false);
    }, 100);
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
    const loadVideos = async () => {
      const { data } = await supabase
        .from('videos')
        .select('id, title, description, videoUrl, thumbnail, duration, publishedAt, category, views')
        .order('id');
      if (data) {
        setVideos(data);
      }
    };
    loadVideos();
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
    const { data } = await supabase
      .from('videos')
      .select('id, title, description, videoUrl, thumbnail, duration, publishedAt, category, views')
      .order('id');
    if (data) setVideos(data);
  };

  const handleDeleteVideo = async (id) => {
    await supabase.from('videos').delete().eq('id', id);
    const { data } = await supabase
      .from('videos')
      .select('id, title, description, videoUrl, thumbnail, duration, publishedAt, category, views')
      .order('id');
    if (data) setVideos(data);
  };

  const handleEditVideo = (video) => {
    setVideoToEdit(video);
    navigate('/painel');
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <nav className="bg-black border-b border-[#f1c40f] p-4 flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="focus:outline-none"
          >
            <img src="/logo.png" alt="Dark Stream" className="h-16 w-auto" />
          </button>
        <div
          className="relative hidden sm:block"
          onMouseEnter={openDropdown}
          onMouseLeave={closeDropdown}
        >
          <button
            type="button"
            className="text-gray-300 text-sm focus:outline-none flex items-center border border-[#f1c40f] px-2 py-1 rounded"
          >
            Categorias <span className="ml-1">▼</span>
          </button>
          {showDropdown && (
            <ul
              className="absolute left-0 mt-2 bg-black border border-[#f1c40f] rounded shadow-md py-2 w-56 z-10"
              onMouseEnter={openDropdown}
              onMouseLeave={closeDropdown}
            >
              {categories.map((c) => (
                <li key={c.key}>
                  <button
                    type="button"
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
        <div
          className="relative hidden sm:block"
          onMouseEnter={openCreatorsDropdown}
          onMouseLeave={closeCreatorsDropdown}
        >
          <button
            type="button"
            className="text-gray-300 text-sm focus:outline-none flex items-center border border-[#f1c40f] px-2 py-1 rounded"
          >
            Criadores <span className="ml-1">▼</span>
          </button>
          {showCreatorsDropdown && (
            <ul
              className="absolute left-0 mt-2 bg-black border border-[#f1c40f] rounded shadow-md py-2 w-40 z-10"
              onMouseEnter={openCreatorsDropdown}
              onMouseLeave={closeCreatorsDropdown}
            >
              {creators.map((creator) => (
                <li key={creator}>
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
          <Link to="/"><button className="bg-[#8e44ad] hover:bg-[#8e44ad]/90 text-white font-semibold px-4 py-1.5 rounded">Início</button></Link>
          <Link to="/painel"><button className="bg-[#8e44ad] hover:bg-[#8e44ad]/90 text-white font-semibold px-4 py-1.5 rounded">Painel de Criador</button></Link>
          <Link to="/meus-videos"><button className="bg-[#8e44ad] hover:bg-[#8e44ad]/90 text-white font-semibold px-4 py-1.5 rounded">Meus Vídeos</button></Link>
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
                  <Link
                    to={`/video/${video.id}`}
                    key={video.id}
                    className="transform hover:scale-105 transition-transform duration-200 group perspective-[1000px]"
                  >
                    <div className="relative h-[350px] [transform-style:preserve-3d] transition-transform duration-500 group-hover:[transform:rotateY(180deg)]">
                      <div className="absolute inset-0 bg-black border border-[#f1c40f] rounded-lg p-4 flex flex-col justify-between cursor-pointer [backface-visibility:hidden]">
                        <img src={video.thumbnail} alt={video.title} className="rounded-md object-cover w-full h-40" />
                        <div className="mt-3">
                          <h2 className="text-white text-base font-semibold text-left line-clamp-2 mb-1">{video.title}</h2>
                          <p className="text-sm text-gray-500 text-center">👁️ {video.views || 0} visualizações</p>
                        </div>
                        <div className="mt-3 flex justify-center">
                          <span className="bg-[#8e44ad] hover:bg-[#8e44ad]/90 text-white font-semibold py-1 px-3 rounded">
                            Assistir agora
                          </span>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black border border-[#f1c40f] rounded-lg p-4 flex flex-col justify-between items-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
                        <div className="flex flex-col items-center">
                          <p className="text-sm text-gray-300">📅 {video.publishedAt}</p>
                          <p className="text-sm text-gray-300">⏱ {video.duration}</p>
                        </div>
                        <div className="mt-3">
                          <span className="bg-[#8e44ad] hover:bg-[#8e44ad]/90 text-white font-semibold py-1 px-3 rounded">
                            Ver Mais
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
            </main>
          }
        />
        <Route path="/painel" element={<CreatorPanel onAddVideo={handleAddVideo} videoToEdit={videoToEdit} />} />
        <Route path="/video/:id" element={<VideoPlayer videos={videos} />} />
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