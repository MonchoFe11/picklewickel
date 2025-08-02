import { Match } from '../app/types/match';

// Round priority order (Finals first, Qualifiers last) 
const ROUND_SORT_ORDER: { [key: string]: number } = {
  'Finals': 1,
  'Bronze Match': 2,
  'Semifinals': 3,
  'Quarterfinals': 4,
  'Round of 16': 5,
  'Round of 32': 6,
  'Round of 64': 7,
  'Round of 128': 8,
  'Pool Play': 20,
  'Back Draw': 98,
  'Qualifiers': 99,
};

/**
 * Sorting for Admin and Scores pages:
 * Live → Upcoming → Completed, then by earliest time
 */
export function sortMatchesByStatusAndTime(matches: Match[]): Match[] {
  const statusOrder = { 
    'Live': 0, 
    'Upcoming': 1, 
    'Completed': 2, 
    'Forfeit': 3, 
    'Walkover': 4 
  };

  return [...matches].sort((a, b) => {
    // 1st: Sort by status (Live, Upcoming, Completed)
    const aStatusOrder = statusOrder[a.status] ?? 5;
    const bStatusOrder = statusOrder[b.status] ?? 5;
    
    if (aStatusOrder !== bStatusOrder) {
      return aStatusOrder - bStatusOrder;
    }

    // 2nd: Sort by time (earliest first)
    return a.time.localeCompare(b.time);
  });
}

/**
 * Sorting for Tournament Details pages:
 * Round → Status → Time
 */
export function sortMatchesByRoundStatusTime(matches: Match[]): Match[] {
  const statusOrder = { 
    'Live': 0, 
    'Upcoming': 1, 
    'Completed': 2, 
    'Forfeit': 3, 
    'Walkover': 4 
  };

  return [...matches].sort((a, b) => {
    // 1st: Sort by round (Finals first, Qualifiers last)
    const aRoundPriority = ROUND_SORT_ORDER[a.round] || 50;
    const bRoundPriority = ROUND_SORT_ORDER[b.round] || 50;
    
    if (aRoundPriority !== bRoundPriority) {
      return aRoundPriority - bRoundPriority;
    }

    // 2nd: Sort by status (Live, Upcoming, Completed)
    const aStatusOrder = statusOrder[a.status] ?? 5;
    const bStatusOrder = statusOrder[b.status] ?? 5;
    
    if (aStatusOrder !== bStatusOrder) {
      return aStatusOrder - bStatusOrder;
    }

    // 3rd: Sort by time (earliest first)
    return a.time.localeCompare(b.time);
  });
}

/**
 * Sorting for MLP Tournament Details pages:
 * Premier Level → Challenger Level, then within each level: Round → Status → Time
 */
export function sortMLPMatches(matches: Match[]): Match[] {
  const statusOrder = { 
    'Live': 0, 
    'Upcoming': 1, 
    'Completed': 2, 
    'Forfeit': 3, 
    'Walkover': 4 
  };

  return [...matches].sort((a, b) => {
    // 1st: Sort by MLP level (Premier before Challenger)
    const aIsPremier = a.round.toLowerCase().includes('premier');
    const bIsPremier = b.round.toLowerCase().includes('premier');
    
    if (aIsPremier !== bIsPremier) {
      return aIsPremier ? -1 : 1; // Premier (-1) comes before Challenger (1)
    }

    // 2nd: Sort by round (Finals first, Qualifiers last) 
    const aRoundPriority = ROUND_SORT_ORDER[a.round] || 50;
    const bRoundPriority = ROUND_SORT_ORDER[b.round] || 50;
    
    if (aRoundPriority !== bRoundPriority) {
      return aRoundPriority - bRoundPriority;
    }

    // 3rd: Sort by status (Live, Upcoming, Completed)
    const aStatusOrder = statusOrder[a.status] ?? 5;
    const bStatusOrder = statusOrder[b.status] ?? 5;
    
    if (aStatusOrder !== bStatusOrder) {
      return aStatusOrder - bStatusOrder;
    }

    // 4th: Sort by time (earliest first)
    return a.time.localeCompare(b.time);
  });
}

/**
 * Admin-only sorting: Today's matches first, then past matches
 * Helps admins focus on current day's active work
 */
export function sortMatchesForAdmin(matches: Match[]): Match[] {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    
    // Separate today's matches from past matches
    const todaysMatches = matches.filter(match => match.date === today);
    const pastMatches = matches.filter(match => match.date < today);
    
    // Sort today's matches: Status first (Upcoming/Live before Completed), then by time descending
    const sortedTodaysMatches = todaysMatches.sort((a, b) => {
      const statusOrder = { 
        'Live': 0, 
        'Upcoming': 1, 
        'Completed': 2, 
        'Forfeit': 2, 
        'Walkover': 2 
      };
      
      const aStatusOrder = statusOrder[a.status] ?? 3;
      const bStatusOrder = statusOrder[b.status] ?? 3;
      
      if (aStatusOrder !== bStatusOrder) {
        return aStatusOrder - bStatusOrder;
      }
      
      // Same status - sort by time (descending - latest first)
      return b.time.localeCompare(a.time);
    });
    
    // Sort past matches: Date descending (most recent first), then by time descending
    const sortedPastMatches = pastMatches.sort((a, b) => {
      // First by date (descending - most recent past dates first)
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      
      // Same date - sort by time (descending - latest first)
      return b.time.localeCompare(a.time);
    });
    
    // Combine: Today's matches first, then past matches
    return [...sortedTodaysMatches, ...sortedPastMatches];
  }