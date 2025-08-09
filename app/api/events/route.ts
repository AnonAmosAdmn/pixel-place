import { NextResponse } from 'next/server';

let clients: any[] = [];

export async function GET() {
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  const clientId = Date.now().toString();
  
  const sendEvent = (data: any) => {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  clients.push({ id: clientId, sendEvent });

  request.signal.onabort = () => {
    clients = clients.filter(c => c.id !== clientId);
    writer.close();
  };

  return new NextResponse(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function POST(request: Request) {
  const { x, y, color } = await request.json();
  
  // Broadcast to all clients
  clients.forEach(client => {
    client.sendEvent({ type: 'pixel-update', x, y, color });
  });

  return NextResponse.json({ success: true });
}