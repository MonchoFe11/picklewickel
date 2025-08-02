// lib/brands.ts
export const BRAND_COLORS: Record<string, string> = {
  PPA: '#2563EB',
  APP: '#00c2c7', 
  MLP: '#FB9062',
  NPL: '#A3E635',
  BRK: '#DC2626',
  CHL: '#BE123C',
  LAB: '#e88ca1',
  PTAP: '#25A6E5',
  OAP: '#16A34A',
  FGT: '#CA8A04',
};

export interface BrandInfo {
  abbreviation: string;
  color: string;
  bgClass: string;
}

export function getTournamentBrand(tournamentName: string): BrandInfo {
  if (!tournamentName) {
    return { abbreviation: 'IND', color: '#6b7280', bgClass: 'bg-gray-500' };
  }

  const name = tournamentName.toUpperCase().trim();
  
  // More flexible Brickwall detection
  if (name.startsWith('BRK') || 
      name.includes('BRICKWALL') || 
      name.includes('BRICK WALL') ||
      name.includes('MONEYBALL')) {
    return { abbreviation: 'BRK', color: BRAND_COLORS.BRK, bgClass: 'bg-gray-500' };
  }
  
  for (const [brand, color] of Object.entries(BRAND_COLORS)) {
    if (name.startsWith(brand)) {
      return { abbreviation: brand, color: color, bgClass: 'bg-gray-500' };
    }
  }
  
  return { abbreviation: 'IND', color: '#6b7280', bgClass: 'bg-gray-500' };
}

export function getAvailableBrands(): string[] {
  return Object.keys(BRAND_COLORS);
}

export function getTournamentLeague(tournamentName: string): string {
  if (!tournamentName) return 'Other';
  
  const name = tournamentName.toUpperCase().trim();
  
  if (name.startsWith('PPA')) return 'PPA';
  if (name.startsWith('APP')) return 'APP';  
  if (name.startsWith('MLP')) return 'MLP';
  if (name.startsWith('NPL')) return 'NPL';
  if (name.startsWith('BRK') || 
      name.includes('BRICKWALL') || 
      name.includes('BRICK WALL') ||
      name.includes('MONEYBALL')) return 'BRK';
  if (name.startsWith('CHL')) return 'CHL';
  if (name.startsWith('LAB')) return 'LAB';
  if (name.startsWith('PTAP')) return 'PTAP';
  if (name.startsWith('OAP')) return 'OAP';
  if (name.startsWith('FGT')) return 'FGT';
  
  return 'Other';
}

export function getAvailableLeagues(): string[] {
  return ['All', 'PPA', 'APP', 'MLP', 'NPL', 'BRK', 'CHL', 'LAB', 'PTAP', 'OAP', 'FGT', 'Other'];
}