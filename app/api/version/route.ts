import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: process.env.NEXT_PUBLIC_APP_VERSION || 'local',
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
    builtAt: process.env.NEXT_PUBLIC_BUILD_TIME || null,
  });
}
