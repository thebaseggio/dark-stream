// src/components/Searchbar.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Searchbar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      // Navegamos para a página de busca, passando o termo na URL
      navigate(`/busca?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-xs">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar vídeos, parceiros..."
        className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-full py-2 pl-4 pr-10 focus:outline-none focus:border-[#f1c40f] transition-colors text-sm"
      />
      <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-[#f1c40f]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
      </button>
    </form>
  );
}