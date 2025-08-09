'use client';

import { useState, useEffect, useRef } from 'react';
import ColorPicker from './ColorPicker';

const CANVAS_SIZE = 64;
const PIXEL_SIZE = 10;
const COOLDOWN_MS = 5000; // 5 seconds cooldown
const EXPORT_SCALE = 10; // Makes exported image higher resolution

export default function Canvas() {
  const [color, setColor] = useState('#000000');
  const [canvas, setCanvas] = useState<string[][]>(
    Array(CANVAS_SIZE).fill(null).map(() => Array(CANVAS_SIZE).fill('#FFFFFF'))
  );
  const [cooldown, setCooldown] = useState(0);
  const [userId] = useState(() => Math.random().toString(36).substring(2));
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load initial canvas state
  useEffect(() => {
    fetch('/api/canvas')
      .then(res => res.json())
      .then(data => setCanvas(data.canvas))
      .catch(console.error);
  }, []);

  // Handle cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;

    const interval = setInterval(() => {
      setCooldown(prev => {
        const newValue = prev - 1000;
        if (newValue <= 0) {
          clearInterval(interval);
          // Refresh canvas when cooldown ends
          fetch('/api/canvas')
            .then(res => res.json())
            .then(data => setCanvas(data.canvas));
          return 0;
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  const handlePixelClick = async (x: number, y: number) => {
    if (cooldown > 0) return;

    try {
      const response = await fetch('/api/canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y, color, userId }),
      });

      const result = await response.json();

      if (result.success) {
        // Optimistic update
        setCanvas(prev => {
          const newCanvas = [...prev];
          newCanvas[y] = [...newCanvas[y]];
          newCanvas[y][x] = color;
          return newCanvas;
        });
        // Start cooldown
        setCooldown(COOLDOWN_MS);
      } else if (result.remaining) {
        setCooldown(result.remaining);
      }
    } catch (error) {
      console.error('Error placing pixel:', error);
    }
  };

  const exportAsPNG = () => {
    if (!canvasRef.current) return;

    // Create a temporary canvas for export
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_SIZE * EXPORT_SCALE;
    exportCanvas.height = CANVAS_SIZE * EXPORT_SCALE;
    const ctx = exportCanvas.getContext('2d');

    if (!ctx) return;

    // Draw each pixel to the export canvas
    for (let y = 0; y < CANVAS_SIZE; y++) {
      for (let x = 0; x < CANVAS_SIZE; x++) {
        ctx.fillStyle = canvas[y][x];
        ctx.fillRect(
          x * EXPORT_SCALE, 
          y * EXPORT_SCALE, 
          EXPORT_SCALE, 
          EXPORT_SCALE
        );
      }
    }

    // Convert to PNG and download
    exportCanvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pixel-art-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  return (
    <div className="flex flex-col items-center p-4 gap-4">
      <ColorPicker color={color} onChange={setColor} />

      {/* Canvas Grid */}
      <div 
        ref={canvasRef}
        className="grid border-2 border-gray-800 bg-gray-800 gap-px shadow-lg"
        style={{
          gridTemplateColumns: `repeat(${CANVAS_SIZE}, ${PIXEL_SIZE}px)`,
        }}
      >
        {canvas.map((row, y) =>
          row.map((pixelColor, x) => (
            <button
              key={`${x}-${y}`}
              onClick={() => handlePixelClick(x, y)}
              style={{
                width: PIXEL_SIZE,
                height: PIXEL_SIZE,
                backgroundColor: pixelColor,
              }}
              className={`hover:opacity-80 transition-opacity ${cooldown > 0 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              disabled={cooldown > 0}
              aria-label={`Pixel at position ${x}, ${y}`}
            />
          ))
        )}
      </div>

      {/* Action buttons container */}
      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        {/* Save as PNG button */}
        <button
          onClick={exportAsPNG}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Save as PNG
        </button>

        {/* Cooldown indicator */}
        <div className={`w-full text-center px-4 py-2 rounded-lg transition-all duration-300 ${cooldown > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {cooldown > 0 ? (
            <div className="flex items-center justify-center gap-2">
              <span className="animate-pulse">⏳</span>
              <span>Cooldown: {(cooldown / 1000).toFixed(0)}s remaining</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>✅</span>
              <span>Ready to place pixels!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}