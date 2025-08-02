// lib/csv.ts
import { Match } from '../app/types/match';

export interface CSVParseResult {
  validMatches: Omit<Match, 'id'>[];
  errors: string[];
  duplicateCount: number;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result.map(field => field.replace(/^"(.*)"$/, '$1')); // Remove surrounding quotes
}

function parseScores(scoresString: string): { setScoresTeam1: number[]; setScoresTeam2: number[] } {
  const setScoresTeam1: number[] = [];
  const setScoresTeam2: number[] = [];
  
  if (!scoresString.trim()) {
    return { setScoresTeam1, setScoresTeam2 };
  }
  
  // Split by comma to get each game result
  const games = scoresString.split(',').map(game => game.trim());
  
  for (const game of games) {
    if (!game) continue;
    
    // Split by hyphen to get individual scores
    const scores = game.split('-').map(score => score.trim());
    
    if (scores.length === 2) {
      const team1Score = parseInt(scores[0]);
      const team2Score = parseInt(scores[1]);
      
      if (!isNaN(team1Score) && !isNaN(team2Score)) {
        setScoresTeam1.push(team1Score);
        setScoresTeam2.push(team2Score);
      }
    }
  }
  
  return { setScoresTeam1, setScoresTeam2 };
}

export function parseMatchesCSV(csvText: string, existingMatches: Match[] = []): CSVParseResult {
  const errors: string[] = [];
  const validMatches: Omit<Match, 'id'>[] = [];
  let duplicateCount = 0;

  // Helper function to generate a fingerprint from a match object
  const generateMatchFingerprint = (match: any) => {
    const allPlayers = [];
    if (match.team1?.players) allPlayers.push(...match.team1.players.map((p: any) => p.name));
    if (match.team2?.players) allPlayers.push(...match.team2.players.map((p: any) => p.name));
    if ((match as any).playersTeam1) allPlayers.push(...(match as any).playersTeam1);
    if ((match as any).playersTeam2) allPlayers.push(...(match as any).playersTeam2);

    const sortedPlayers = allPlayers
      .map(name => name.toLowerCase().replace(/\s+/g, ''))
      .sort();
    
    const tournament = (match.tournamentName || '').toLowerCase();
    const round = (match.round || '').toLowerCase();
    
    return `${tournament}|${round}|${sortedPlayers.join('')}`;
  };

  // Pre-calculate fingerprints of all existing matches for efficiency
  const existingFingerprints = new Set(existingMatches.map(generateMatchFingerprint));

  try {
    const lines = csvText.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      errors.push('CSV is empty');
      return { validMatches, errors, duplicateCount };
    }

    // Parse header
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
    
    // Required headers (ORIGINAL FORMAT)
    const requiredHeaders = [
      'date', 'time', 'tournamentname', 'drawname', 'round', 
      'team1player1', 'team2player1', 'status'
    ];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    
    if (missingHeaders.length > 0) {
      errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
      return { validMatches, errors, duplicateCount };
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const rowNumber = i + 1;
      const values = parseCSVLine(line);
      
      if (values.length !== headers.length) {
        errors.push(`Row ${rowNumber}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
        continue;
      }

      // Create row object
      const row: { [key: string]: string } = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      const rowErrors: string[] = [];

      // Validate required fields
      if (!row.date) rowErrors.push('Missing date');
      if (!row.time) rowErrors.push('Missing time');
      if (!row.tournamentname) rowErrors.push('Missing tournament name');
      if (!row.drawname) rowErrors.push('Missing draw name');
      if (!row.round) rowErrors.push('Missing round');
      if (!row.team1player1) rowErrors.push('Missing team 1 player 1');
      if (!row.team2player1) rowErrors.push('Missing team 2 player 1');
      if (!row.status) rowErrors.push('Missing status');

      if (rowErrors.length > 0) {
        errors.push(`Row ${rowNumber}: ${rowErrors.join(', ')}`);
        continue;
      }

      try {
        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(row.date)) {
          errors.push(`Row ${rowNumber}: Date must be in YYYY-MM-DD format`);
          continue;
        }

        // Validate time format
        const timeRegex = /^\d{2}:\d{2}$/;
        if (!timeRegex.test(row.time)) {
          errors.push(`Row ${rowNumber}: Time must be in HH:MM format`);
          continue;
        }

        // Validate status
        const validStatuses = ['Live', 'Upcoming', 'Completed', 'Forfeit', 'Walkover'];
        if (!validStatuses.includes(row.status)) {
          errors.push(`Row ${rowNumber}: Invalid status "${row.status}". Must be one of: ${validStatuses.join(', ')}`);
          continue;
        }

        // Parse team players (ORIGINAL FORMAT - individual columns)
        const team1Players = [
          { name: row.team1player1.trim() },
          ...(row.team1player2?.trim() ? [{ name: row.team1player2.trim() }] : [])
        ];
        
        const team2Players = [
          { name: row.team2player1.trim() },
          ...(row.team2player2?.trim() ? [{ name: row.team2player2.trim() }] : [])
        ];

        // Parse scores
        const { setScoresTeam1, setScoresTeam2 } = parseScores(row.scores || '');

        // Parse winner
        let team1IsWinner = false;
        let team2IsWinner = false;
        
        if (row.status === 'Completed' && row.winner) {
          if (row.winner.toLowerCase() === 'team1') {
            team1IsWinner = true;
          } else if (row.winner.toLowerCase() === 'team2') {
            team2IsWinner = true;
          }
        }

        // Build match object
        const match: Omit<Match, 'id'> = {
          date: row.date,
          time: row.time,
          status: row.status as Match['status'],
          tournamentName: row.tournamentname,
          drawName: row.drawname,
          round: row.round,
          court: row.court || '',
          team1: {
            players: team1Players,
            seed: row.team1seed ? parseInt(row.team1seed) : undefined,
            isWinner: team1IsWinner
          },
          team2: {
            players: team2Players,
            seed: row.team2seed ? parseInt(row.team2seed) : undefined,
            isWinner: team2IsWinner
          },
          setScoresTeam1,
          setScoresTeam2
        };

        // Generate fingerprint for the current match from the CSV row
        const currentFingerprint = generateMatchFingerprint(match);

        // Check for duplicates using the highly efficient Set
        if (existingFingerprints.has(currentFingerprint)) {
          duplicateCount++;
          continue;
        }

        // If not a duplicate, add the new fingerprint to the set for the next rows in the same import
        existingFingerprints.add(currentFingerprint);

        validMatches.push(match);
      } catch (error) {
        errors.push(`Row ${rowNumber}: Failed to parse - ${error}`);
      }
    }
  } catch (error) {
    errors.push(`CSV parsing failed: ${error}`);
  }

  return { validMatches, errors, duplicateCount };
}