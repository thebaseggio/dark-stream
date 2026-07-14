import React, { useEffect, useState } from 'react';

async function extractDominantColor(imageUrl) {
  if (!imageUrl) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 48;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 40) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count += 1;
        }

        if (!count) {
          resolve(null);
          return;
        }

        resolve({
          rgb: `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`,
          rgba: `rgba(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)}, 0.45)`,
        });
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

export default function PlayerAmbientGlow({ thumbnail }) {
  const [ambientColor, setAmbientColor] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadColor = async () => {
      const color = await extractDominantColor(thumbnail);
      if (!cancelled) setAmbientColor(color);
    };

    setAmbientColor(null);
    if (thumbnail) loadColor();

    return () => {
      cancelled = true;
    };
  }, [thumbnail]);

  if (!thumbnail) return null;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {ambientColor && (
        <>
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] blur-[120px] opacity-30"
            style={{
              background: `radial-gradient(ellipse at center, ${ambientColor.rgba} 0%, transparent 68%)`,
            }}
          />
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[90%] blur-[100px] opacity-20 mix-blend-screen"
            style={{ backgroundColor: ambientColor.rgb }}
          />
        </>
      )}

      <img
        src={thumbnail}
        alt=""
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[165%] h-[165%] max-w-none object-cover blur-[120px] opacity-25 scale-110"
      />
      <img
        src={thumbnail}
        alt=""
        className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] max-w-none object-cover blur-[80px] opacity-20 mix-blend-lighten"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-dark-pure/80 via-transparent to-dark-pure/80" />
      <div className="absolute inset-0 bg-gradient-to-b from-dark-pure/60 via-transparent to-dark-pure/90" />
    </div>
  );
}
