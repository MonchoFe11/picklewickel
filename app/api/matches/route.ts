import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Initialize Redis
const redis = Redis.fromEnv();

const MATCHES_KEY = 'picklewickel_matches_v1';

export async function GET() {
  try {
    const matches = await redis.get(MATCHES_KEY);
    return NextResponse.json(matches || []);
  } catch (error) {
    console.error('Failed to fetch matches:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const matches = await request.json();
    await redis.set(MATCHES_KEY, matches);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save matches:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}