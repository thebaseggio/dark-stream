import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreatorPanel({ onAddVideo, videoToEdit }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    videoUrl: '',
    sourceType: 'youtube',
    category: '',
    duration: '',
    publishedAt: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (videoToEdit) {
      setFormData(videoToEdit);
    }
  }, [videoToEdit]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const cleanedData = {
      ...formData,
      videoUrl: formData.videoUrl.replace("watch?v=", "embed/"),
    };

    onAddVideo(cleanedData);
    setSubmitted(true);

    setTimeout(() => {
      navigate('/meus-videos');
    }, 2000);
  };

  return (
    <div className="p-4 max-w-xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-4">
        {videoToEdit ? "Editar Vídeo" : "Painel de Criador"}
      </h1>

      {submitted ? (
        <div className="bg-green-800 text-white p-4 rounded shadow text-center">
          ✅ {videoToEdit ? "Alterações salvas!" : "Vídeo publicado com sucesso!"}
          Redirecionando...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <select
            name="sourceType"
            value={formData.sourceType}
            onChange={handleChange}
            className="p-2 border border-zinc-700 rounded bg-zinc-900 text-white"
          >
            <option value="youtube">YouTube (embed)</option>
            <option value="upload" disabled>Upload (em breve)</option>
          </select>

          <input
            type="text"
            name="title"
            placeholder="Título do vídeo"
            value={formData.title}
            onChange={handleChange}
            required
            className="p-2 border border-zinc-700 rounded bg-zinc-900 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="description"
            placeholder="Descrição"
            value={formData.description}
            onChange={handleChange}
            required
            className="p-2 border border-zinc-700 rounded bg-zinc-900 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="thumbnail"
            placeholder="URL da imagem (thumbnail)"
            value={formData.thumbnail}
            onChange={handleChange}
            required
            className="p-2 border border-zinc-700 rounded bg-zinc-900 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="videoUrl"
            placeholder="URL do vídeo do YouTube"
            value={formData.videoUrl}
            onChange={handleChange}
            required
            className="p-2 border border-zinc-700 rounded bg-zinc-900 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="duration"
            placeholder="Duração do vídeo (ex: 01:25:33)"
            value={formData.duration}
            onChange={handleChange}
            required
            className="p-2 border border-zinc-700 rounded bg-zinc-900 text-white placeholder-gray-400"
          />
          <input
            type="date"
            name="publishedAt"
            value={formData.publishedAt}
            onChange={handleChange}
            required
            className="p-2 border border-zinc-700 rounded bg-zinc-900 text-white"
          />

          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="p-2 border border-zinc-700 rounded bg-zinc-900 text-white"
          >
            <option value="">Selecione uma categoria</option>
            <option value="investigativos">Investigativos</option>
            <option value="desaparecimentos">Desaparecimentos</option>
            <option value="nao-solucionados">Casos não solucionados</option>
            <option value="crimes-famosos">Crimes Famosos</option>
            <option value="serial-killers">Serial Killers</option>
            <option value="podcasts-entrevistas">Podcasts e Entrevistas</option>
            <option value="documentarios">Documentários</option>
            <option value="casos-sobrenaturais">Casos Sobrenaturais</option>
          </select>

          <button
            type="submit"
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            {videoToEdit ? "Salvar alterações" : "Publicar"}
          </button>
        </form>
      )}
    </div>
  );
}