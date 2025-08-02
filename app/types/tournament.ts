export interface Tournament {
    id: string;
    name: string;
    startDate: string; // ISO 8601 format
    endDate: string;   // ISO 8601 format
    league: string;    // 'PPA', 'APP', 'MLP', 'NPL', 'Other'
  }