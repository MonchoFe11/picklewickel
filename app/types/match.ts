// Deep Refactor V3 - New Unified Data Model

export interface Player {
  name: string;
}

export interface Team {
  players: Player[];
  seed?: number;
  isWinner?: boolean;
}

export interface Match {
  id: string;
  date: string;
  time: string;
  status: 'Live' | 'Upcoming' | 'Completed' | 'Forfeit' | 'Walkover' | 'pending_approval';
  
  tournamentName: string; 
  drawName: string;      
  round: string;         
  
  court?: string;
  
  team1: Team;
  team2: Team;

  setScoresTeam1: number[];
  setScoresTeam2: number[];
}

export interface Tournament {
  id: string;
  slug: string;
  name: string;
  brand: string;
  startDate: string;
  endDate: string;
}