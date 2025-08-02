import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis with new V2 credentials
const redis = new Redis({
  url: process.env.V2__KV_REST_API_URL!,
  token: process.env.V2__KV_REST_API_TOKEN!,
});

export async function GET() {
  try {
    const key1 = await redis.get('picklewickel:scrape-targets') || [];
    const key2 = await redis.get('picklewickel_scrape-targets_v1') || [];
    
    return NextResponse.json({
      'picklewickel:scrape-targets': {
        count: (key1 as any[]).length,
        targets: (key1 as any[]).map(t => ({ id: t.id, name: t.tournamentName }))
      },
      'picklewickel_scrape-targets_v1': {
        count: (key2 as any[]).length,
        targets: (key2 as any[]).map(t => ({ id: t.id, name: t.tournamentName }))
      },
      targetIdWeNeed: 'target_1753374119412_y0tkl47y6',
      database: 'V2 (new working database)'
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      database: 'V2 (new working database)' 
    }, { status: 500 });
  }
}