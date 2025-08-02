import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis with new V2 credentials
const redis = new Redis({
  url: process.env.V2__KV_REST_API_URL!,
  token: process.env.V2__KV_REST_API_TOKEN!,
});

const MATCHES_KEY = 'picklewickel_scraped_matches_v1';
const SCRAPE_TARGETS_KEY = 'picklewickel_scrape-targets_v1';

interface Match {
  id: string;
  date: string;
  time: string;
  status: 'Live' | 'Upcoming' | 'Completed' | 'Forfeit' | 'Walkover' | 'pending_approval';
  tournamentName: string;
  drawName: string;
  round: string;
  court: string;
  team1: {
    players: { name: string }[];
    seed?: number;
    isWinner: boolean;
  };
  team2: {
    players: { name: string }[];
    seed?: number;
    isWinner: boolean;
  };
  setScoresTeam1: number[];
  setScoresTeam2: number[];
  scrapeTargetId: string;
  scrapedAt: string;
  confidence?: string;
  externalRefId?: string;
}

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

// Generate unique ID
function generateId(): string {
  return `scraped_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isDryRun = searchParams.get('dry') === '1';
    
    const requestBody = await request.json();
    
    // Handle bulk updates from admin context (array of matches)
    if (Array.isArray(requestBody)) {
      console.log('Bulk update from admin context - replacing all scraped matches');
      await redis.set(MATCHES_KEY, requestBody);
      return NextResponse.json({
        success: true,
        operation: 'bulk-update',
        count: requestBody.length,
        message: 'Bulk update completed'
      });
    }
    
    // Handle individual match from n8n scraper
    const scrapedMatch = requestBody;
    
    if (isDryRun) {
      console.log('DRY RUN - Would create match:', scrapedMatch);
      return NextResponse.json({
        success: true,
        operation: 'dry-run',
        match: scrapedMatch,
        message: 'Dry run completed - no data saved'
      });
    }

    // Validate required fields
    if (!scrapedMatch.scrapeTargetId || !scrapedMatch.tournamentName || !scrapedMatch.date) {
      return NextResponse.json(
        { error: 'Missing required fields: scrapeTargetId, tournamentName, date' },
        { status: 400 }
      );
    }

    // Get scrape target to check settings
    const scrapeTargets: ScrapeTarget[] = await redis.get(SCRAPE_TARGETS_KEY) || [];
    const scrapeTarget = scrapeTargets.find(target => target.id === scrapedMatch.scrapeTargetId);

    if (!scrapeTarget) {
      return NextResponse.json(
        { error: 'Scrape target not found' },
        { status: 404 }
      );
    }

    // Check if tournament mode is enabled
    if (!scrapeTarget.tournamentMode) {
      return NextResponse.json(
        { error: 'Tournament mode not enabled for this target' },
        { status: 403 }
      );
    }

    // Get existing matches
    const existingMatches: Match[] = await redis.get(MATCHES_KEY) || [];

    // Prepare the match data
    const matchData: Match = {
      id: generateId(),
      date: scrapedMatch.date,
      time: scrapedMatch.time || '12:00',
      status: scrapeTarget.autoApproval ? scrapedMatch.status : 'pending_approval',
      tournamentName: scrapedMatch.tournamentName,
      drawName: scrapedMatch.drawName || 'Main Draw',
      round: scrapedMatch.round || 'Round 1',
      court: scrapedMatch.court || '',
      team1: {
        players: scrapedMatch.team1?.players || [{ name: 'TBD' }],
        seed: scrapedMatch.team1?.seed,
        isWinner: scrapedMatch.team1?.isWinner || false
      },
      team2: {
        players: scrapedMatch.team2?.players || [{ name: 'TBD' }],
        seed: scrapedMatch.team2?.seed,
        isWinner: scrapedMatch.team2?.isWinner || false
      },
      setScoresTeam1: scrapedMatch.setScoresTeam1 || [],
      setScoresTeam2: scrapedMatch.setScoresTeam2 || [],
      scrapeTargetId: scrapedMatch.scrapeTargetId,
      scrapedAt: new Date().toISOString(),
      confidence: scrapedMatch.confidence || 'medium',
      externalRefId: scrapedMatch.externalRefId
    };

    // Simple deduplication by externalRefId only
    let operation: 'created' | 'updated' = 'created';
    let existingMatch = null;

    if (scrapedMatch.externalRefId) {
      existingMatch = existingMatches.find(m => m.externalRefId === scrapedMatch.externalRefId) || null;
      
      if (existingMatch) {
        // Update existing match
        operation = 'updated';
        const updatedMatches = existingMatches.map(match => 
          match.id === existingMatch.id 
            ? { ...matchData, id: existingMatch.id }
            : match
        );
        await redis.set(MATCHES_KEY, updatedMatches);
      } else {
        // Create new match
        const updatedMatches = [...existingMatches, matchData];
        await redis.set(MATCHES_KEY, updatedMatches);
      }
    } else {
      // For manual matches without externalRefId, just create
      const updatedMatches = [...existingMatches, matchData];
      await redis.set(MATCHES_KEY, updatedMatches);
    }

    // Update scrape target's lastScraped timestamp
    const updatedTargets = scrapeTargets.map(target =>
      target.id === scrapeTarget.id
        ? { ...target, lastScraped: new Date().toISOString() }
        : target
    );
    await redis.set(SCRAPE_TARGETS_KEY, updatedTargets);

    return NextResponse.json({
      success: true,
      operation,
      match: operation === 'updated' ? { ...matchData, id: existingMatch!.id } : matchData,
      autoApproved: scrapeTarget.autoApproval || false,
      confidence: matchData.confidence
    });

  } catch (error) {
    console.error('Error processing scraped match:', error);
    return NextResponse.json(
      { error: 'Failed to process scraped match' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const matches: Match[] = await redis.get(MATCHES_KEY) || [];
    return NextResponse.json(matches);
  } catch (error) {
    console.error('Error fetching scraped matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}