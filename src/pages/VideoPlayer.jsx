import { useParams } from 'react-router-dom';

const mockVideos = {
  1: {
    title: "Caso Evandro: Revelações Inéditas",
    description: "Um dos casos mais polêmicos do Brasil com novas revelações.",
    videoUrl: "https://www.youtube.com/embed/ficticio1",
  },
  2: {
    title: "Mistério em Goiânia: Desaparecimento sem Fim",
    description: "Desaparecimento que chocou a cidade e continua sem solução.",
    videoUrl: "https://www.youtube.com/embed/ficticio2",
  },
  3: {
    title: "A Verdade sobre o Caso Isabella Nardoni",
    description: "Uma análise profunda de um dos casos mais impactantes do país.",
    videoUrl: "https://www.youtube.com/embed/ficticio3",
  },
};

export default function VideoPlayer() {
  const { id } = useParams();
  const video = mockVideos[id];

  if (!video) {
    return <div>Vídeo não encontrado.</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-2">{video.title}</h1>
      <p className="mb-4 text-gray-400">{video.description}</p>
      <div className="aspect-video w-full max-w-3xl mb-6">
        <iframe
          className="w-full h-96 rounded"
          src={video.videoUrl}
          title={video.title}
          frameBorder="0"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
