// app/api/canvas/route.ts
import { NextResponse } from 'next/server';

// In-memory store (for demo purposes)
let canvas: string[][] = Array(32).fill(null).map(() => Array(32).fill('#FFFFFF'));
const userCooldowns = new Map<string, number>();
const COOLDOWN_MS = 5000;

export async function GET() {
  return NextResponse.json({ canvas });
}

export async function POST(request: Request) {
  const { x, y, color, userId } = await request.json();

  // Validate input
  if (typeof x !== 'number' || typeof y !== 'number' || 
      x < 0 || x >= 32 || y < 0 || y >= 32 ||
      !/^#[0-9A-F]{6}$/i.test(color)) {
    return NextResponse.json(
      { error: 'Invalid parameters' },
      { status: 400 }
    );
  }

  // Check cooldown
  const now = Date.now();
  const lastPlaceTime = userCooldowns.get(userId) || 0;
  const remaining = Math.max(0, COOLDOWN_MS - (now - lastPlaceTime));

  if (remaining > 0) {
    return NextResponse.json(
      { error: 'Cooldown active', remaining },
      { status: 429 }
    );
  }

  // Update canvas
  canvas[y][x] = color;
  userCooldowns.set(userId, now);

  return NextResponse.json({ 
    success: true,
    canvas,
    updatedPixel: { x, y, color }
  });
}