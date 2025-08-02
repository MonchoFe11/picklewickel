import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize connection to OLD database using original credentials
const oldRedis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function GET() {
  try {
    // Try to read data from old database
    const oldMatches = await oldRedis.get('picklewickel_matches_v1');
    const oldTournaments = await oldRedis.get('picklewickel_tournaments_v1');
    
    return NextResponse.json({
      status: 'success',
      recovery: {
        matches: {
          found: Array.isArray(oldMatches),
          count: Array.isArray(oldMatches) ? oldMatches.length : 0,
          data: oldMatches || null
        },
        tournaments: {
          found: Array.isArray(oldTournaments),
          count: Array.isArray(oldTournaments) ? oldTournaments.length : 0,
          data: oldTournaments || null
        }
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Could not access old database - likely still over limit'
    }, { status: 500 });
  }
}