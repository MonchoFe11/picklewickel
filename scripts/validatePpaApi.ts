// scripts/validatePpaApi.ts
// API-based validation for PPA match data

import fetch from 'node-fetch';

// Test configuration using the discovered API
const TEST_CONFIG = {
  bracketUrl: 'https://brackets.pickleballtournaments.com/tournaments/ppa-flower-city-challenger-presented-by-valenti-pickleball/events/923650D4-AC51-4611-BE2E-2319F2A89569/elimination/57FCDC14-1350-4650-ACCB-54B1A8C57F1C',
  apiEndpoint: 'https://pickleball.com/api/v1/results/getResultMatchInfos',
  testMatchId: 'a339f519-44c0-4f65-bfc4-ef3bbeb3819e'
};

interface ApiMatchData {
  match_uuid: string;
  team_one_player_one_name: string;
  team_one_player_two_name: string;
  team_two_player_one_name: string;
  team_two_player_two_name: string;
  team_one_game_one_score: number;
  team_one_game_two_score: number;
  team_one_game_three_score: number;
  team_two_game_one_score: number;
  team_two_game_two_score: number;
  team_two_game_three_score: number;
  tournament_title: string;
  event_title: string;
  round_text: string;
  court_title: string;
  match_status: number;
  winner: number;
  match_start: string;
  match_completed: string;
  match_planned_start: string;
}

interface ScrapedMatch {
  date: string;
  time: string;
  status: string;
  tournamentName: string;
  drawName: string;
  round: string;
  court: string;
  team1: {
    players: { name: string }[];
    isWinner: boolean;
  };
  team2: {
    players: { name: string }[];
    isWinner: boolean;
  };
  setScoresTeam1: number[];
  setScoresTeam2: number[];
  scrapeTargetId: string;
}

