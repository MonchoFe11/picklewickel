import { Match } from '../app/types/match';

/**
 * Enhanced search function that searches across all relevant match fields
 */
export function searchMatches(matches: Match[], searchQuery: string): Match[] {
  if (!searchQuery.trim()) {
    return matches;
  }

  const query = searchQuery.toLowerCase().trim();

  return matches.filter(match => {
    // Helper to get player names (backward compatibility)
    const getPlayerNames = (team: { players: { name: string }[] } | undefined, fallback?: string[]) => {
      if (team?.players) {
        return team.players.map(p => p.name);
      }
      return fallback || [];
    };

    // Get all player names
    const team1Players = getPlayerNames(match.team1, (match as any).playersTeam1);
    const team2Players = getPlayerNames(match.team2, (match as any).playersTeam2);
    const allPlayerNames = [...team1Players, ...team2Players].join(' ').toLowerCase();

    // Search across all relevant fields
    return (
      // Player names
      allPlayerNames.includes(query) ||
      // Tournament name
      match.tournamentName.toLowerCase().includes(query) ||
      // Draw name
      (match.drawName && match.drawName.toLowerCase().includes(query)) ||
      // Round
      (match.round && match.round.toLowerCase().includes(query)) ||
      // Court number
      (match.court && match.court.toLowerCase().includes(query)) ||
      ((match as any).courtNumber && (match as any).courtNumber.toLowerCase().includes(query))
    );
  });
}