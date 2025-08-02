// Helper functions for the Review Queue

/**
 * Intelligently determines the correct match status based on scores
 * @param setScoresTeam1 - Array of set scores for team 1
 * @param setScoresTeam2 - Array of set scores for team 2
 * @returns 'Completed' if match is finished, 'Live' if still in progress
 */
export function determineMatchStatus(
  setScoresTeam1: number[], 
  setScoresTeam2: number[]
): 'Completed' | 'Live' {
  // If no scores, assume completed (safer default)
  if (!setScoresTeam1.length || !setScoresTeam2.length) {
    return 'Completed';
  }

  // Count sets won by each team
  let team1Sets = 0;
  let team2Sets = 0;

  for (let i = 0; i < Math.min(setScoresTeam1.length, setScoresTeam2.length); i++) {
    const score1 = setScoresTeam1[i];
    const score2 = setScoresTeam2[i];
    
    // Determine set winner (first to 11, win by 2, or first to 15 if tied at 10-10)
    if (score1 >= 11 && score1 - score2 >= 2) {
      team1Sets++;
    } else if (score2 >= 11 && score2 - score1 >= 2) {
      team2Sets++;
    } else if (score1 >= 15 || score2 >= 15) {
      // Handle deuce scenarios (15-13, etc.)
      if (score1 > score2) team1Sets++;
      else team2Sets++;
    } else {
      // Set is still in progress
      return 'Live';
    }
  }

  // Match is completed if someone won 2 sets (best of 3)
  if (team1Sets >= 2 || team2Sets >= 2) {
    return 'Completed';
  }

  // If we have fewer than 2 completed sets, match is still live
  return 'Live';
}

/**
 * Formats player names for display in table
 */
export function formatPlayersForTable(team: { players: { name: string }[] } | undefined): string {
  if (!team?.players?.length) return 'TBD';
  return team.players.map(p => p.name).join(' / ');
}

/**
 * Formats scores for display in table
 */
export function formatScoresForTable(setScoresTeam1: number[], setScoresTeam2: number[]): string {
  if (!setScoresTeam1.length || !setScoresTeam2.length) return '-';
  
  return setScoresTeam1.map((score1, index) => {
    const score2 = setScoresTeam2[index] || 0;
    return `${score1}-${score2}`;
  }).join(', ');
}