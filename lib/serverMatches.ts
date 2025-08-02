import { Match } from '../app/types/match';

export async function getMatchById(id: string): Promise<Match | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? '';
    const url = `${baseUrl}/api/matches/scraped`;
    
    const res = await fetch(url, {
      cache: 'no-store', // Ensure fresh data
    });
    
    if (!res.ok) {
      return null;
    }
    
    const matches: Match[] = await res.json();
    const match = matches.find(m => m.id === id);
    
    return match ?? null;
  } catch (error) {
    return null;
  }
}