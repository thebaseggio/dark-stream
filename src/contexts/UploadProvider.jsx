// src/contexts/UploadProvider.jsx (versão corrigida)

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.js';
import { useNotification } from './NotificationProvider.jsx';
import Worker from '../worker.js?worker';

const UploadContext = createContext();

export const useUpload = () => useContext(UploadContext);

export const UploadProvider = ({ children }) => {
  const { showNotification } = useNotification();
  const [uploadState, setUploadState] = useState({
    progress: 0,
    status: 'idle',
    error: null,
    videoMetadata: null,
  });

  const workerRef = useRef(null);

  useEffect(() => {
    // << 2. NOVA FORMA DE CRIAR O WORKER (MAIS SIMPLES)
    workerRef.current = new Worker();

    workerRef.current.onmessage = (event) => {
      const { type, payload } = event.data;
      switch (type) {
        case 'progress':
          setUploadState(prev => ({ ...prev, status: 'uploading', progress: payload.percentage }));
          break;
        case 'success':
          // A notificação de sucesso é chamada aqui!
          showNotification('success', 'Upload concluído! Salvando informações...');
          handleUploadSuccess(payload.finalUrl);
          break;
        case 'error':
          showNotification('error', `Falha no upload: ${payload}`);
          setUploadState(prev => ({ ...prev, status: 'error', error: payload, progress: 0 }));
          break;
        default:
          break;
      }
    };

    return () => workerRef.current.terminate();
  }, []); // Adicionada a dependência correta

  const handleUploadSuccess = async (videoUrl) => {
    // A LINHA DO ALERT FOI REMOVIDA DAQUI
    if (!uploadState.videoMetadata) {
      setUploadState(prev => ({ ...prev, status: 'error', error: "Metadados não encontrados para salvar." }));
      showNotification('error', "Metadados não encontrados para salvar.");
      return;
    }
    
    try {
      const finalMetadata = { ...uploadState.videoMetadata, videoUrl };
      const { error } = await supabase.from('videos').insert([finalMetadata]);
      if (error) throw error;
      setUploadState(prev => ({ ...prev, status: 'success', progress: 100 }));
      showNotification('success', 'Vídeo publicado com sucesso no seu painel!');
    } catch (error) {
      setUploadState(prev => ({ ...prev, status: 'error', error: `Erro ao salvar no banco: ${error.message}` }));
      showNotification('error', `Erro ao publicar o vídeo: ${error.message}`);
    }
  };

  const startUpload = useCallback((uploadData, metadata) => {
    if (workerRef.current) {
      setUploadState({ progress: 0, status: 'uploading', error: null, videoMetadata: metadata });
      workerRef.current.postMessage(uploadData);
    }
  }, []);

  const resetUploadState = useCallback(() => {
    setUploadState({ progress: 0, status: 'idle', error: null, videoMetadata: null });
  }, []);

  const value = { uploadState, startUpload, resetUploadState };

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
};