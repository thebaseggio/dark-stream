// public/worker.js

import * as tus from 'tus-js-client'; // << MUDANÇA PRINCIPAL: Usando import moderno

self.onmessage = (event) => {
  const { file, token, supabaseUrl, bucketName, objectName } = event.data;

  if (!file || !token) {
    self.postMessage({ type: 'error', payload: 'Arquivo ou token de autenticação faltando no worker.' });
    return;
  }

  const upload = new tus.Upload(file, {
    endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
    retryDelays: [0, 3000, 5000, 10000, 20000],
    headers: {
      authorization: `Bearer ${token}`,
    },
    metadata: {
      bucketName: bucketName,
      objectName: objectName,
      contentType: file.type,
    },
    onProgress: (bytesUploaded, bytesTotal) => {
      const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(0);
      self.postMessage({ type: 'progress', payload: { percentage } });
    },
    onError: (error) => {
      self.postMessage({ type: 'error', payload: error.message });
    },
    onSuccess: () => {
      const finalUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${objectName}`;
      self.postMessage({ type: 'success', payload: { finalUrl } });
    },
  });

  upload.start();
};