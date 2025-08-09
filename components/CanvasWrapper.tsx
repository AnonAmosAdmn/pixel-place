// components/CanvasWrapper.tsx
'use client';

import dynamic from 'next/dynamic';

const Canvas = dynamic(() => import('@/components/Canvas'), {
  ssr: false,
  loading: () => <div className="text-center py-8">Loading canvas...</div>,
});

export default function CanvasWrapper() {
  return <Canvas />;
}