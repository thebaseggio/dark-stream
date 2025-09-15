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

const handleUploadSuccess = async (videoUrl) => {
    console.log('✅ DETETIVE 1: handleUploadSuccess foi chamada com a URL:', videoUrl);

    if (!uploadState.videoMetadata) {
      console.error('❌ ERRO: Metadados do vídeo não encontrados no estado.');
      showNotification('error', "Metadados não encontrados para salvar.");
      return;
    }
    
    try {
      const finalMetadata = { ...uploadState.videoMetadata, videoUrl };
      console.log('🕵️ DETETIVE 2: Tentando inserir estes metadados no banco:', finalMetadata);

      const { error } = await supabase.from('videos').insert([finalMetadata]);
      
      if (error) {
        console.error('❌ ERRO DO SUPABASE ao inserir:', error);
        throw error;
      }

      console.log('🎉 DETETIVE 3: Inserção no banco de dados foi um SUCESSO.');
      setUploadState(prev => ({ ...prev, status: 'success', progress: 100 }));
      showNotification('success', 'Vídeo publicado com sucesso no seu painel!');
    
    } catch (error) {
      console.error('💥 ERRO no bloco CATCH:', error.message);
      setUploadState(prev => ({ ...prev, status: 'error', error: `Erro ao salvar no banco: ${error.message}` }));
      showNotification('error', `Erro ao publicar o vídeo: ${error.message}`);
    }
  };

  const handleSuccessRef = useRef(handleUploadSuccess);

  useEffect(() => {
    handleSuccessRef.current = handleUploadSuccess;
  }, [handleUploadSuccess]);

  useEffect(() => {
    workerRef.current = new Worker();

    workerRef.current.onmessage = (event) => {
      const { type, payload } = event.data;
      switch (type) {
        case 'progress':
          setUploadState(prev => ({ ...prev, status: 'uploading', progress: payload.percentage }));
          break;
        case 'success':
          showNotification('success', 'Upload concluído! Salvando informações...');
          handleSuccessRef.current(payload.finalUrl);
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
  }, []);


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