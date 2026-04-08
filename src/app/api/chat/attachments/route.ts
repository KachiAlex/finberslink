// REST API for chat file/image uploads (Messenger-style scaffold)
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = (file.name || '').split('.').pop() || 'bin';
  const fileName = `chat-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat');
  const filePath = path.join(uploadDir, fileName);
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(filePath, buffer);
  const url = `/uploads/chat/${fileName}`;
  return NextResponse.json({ url });
}
