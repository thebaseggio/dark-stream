import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import VideoPlayer from './pages/VideoPlayer';
import CreatorPanel from './pages/CreatorPanel';
import MyVideos from './pages/MyVideos';

function AppContent() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [videos, setVideos] = useState([]);
  const [videoToEdit, setVideoToEdit] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

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

  useEffect(() => {
    const storedVideos = localStorage.getItem('darkstream_videos');
    if (storedVideos) {
      setVideos(JSON.parse(storedVideos));
    }
  }, []);

  const handleCategoryFilter = (category) => {
    setSelectedCategory((prev) => (prev === category ? '' : category));
    setShowDropdown(false);
  };

  const saveVideosToLocalStorage = (data) => {
    localStorage.setItem('darkstream_videos', JSON.stringify(data));
  };

  const handleAddVideo = (newVideo) => {
    if (videoToEdit) {
      const updated = videos.map((v) =>
        v.id === videoToEdit.id ? { ...v, ...newVideo } : v
      );
      setVideos(updated);
      saveVideosToLocalStorage(updated);
      setVideoToEdit(null);
    } else {
      const updated = [
        ...videos,
        { ...newVideo, id: videos.length + 1, views: 0 },
      ];
      setVideos(updated);
      saveVideosToLocalStorage(updated);
    }
  };

  const handleDeleteVideo = (id) => {
    const filtered = videos.filter((v) => v.id !== id);
    setVideos(filtered);
    saveVideosToLocalStorage(filtered);
  };

  const handleEditVideo = (video) => {
    setVideoToEdit(video);
    navigate('/painel');
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <nav className="bg-black border-b border-yellow-500 p-4 flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center gap-6">
          <Link to="/">
            <img src="/logo.png" alt="Dark Stream logo" className="h-12 sm:h-14 object-contain" />
          </Link>
          <div
            className="relative hidden sm:block"
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <button className="text-gray-300 text-sm">
              Categorias
            </button>
            {showDropdown && (
              <ul className="absolute left-0 mt-2 bg-zinc-800 border border-yellow-500 rounded shadow-md py-2 w-56 z-10">
                {categories.map((c) => (
                  <li key={c.key}>
                    <button
                      onClick={() => handleCategoryFilter(c.key)}
                      className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-zinc-700"
                    >
                      {c.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <ul className="hidden sm:flex gap-4 text-gray-300 text-sm ml-4">
            <li><a href="#">Criadores</a></li>
            <li><a href="#">Casos Nacionais</a></li>
            <li><a href="#">Casos Internacionais</a></li>
          </ul>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <Link to="/"><button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-1.5 rounded">Início</button></Link>
          <Link to="/painel"><button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-1.5 rounded">Painel de Criador</button></Link>
          <Link to="/meus-videos"><button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-1.5 rounded">Meus Vídeos</button></Link>
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
                      <div className="absolute inset-0 bg-black border border-yellow-500 rounded-lg p-4 flex flex-col justify-between cursor-pointer [backface-visibility:hidden]">
                        <img src={video.thumbnail} alt={video.title} className="rounded-md object-cover w-full h-40" />
                        <div className="mt-3">
                          <h2 className="text-white text-base font-semibold text-left line-clamp-2 mb-1">{video.title}</h2>
                          <p className="text-sm text-gray-500 text-center">👁️ {video.views || 0} visualizações</p>
                        </div>
                        <div className="mt-3 flex justify-center">
                          <span className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1 px-3 rounded">
                            Assistir agora
                          </span>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black border border-yellow-500 rounded-lg p-4 flex flex-col justify-between items-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
                        <div className="flex flex-col items-center">
                          <p className="text-sm text-gray-300">📅 {video.publishedAt}</p>
                          <p className="text-sm text-gray-300">⏱ {video.duration}</p>
                        </div>
                        <div className="mt-3">
                          <span className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1 px-3 rounded">
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

      <footer className="bg-black border-t border-yellow-500 text-center py-4 text-sm text-gray-400 mt-10">
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
