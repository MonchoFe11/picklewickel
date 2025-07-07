// app/utils/formatters.ts

export function formatTime12h(timeString: string): string {
  if (!timeString || !timeString.includes(':')) {
    return timeString;
  }
  
  const [hours, minutes] = timeString.split(':');
  const hour24 = parseInt(hours, 10);
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  
  return `${hour12}:${minutes} ${ampm}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return dateString;
  
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

export function formatPlayers(players: string[]): string {
  return players.join(' / ');
}

export function formatScores(team1Scores: number[], team2Scores: number[]): string {
  if (team1Scores.length === 0 && team2Scores.length === 0) {
    return '-';
  }
  
  const sets = [];
  for (let i = 0; i < Math.max(team1Scores.length, team2Scores.length); i++) {
    const score1 = team1Scores[i] || 0;
    const score2 = team2Scores[i] || 0;
    sets.push(`${score1}-${score2}`);
  }
  return sets.join(', ');
}

export function formatDateForTab(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  }).toUpperCase();
}