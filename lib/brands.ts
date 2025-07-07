// lib/brands.ts
export const BRAND_COLORS: Record<string, string> = {
  PPA: '#3B82F6',
  APP: '#00c2c7', 
  MLP: '#FB9062',
  NPL: '#A3E635',
  BRK: '#EF4444',
  CHL: '#8a1c1c',
  LAB: '#e88ca1',
  PTAP: '#25A6E5',
  OAP: '#4ADE80',
  FGT: '#FACC15',
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

  const name = tournamentName.toUpperCase();
  
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