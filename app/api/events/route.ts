// app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface Client {
  id: string;
  sendEvent: (data: PixelUpdateEvent | CanvasStateEvent) => void;
}

interface PixelUpdateEvent {
  type: 'pixel-update';
  x: number;
  y: number;
  color: string;
}

interface CanvasStateEvent {
  type: 'canvas-state';
  data: string[][];
}

type ClientEvent = PixelUpdateEvent | CanvasStateEvent;

const clients: Client[] = [];
const CANVAS_SIZE = 32;
const canvas: string[][] = Array(CANVAS_SIZE).fill(null).map(() => Array(CANVAS_SIZE).fill('#FFFFFF'));

export async function GET(request: NextRequest) {
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  const clientId = Date.now().toString();
  
  const sendEvent = (data: ClientEvent) => {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  clients.push({ id: clientId, sendEvent });

  // Send initial canvas state
  sendEvent({
    type: 'canvas-state',
    data: canvas
  });

  request.signal.addEventListener('abort', () => {
    const index = clients.findIndex(c => c.id === clientId);
    if (index !== -1) {
      clients.splice(index, 1);
    }
    writer.close();
  });

  return new NextResponse(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function POST(request: NextRequest) {
  const { x, y, color } = await request.json() as { x: number; y: number; color: string };

  // Validate input
  if (
    typeof x !== 'number' || typeof y !== 'number' ||
    x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE ||
    !/^#[0-9A-F]{6}$/i.test(color)
  ) {
    return NextResponse.json(
      { error: 'Invalid parameters' },
      { status: 400 }
    );
  }

  // Update canvas
  canvas[y][x] = color;

  // Create event
  const updateEvent: PixelUpdateEvent = {
    type: 'pixel-update',
    x,
    y,
    color
  };

  // Broadcast to all clients
  clients.forEach(client => {
    try {
      client.sendEvent(updateEvent);
    } catch {
      // Remove disconnected clients
      const index = clients.indexOf(client);
      if (index !== -1) {
        clients.splice(index, 1);
      }
    }
  });

  return NextResponse.json({ success: true });
}