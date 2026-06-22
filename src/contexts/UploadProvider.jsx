import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.js';
import { useNotification } from './NotificationProvider.jsx';
import Worker from '../worker.js?worker';

const UploadContext = createContext();

export const useUpload = () => useContext(UploadContext);

const initialUploadState = {
  progress: 0,
  status: 'idle',
  error: null,
  videoMetadata: null,
};

export const UploadProvider = ({ children }) => {
  const { showNotification } = useNotification();
  const [uploadState, setUploadState] = useState(initialUploadState);

  const workerRef = useRef(null);
  const showNotificationRef = useRef(showNotification);

  useEffect(() => {
    showNotificationRef.current = showNotification;
  }, [showNotification]);

  const handleUploadSuccess = useCallback(async (videoUrl) => {
    const metadata = uploadState.videoMetadata;

    if (!metadata) {
      setUploadState(prev => ({ ...prev, status: 'error', error: 'Metadados não encontrados para salvar.' }));
      showNotification('error', 'Metadados não encontrados para salvar.');
      return;
    }

    try {
      setUploadState(prev => ({ ...prev, status: 'saving', progress: 100 }));

      const { data: { session } } = await supabase.auth.getSession();
      const creatorId = metadata.creator_id;

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

      const { action = 'insert', id: videoId, ...videoFields } = metadata;
      const finalMetadata = { ...videoFields, videoUrl };
      let databaseError = null;
      let successMessage = 'Vídeo publicado com sucesso no seu painel!';

      if (action === 'update') {
        if (!videoId) {
          throw new Error('Identificador do vídeo não encontrado para atualização.');
        }

        const { error } = await supabase
          .from('videos')
          .update(finalMetadata)
          .eq('id', videoId)
          .eq('creator_id', creatorId);

        databaseError = error;
        successMessage = 'Vídeo atualizado com sucesso!';
      } else {
        const { error } = await supabase.from('videos').insert([finalMetadata]);

        databaseError = error;
      }

      if (databaseError) throw databaseError;

      setUploadState(prev => ({ ...prev, status: 'success', progress: 100 }));
      showNotification('success', successMessage);
    } catch (error) {
      setUploadState(prev => ({ ...prev, status: 'error', error: `Erro ao salvar no banco: ${error.message}` }));
      showNotification('error', `Erro ao publicar o vídeo: ${error.message}`);
    }
  }, [showNotification, uploadState.videoMetadata]);

  const handleSuccessRef = useRef(handleUploadSuccess);

  useEffect(() => {
    handleSuccessRef.current = handleUploadSuccess;
  }, [handleUploadSuccess]);

  useEffect(() => {
    const worker = new Worker();
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const { type, payload } = event.data;
      switch (type) {
        case 'progress':
          setUploadState(prev => ({ ...prev, status: 'uploading', progress: payload.percentage }));
          break;
        case 'success':
          showNotificationRef.current('success', 'Upload concluído! Salvando informações...');
          handleSuccessRef.current(payload.finalUrl);
          break;
        case 'error':
          showNotificationRef.current('error', `Falha no upload: ${payload}`);
          setUploadState(prev => ({ ...prev, status: 'error', error: payload, progress: 0 }));
          break;
        default:
          break;
      }
    };

    return () => worker.terminate();
  }, []);


  const startUpload = useCallback((uploadData, metadata) => {
    if (workerRef.current) {
      setUploadState({ progress: 0, status: 'uploading', error: null, videoMetadata: metadata });
      workerRef.current.postMessage(uploadData);
    }
  }, []);

  const resetUploadState = useCallback(() => {
    setUploadState(initialUploadState);
  }, []);

  const value = { uploadState, startUpload, resetUploadState };

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
};