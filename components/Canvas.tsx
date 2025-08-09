'use client';

import { useState, useEffect } from 'react';
import ColorPicker from './ColorPicker';

const CANVAS_SIZE = 32;
const PIXEL_SIZE = 20;
const COOLDOWN_MS = 5000; // 5 seconds cooldown

export default function Canvas() {
  const [color, setColor] = useState('#000000');
  const [canvas, setCanvas] = useState<string[][]>(
    Array(CANVAS_SIZE).fill(null).map(() => Array(CANVAS_SIZE).fill('#FFFFFF'))
  );
  const [cooldown, setCooldown] = useState(0);
  const [userId] = useState(() => Math.random().toString(36).substring(2));

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

  return (
    <div className="flex flex-col items-center p-4 gap-4">
      <ColorPicker color={color} onChange={setColor} />

      {/* Canvas Grid */}
      <div 
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

      {/* Cooldown counter at the bottom */}
      <div className={`mt-2 px-4 py-2 rounded-lg transition-all duration-300 ${cooldown > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
        {cooldown > 0 ? (
          <div className="flex items-center gap-2">
            <span className="animate-pulse">⏳</span>
            <span>Cooldown: {(cooldown / 1000).toFixed(0)}s remaining</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Ready to place pixels!</span>
          </div>
        )}
      </div>
    </div>
  );
}