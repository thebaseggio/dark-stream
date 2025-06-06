import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import VideoPlayer from './pages/VideoPlayer';

function App() {
  const videos = [
    {
      id: 1,
      title: "Caso Evandro: Revelações Inéditas",
      thumbnail: "https://via.placeholder.com/300x170?text=Caso+Evandro",
      duration: "32:15",
    },
    {
      id: 2,
      title: "Mistério em Goiânia: Desaparecimento sem Fim",
      thumbnail: "https://via.placeholder.com/300x170?text=Goiânia",
      duration: "45:20",
    },
    {
      id: 3,
      title: "A Verdade sobre o Caso Isabella Nardoni",
      thumbnail: "https://via.placeholder.com/300x170?text=Isabella+Nardoni",
      duration: "28:42",
    },
  ];

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <h1>Dark Stream</h1>
        </nav>

        <Routes>
          <Route
            path="/"
            element={
              <main className="video-grid">
                {videos.map((video) => (
                  <div key={video.id} className="video-card">
                    <img src={video.thumbnail} alt={video.title} />
                    <div className="video-info">
                      <h2>{video.title}</h2>
                      <p className="duration">⏱ {video.duration}</p>
                      <Link to={`/video/${video.id}`}>
                        <button className="watch-button">Assistir agora</button>
                      </Link>
                    </div>
                  </div>
                ))}
              </main>
            }
          />
          <Route path="/video/:id" element={<VideoPlayer />} />
        </Routes>

        <footer className="footer">
          <p>© 2025 Dark Stream. Todos os direitos reservados.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
