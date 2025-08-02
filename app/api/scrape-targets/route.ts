import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis with new V2 credentials
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const SCRAPE_TARGETS_KEY = 'picklewickel_scrape-targets_v1';

export interface ScrapeTarget {
  id: string;
  league: 'PPA' | 'APP' | 'MLP' | 'Other';
  tournamentName: string;
  url: string;
  isActive: boolean;
  tournamentMode?: boolean;
  autoApproval?: boolean;
  lastScraped?: string;
  createdAt: string;
  updatedAt: string;
}

function generateId(): string {
  return `target_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters for filtering
    const league = searchParams.get('league');
    const tournamentMode = searchParams.get('tournamentMode');
    const isActive = searchParams.get('isActive');
    const limit = searchParams.get('limit');

    // Get all targets
    let targets: ScrapeTarget[] = await redis.get(SCRAPE_TARGETS_KEY) || [];

    // Apply filters
    if (league) {
      targets = targets.filter(target => target.league === league);
    }

    if (tournamentMode !== null) {
      const tournamentModeBoolean = tournamentMode === 'true';
      targets = targets.filter(target => target.tournamentMode === tournamentModeBoolean);
    }

    if (isActive !== null) {
      const isActiveBoolean = isActive === 'true';
      targets = targets.filter(target => target.isActive === isActiveBoolean);
    }

    // Apply limit if specified
    if (limit) {
      const limitNumber = parseInt(limit);
      targets = targets.slice(0, limitNumber);
    }

    // Sort by most recently updated
    targets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Add summary statistics
    const allTargets: ScrapeTarget[] = await redis.get(SCRAPE_TARGETS_KEY) || [];
    const summary = {
      total: allTargets.length,
      active: allTargets.filter(t => t.isActive).length,
      tournamentMode: allTargets.filter(t => t.tournamentMode).length,
      autoApproval: allTargets.filter(t => t.autoApproval).length,
      byLeague: {
        PPA: allTargets.filter(t => t.league === 'PPA').length,
        APP: allTargets.filter(t => t.league === 'APP').length,
        MLP: allTargets.filter(t => t.league === 'MLP').length,
        Other: allTargets.filter(t => t.league === 'Other').length
      }
    };

    return NextResponse.json({
      targets,
      count: targets.length,
      summary,
      filters: {
        league: league || 'all',
        tournamentMode: tournamentMode || 'all',
        isActive: isActive || 'all',
        limit: limit || 'none'
      }
    });

  } catch (error) {
    console.error('Error fetching scrape targets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scrape targets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const targetData = await request.json();

    // Validate required fields
    if (!targetData.league || !targetData.tournamentName || !targetData.url) {
      return NextResponse.json(
        { error: 'Missing required fields: league, tournamentName, url' },
        { status: 400 }
      );
    }

    // Get existing targets
    const existingTargets: ScrapeTarget[] = await redis.get(SCRAPE_TARGETS_KEY) || [];

    // Check for duplicate URLs
    const existingUrl = existingTargets.find(target => target.url === targetData.url);
    if (existingUrl) {
      return NextResponse.json(
        { error: 'A scrape target with this URL already exists' },
        { status: 409 }
      );
    }

    // Create new target
    const newTarget: ScrapeTarget = {
      id: generateId(),
      league: targetData.league,
      tournamentName: targetData.tournamentName.trim(),
      url: targetData.url.trim(),
      isActive: targetData.isActive !== undefined ? targetData.isActive : true,
      tournamentMode: targetData.tournamentMode || false,
      autoApproval: targetData.autoApproval || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to existing targets
    const updatedTargets = [...existingTargets, newTarget];

    // Save to Redis store
    await redis.set(SCRAPE_TARGETS_KEY, updatedTargets);

    return NextResponse.json({
      success: true,
      target: newTarget,
      message: 'Scrape target created successfully'
    });

  } catch (error) {
    console.error('Error creating scrape target:', error);
    return NextResponse.json(
      { error: 'Failed to create scrape target' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('id');
    const updateData = await request.json();

    if (!targetId) {
      return NextResponse.json(
        { error: 'Target ID is required' },
        { status: 400 }
      );
    }

    // Get existing targets
    const existingTargets: ScrapeTarget[] = await redis.get(SCRAPE_TARGETS_KEY) || [];
    const targetIndex = existingTargets.findIndex(target => target.id === targetId);

    if (targetIndex === -1) {
      return NextResponse.json(
        { error: 'Scrape target not found' },
        { status: 404 }
      );
    }

    // Update target
    const updatedTarget: ScrapeTarget = {
      ...existingTargets[targetIndex],
      ...updateData,
      id: targetId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    // Replace in array
    existingTargets[targetIndex] = updatedTarget;

    // Save updated targets
    await redis.set(SCRAPE_TARGETS_KEY, existingTargets);

    return NextResponse.json({
      success: true,
      target: updatedTarget,
      message: 'Scrape target updated successfully'
    });

  } catch (error) {
    console.error('Error updating scrape target:', error);
    return NextResponse.json(
      { error: 'Failed to update scrape target' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('id');

    if (!targetId) {
      return NextResponse.json(
        { error: 'Target ID is required' },
        { status: 400 }
      );
    }

    // Get existing targets
    const existingTargets: ScrapeTarget[] = await redis.get(SCRAPE_TARGETS_KEY) || [];
    const targetToDelete = existingTargets.find(target => target.id === targetId);

    if (!targetToDelete) {
      return NextResponse.json(
        { error: 'Scrape target not found' },
        { status: 404 }
      );
    }

    // Remove target from array
    const updatedTargets = existingTargets.filter(target => target.id !== targetId);

    // Save updated targets
    await redis.set(SCRAPE_TARGETS_KEY, updatedTargets);

    return NextResponse.json({
      success: true,
      deletedTarget: targetToDelete,
      message: 'Scrape target deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting scrape target:', error);
    return NextResponse.json(
      { error: 'Failed to delete scrape target' },
      { status: 500 }
    );
  }
}