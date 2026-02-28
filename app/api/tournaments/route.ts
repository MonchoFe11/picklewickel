import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const TOURNAMENTS_KEY = 'picklewickel_tournaments_v1';

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  league: string;
}

function generateId(): string {
  return `tournament_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function GET() {
  try {
    const tournaments: Tournament[] = await redis.get(TOURNAMENTS_KEY) || [];
    return NextResponse.json(tournaments);
  } catch (error) {
    console.error('Failed to fetch tournaments:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.name || !data.startDate || !data.endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, startDate, endDate' },
        { status: 400 }
      );
    }

    const tournaments: Tournament[] = await redis.get(TOURNAMENTS_KEY) || [];

    const newTournament: Tournament = {
      id: generateId(),
      name: data.name.trim(),
      startDate: data.startDate,
      endDate: data.endDate,
      league: data.league || 'Other',
    };

    tournaments.push(newTournament);
    await redis.set(TOURNAMENTS_KEY, tournaments);

    return NextResponse.json({ success: true, tournament: newTournament });
  } catch (error) {
    console.error('Failed to create tournament:', error);
    return NextResponse.json({ error: 'Failed to create tournament' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const updates = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
    }

    const tournaments: Tournament[] = await redis.get(TOURNAMENTS_KEY) || [];
    const index = tournaments.findIndex(t => t.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const updatedTournament: Tournament = {
      ...tournaments[index],
      ...updates,
      id, // Ensure ID doesn't change
    };

    tournaments[index] = updatedTournament;
    await redis.set(TOURNAMENTS_KEY, tournaments);

    return NextResponse.json({ success: true, tournament: updatedTournament });
  } catch (error) {
    console.error('Failed to update tournament:', error);
    return NextResponse.json({ error: 'Failed to update tournament' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
    }

    const tournaments: Tournament[] = await redis.get(TOURNAMENTS_KEY) || [];
    const filtered = tournaments.filter(t => t.id !== id);

    if (filtered.length === tournaments.length) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    await redis.set(TOURNAMENTS_KEY, filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete tournament:', error);
    return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 });
  }
}
