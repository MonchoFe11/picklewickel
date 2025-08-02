import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis with new V2 credentials
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const SCRAPE_TARGETS_KEY = 'picklewickel_scrape-targets_v1';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL; // Add to environment variables

interface ScrapeTarget {
  id: string;
  league: string;
  tournamentName: string;
  url: string;
  isActive: boolean;
  tournamentMode?: boolean;
  autoApproval?: boolean;
  lastScraped?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (Vercel adds this header)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get active scrape targets with tournament mode enabled
    const allTargets: ScrapeTarget[] = await redis.get(SCRAPE_TARGETS_KEY) || [];
    const activeTargets = allTargets.filter(target => 
      target.isActive && target.tournamentMode
    );

    if (activeTargets.length === 0) {
      return NextResponse.json({
        message: 'No active scrape targets with tournament mode enabled',
        targets: 0,
        triggered: false,
        database: 'V2 (new working database)'
      });
    }

    // Check if n8n webhook URL is configured
    if (!N8N_WEBHOOK_URL) {
      console.error('N8N_WEBHOOK_URL not configured');
      return NextResponse.json(
        { error: 'n8n webhook URL not configured' },
        { status: 500 }
      );
    }

    // Trigger n8n workflow
    const triggerPayload = {
      trigger: 'scheduled',
      timestamp: new Date().toISOString(),
      targetCount: activeTargets.length,
      targets: activeTargets.map(target => ({
        id: target.id,
        league: target.league,
        tournamentName: target.tournamentName,
        url: target.url,
        autoApproval: target.autoApproval
      }))
    };

    try {
      const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(triggerPayload)
      });

      if (!n8nResponse.ok) {
        throw new Error(`n8n responded with status: ${n8nResponse.status}`);
      }

      return NextResponse.json({
        message: 'Scraping workflow triggered successfully',
        targets: activeTargets.length,
        triggered: true,
        n8nStatus: n8nResponse.status,
        database: 'V2 (new working database)'
      });

    } catch (n8nError) {
      console.error('Failed to trigger n8n workflow:', n8nError);
      return NextResponse.json(
        { error: 'Failed to trigger scraping workflow' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in cron trigger:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}