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
    if (!uploadState.videoMetadata) {
      showNotification('error', 'Metadados não encontrados para salvar.');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const creatorId = uploadState.videoMetadata.creator_id;

      if (!session || session.user.id !== creatorId) {
        throw new Error('Sessão inválida para publicar o vídeo.');
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', creatorId)
        .single();

      if (profileError || profileData?.role !== 'partner') {
        throw new Error('Apenas parceiros podem publicar vídeos.');
      }

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