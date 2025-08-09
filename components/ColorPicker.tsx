// components/ColorPicker.tsx
'use client';

import { HexColorPicker } from 'react-colorful';

export default function ColorPicker({
  color,
  onChange,
}: {
  color: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <HexColorPicker color={color} onChange={onChange} />
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 border border-gray-300"
          style={{ backgroundColor: color }}
        />
        <span className="font-mono">{color}</span>
      </div>
    </div>
  );
}