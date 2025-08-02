import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Redis with new V2 credentials
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const TOURNAMENTS_KEY = 'picklewickel_tournaments_v1';

export async function GET() {
  // Emergency kill switch
  if (process.env.DISABLE_API_CALLS === 'true') {
    return NextResponse.json([]);
  }

  try {
    const tournaments = await redis.get(TOURNAMENTS_KEY);
    return NextResponse.json(tournaments || []);
  } catch (error) {
    console.error('Failed to fetch tournaments:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  // Emergency kill switch
  if (process.env.DISABLE_API_CALLS === 'true') {
    return NextResponse.json({ success: true });
  }

  try {
    const tournaments = await request.json();
    await redis.set(TOURNAMENTS_KEY, tournaments);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save tournaments:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}