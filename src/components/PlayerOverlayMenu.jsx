import React, { useEffect, useRef, useState } from 'react';
import PlayerSettingsModal, { SettingOptionRow, SettingRow } from './PlayerSettingsModal';

const PLAYBACK_RATES = [
  { value: 0.5, label: '0.5X' },
  { value: 0.75, label: '0.75X' },
  { value: 1, label: '1.0X' },
  { value: 1.25, label: '1.25X' },
  { value: 1.5, label: '1.5X' },
  { value: 2, label: '2.0X' },
];

const QUALITY_OPTIONS = [{ value: 'auto', label: 'AUTO (1080P)' }];

const SettingsIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </svg>
);

function formatPlaybackRate(rate) {
  const match = PLAYBACK_RATES.find((option) => option.value === rate);
  return match?.label || `${rate}X`.replace(/(\.\d)0X$/, '$1X');
}

export default function PlayerOverlayMenu({
  playbackRate,
  onPlaybackRateChange,
  captionsEnabled,
  onCaptionsChange,
  hasCaptions = false,
  autoplayEnabled,
  onAutoplayToggle,
  qualityLabel = 'AUTO (1080P)',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState('main');
  const menuRef = useRef(null);

  const closeMenu = () => {
    setIsOpen(false);
    setActivePanel('main');
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        closeMenu();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const panelTitle = activePanel === 'speed'
    ? '[ VELOCIDADE ]'
    : activePanel === 'quality'
      ? '[ QUALIDADE ]'
      : activePanel === 'captions'
        ? '[ LEGENDAS ]'
        : '[ CONFIGURAÇÕES DO PLAYER ]';

  const handleBack = () => setActivePanel('main');

  return (
    <div ref={menuRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Configurações do player"
        className={`font-mono text-xs flex items-center gap-1.5 px-2 py-1 rounded-none transition-colors cursor-pointer ${
          isOpen
            ? 'text-amber-500 bg-zinc-800/50'
            : 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-800/50'
        }`}
      >
        <SettingsIcon className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="uppercase tracking-wider">Config</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 z-50 mb-2 w-[min(calc(100vw-2rem),24rem)]">
          <PlayerSettingsModal
            title={panelTitle}
            onClose={activePanel === 'main' ? closeMenu : handleBack}
          >
            {activePanel === 'main' && (
              <>
                <SettingRow
                  label="Velocidade"
                  value={formatPlaybackRate(playbackRate)}
                  onClick={() => setActivePanel('speed')}
                />
                <SettingRow
                  label="Qualidade"
                  value={qualityLabel}
                  onClick={() => setActivePanel('quality')}
                />
                <SettingRow
                  label="Legendas"
                  value={hasCaptions ? (captionsEnabled ? 'PT-BR' : 'OFF') : 'INDISPONÍVEL'}
                  onClick={() => hasCaptions && setActivePanel('captions')}
                  disabled={!hasCaptions}
                />
                <SettingRow
                  label="Autoplay"
                  isToggle
                  enabled={autoplayEnabled}
                  onToggle={onAutoplayToggle}
                />
              </>
            )}

            {activePanel === 'speed' && PLAYBACK_RATES.map((option) => (
              <SettingOptionRow
                key={option.value}
                label={option.label}
                selected={playbackRate === option.value}
                onSelect={() => {
                  onPlaybackRateChange(option.value);
                  setActivePanel('main');
                }}
              />
            ))}

            {activePanel === 'quality' && QUALITY_OPTIONS.map((option) => (
              <SettingOptionRow
                key={option.value}
                label={option.label}
                selected
                onSelect={() => setActivePanel('main')}
              />
            ))}

            {activePanel === 'captions' && (
              <>
                <SettingOptionRow
                  label="OFF"
                  selected={!captionsEnabled}
                  onSelect={() => {
                    onCaptionsChange(false);
                    setActivePanel('main');
                  }}
                />
                <SettingOptionRow
                  label="PT-BR"
                  selected={captionsEnabled}
                  onSelect={() => {
                    onCaptionsChange(true);
                    setActivePanel('main');
                  }}
                />
              </>
            )}
          </PlayerSettingsModal>
        </div>
      )}
    </div>
  );
}
