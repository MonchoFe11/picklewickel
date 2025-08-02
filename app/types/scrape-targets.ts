export interface ScrapeTarget {
  id: string;
  league: 'APP' | 'PPA' | 'NPL' | 'MLP';
  tournamentName: string;
  url: string;
  isActive: boolean;
  tournamentMode: boolean;
  autoApproval: boolean;
  lastScraped?: string; // ISO date string
}

export interface CreateScrapeTargetRequest {
  league: 'APP' | 'PPA' | 'NPL' | 'MLP';
  tournamentName: string;
  url: string;
}

export interface UpdateScrapeTargetRequest {
  id: string;
  league?: 'APP' | 'PPA' | 'NPL' | 'MLP';
  tournamentName?: string;
  url?: string;
  isActive?: boolean;
  tournamentMode?: boolean;
  autoApproval?: boolean;
  lastScraped?: string;
}

export const LEAGUES = ['APP', 'PPA', 'NPL', 'MLP'] as const;

export const LEAGUE_COLORS = {
  APP: 'bg-[#00c2c7] text-black',   // APP Cyan
  PPA: 'bg-[#011f4b] text-white',   // PPA Blue
  NPL: 'bg-[#bed384] text-black',   // NPL Lime Green
  MLP: 'bg-[#FB9062] text-black',   // MLP Orange
} as const;