async function validatePpaApi() {
  console.log('🚀 Starting PPA API Validation...\n');

  try {
    // Step 1: Test the match data API
    console.log('📡 Testing match data API...');
    const apiUrl = `${TEST_CONFIG.apiEndpoint}?id=${TEST_CONFIG.testMatchId}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PickleWickel/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const apiData = await response.json();
    console.log('✅ API call successful!\n');

    // Step 2: Parse the API response
    const matchData = (apiData as any).data[0] as ApiMatchData;
    console.log('📊 Raw API Data Sample:');
    console.log(`  Tournament: ${matchData.tournament_title}`);
    console.log(`  Event: ${matchData.event_title}`);
    console.log(`  Round: ${matchData.round_text}`);
    console.log(`  Court: ${matchData.court_title}`);
    console.log(`  Players: ${matchData.team_one_player_one_name.trim()} & ${matchData.team_one_player_two_name.trim()}`);
    console.log(`  vs: ${matchData.team_two_player_one_name.trim()} & ${matchData.team_two_player_two_name.trim()}`);
    console.log(`  Scores: ${matchData.team_one_game_one_score}-${matchData.team_two_game_one_score}, ${matchData.team_one_game_two_score}-${matchData.team_two_game_two_score}`);
    console.log(`  Winner: Team ${matchData.winner}\n`);

    // Step 3: Transform to our Match format
    const scrapedMatch = transformApiDataToMatch(matchData);
    console.log('🔄 Transformed Match Object:');
    console.log(JSON.stringify(scrapedMatch, null, 2));
    console.log('');

    // Step 4: Test API integration
    await testApiIntegration(scrapedMatch);

    // Step 5: Test UUID extraction from bracket page
    console.log('🔍 Testing UUID extraction from bracket page...');
    await testUuidExtraction();

  } catch (error) {
    console.error('❌ Validation failed:', error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check if the API endpoint is accessible');
    console.log('2. Verify the match UUID is valid');
    console.log('3. Ensure your local server is running on localhost:3000');
  }
}

function transformApiDataToMatch(apiData: ApiMatchData): ScrapedMatch {
  // Determine match status
  let status = 'Upcoming';
  if (apiData.match_status === 4) {
    status = 'Completed';
  } else if (apiData.match_status === 2) {
    status = 'Live';
  }

  // Extract scores
  const setScoresTeam1: number[] = [];
  const setScoresTeam2: number[] = [];
  
  if (apiData.team_one_game_one_score > 0 || apiData.team_two_game_one_score > 0) {
    setScoresTeam1.push(apiData.team_one_game_one_score);
    setScoresTeam2.push(apiData.team_two_game_one_score);
  }
  
  if (apiData.team_one_game_two_score > 0 || apiData.team_two_game_two_score > 0) {
    setScoresTeam1.push(apiData.team_one_game_two_score);
    setScoresTeam2.push(apiData.team_two_game_two_score);
  }
  
  if (apiData.team_one_game_three_score > 0 || apiData.team_two_game_three_score > 0) {
    setScoresTeam1.push(apiData.team_one_game_three_score);
    setScoresTeam2.push(apiData.team_two_game_three_score);
  }

 // Parse date and time - use actual match start for accuracy
const matchDate = new Date(apiData.match_start || apiData.match_planned_start);
const date = matchDate.toISOString().split('T')[0];
const time = matchDate.toISOString().split('T')[1].substring(0, 5);

  return {
    date,
    time,
    status,
    tournamentName: apiData.tournament_title,
    drawName: apiData.event_title,
    round: apiData.round_text,
    court: apiData.court_title || '',
    team1: {
      players: [
        { name: apiData.team_one_player_one_name.trim() },
        { name: apiData.team_one_player_two_name.trim() }
      ],
      isWinner: apiData.winner === 1
    },
    team2: {
      players: [
        { name: apiData.team_two_player_one_name.trim() },
        { name: apiData.team_two_player_two_name.trim() }
      ],
      isWinner: apiData.winner === 2
    },
    setScoresTeam1,
    setScoresTeam2,
    scrapeTargetId: 'target_1752436821626_b0rcpdint'
  };
}

async function testApiIntegration(match: ScrapedMatch) {
  console.log('🔌 Testing API integration...');
  
  try {
    const response = await fetch('http://localhost:3000/api/matches/scraped', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(match)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ API integration successful!');
      console.log(`   Operation: ${(result as any).operation}`);
      console.log(`   Auto-approved: ${(result as any).autoApproved}`);
      console.log(`   Confidence: ${(result as any).confidence}\n`);
    } else {
      console.log(`❌ API integration failed: ${response.status}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}\n`);
    }
  } catch (error) {
    console.log('❌ API test error:', error);
    console.log('   Make sure your development server is running on localhost:3000\n');
  }
}

async function testUuidExtraction() {
  try {
    console.log('📥 Fetching bracket page...');
    const response = await fetch(TEST_CONFIG.bracketUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PickleWickel/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Bracket page responded with status: ${response.status}`);
    }

    const html = await response.text();
    
    // Look for match-specific UUIDs in /results/match/ URLs
const uuidPattern = /\/results\/match\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/gi;
const matches = [...html.matchAll(uuidPattern)].map(match => match[1]);
const uniqueUuids = Array.from(new Set(matches));
    
    console.log(`✅ Found ${uniqueUuids.length} unique UUIDs in bracket page`);
    console.log('   Sample UUIDs:');
    uniqueUuids.slice(0, 3).forEach((uuid, index) => {
      console.log(`   ${index + 1}. ${uuid}`);
    });
    
    // Verify our test UUID is in the list
    if (uniqueUuids.includes(TEST_CONFIG.testMatchId)) {
      console.log(`✅ Test UUID ${TEST_CONFIG.testMatchId} found in bracket page`);
    } else {
      console.log(`⚠️  Test UUID ${TEST_CONFIG.testMatchId} not found in bracket page`);
    }
    
  } catch (error) {
    console.log('❌ UUID extraction failed:', error);
  }
}

if (require.main === module) {
  validatePpaApi();
}

export { validatePpaApi, transformApiDataToMatch };