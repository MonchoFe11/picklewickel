import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    // Test basic connectivity
    await kv.set('test-connection', new Date().toISOString());
    const testValue = await kv.get('test-connection');
    
    // Test your actual data
    const matches = await kv.get('picklewickel_matches_v1');
    const tournaments = await kv.get('picklewickel_tournaments_v1');
    
    return NextResponse.json({
      status: 'success',
      connection: 'working',
      testValue,
      dataCheck: {
        matches: Array.isArray(matches) ? matches.length : 'no data',
        tournaments: Array.isArray(tournaments) ? tournaments.length : 'no data'
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      connection: 'failed'
    }, { status: 500 });
  }
}