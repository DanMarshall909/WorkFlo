import { NextResponse } from 'next/server';
import { VERSION_INFO } from '@/lib/version';

export async function GET() {
  return NextResponse.json({
    appName: 'Anchor Web',
    message: 'Privacy-first ADHD task management frontend',
    ...VERSION_INFO
  });
}