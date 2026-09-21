import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const zipPath = path.join(process.cwd(), '..', 'devhub-source-code.zip');
    if (!fs.existsSync(zipPath)) {
      return NextResponse.json({ error: 'Source archive not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(zipPath);

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="devhub-complete-project.zip"',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error('Download error:', err);
    return NextResponse.json({ error: 'Failed to download project zip' }, { status: 500 });
  }
}
