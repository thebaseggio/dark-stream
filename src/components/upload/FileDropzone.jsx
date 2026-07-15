import React, { useRef, useState } from 'react';
import { formatFileSize } from '../../utils/uploadValidation';

const UploadIcon = () => (
  <svg className="w-8 h-8 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" />
  </svg>
);

export default function FileDropzone({
  id,
  accept,
  disabled = false,
  label,
  hint,
  formatsHint,
  maxSizeHint,
  selectedFile,
  existingPreviewUrl,
  onFileSelect,
  previewType = 'image',
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files) => {
    if (disabled || !files?.length) return;
    onFileSelect(files[0]);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const previewUrl = selectedFile
    ? URL.createObjectURL(selectedFile)
    : existingPreviewUrl;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{label}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative w-full min-h-[140px] rounded-lg border border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-2 px-4 py-6 text-center disabled:opacity-50 disabled:cursor-not-allowed ${
          isDragging
            ? 'bg-[#1a1a1a] border-purple-500'
            : 'bg-[#121212] border-zinc-700 hover:bg-[#1a1a1a] hover:border-purple-500'
        }`}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {previewUrl && previewType === 'image' ? (
          <img
            src={previewUrl}
            alt="Prévia"
            className="max-h-24 max-w-full object-contain rounded border border-zinc-800"
          />
        ) : previewUrl && previewType === 'video' ? (
          <div className="flex items-center gap-2 text-emerald-400">
            <UploadIcon />
            <span className="text-xs font-mono truncate max-w-[200px]">
              {selectedFile?.name || 'Vídeo selecionado'}
            </span>
          </div>
        ) : (
          <>
            <UploadIcon />
            <p className="text-sm text-zinc-300">{hint}</p>
          </>
        )}

        {selectedFile && (
          <p className="text-[10px] font-mono text-zinc-500">
            {selectedFile.name} · {formatFileSize(selectedFile.size)}
          </p>
        )}

        {formatsHint && (
          <p className="text-[10px] font-mono text-zinc-600">{formatsHint}</p>
        )}
        {maxSizeHint && (
          <p className="text-[10px] font-mono text-zinc-600">{maxSizeHint}</p>
        )}
      </button>
    </div>
  );
}
