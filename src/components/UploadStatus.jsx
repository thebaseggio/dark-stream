// src/components/UploadStatus.jsx

import React from 'react';
import { useUpload } from '../contexts/UploadProvider';

export default function UploadStatus() {
  const { uploadState, resetUploadState } = useUpload();

  if (uploadState.status === 'idle') {
    return null;
  }

  const getStatusMessage = () => {
    switch (uploadState.status) {
      case 'uploading':
        return `Enviando vídeo... ${uploadState.progress}%`;
      case 'saving':
        return 'Upload concluído. Salvando informações...';
      case 'success':
        return 'Upload concluído com sucesso!';
      case 'error':
        return `Falha no upload: ${uploadState.error}`;
      default:
        return '';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-zinc-800 text-white p-4 rounded-lg shadow-lg w-72 z-50 border border-zinc-700">
      <p className="font-semibold text-sm mb-2">{getStatusMessage()}</p>
      {(uploadState.status === 'uploading' || uploadState.status === 'saving') && (
        <div className="w-full bg-zinc-600 rounded-full h-2">
          <div className="bg-[#f1c40f] h-2 rounded-full" style={{ width: `${uploadState.progress}%` }}></div>
        </div>
      )}
      {(uploadState.status === 'success' || uploadState.status === 'error') && (
        <button 
          onClick={resetUploadState} 
          className="text-xs mt-2 bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded">
          Fechar
        </button>
      )}
    </div>
  );
}