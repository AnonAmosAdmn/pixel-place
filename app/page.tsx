// app/page.tsx
import CanvasWrapper from '@/components/CanvasWrapper';

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <h1 className="text-3xl font-bold text-center mb-6">
        Collaborative Pixel Art
      </h1>
      <div className="max-w-4xl mx-auto">
        <CanvasWrapper />
      </div>
      <footer className="mt-8 text-center text-gray-600">
        <p>Click on pixels to change their color. 5 second cooldown between changes.</p>
      </footer>
    </main>
  );
}