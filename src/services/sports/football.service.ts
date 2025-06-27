import axios from 'axios';
import { ISportService } from './ISportService';
import { format, addDays } from 'date-fns';

// All the logic that was in your API routes is now encapsulated here.
export class FootballApiService implements ISportService {
  private readonly apiKey = process.env.NEXT_PUBLIC_API_FOOTBALL_KEY;
  private readonly apiHost = process.env.NEXT_PUBLIC_API_FOOTBALL_HOST;

  private async request(endpoint: string, params: object) {
    const options = {
      method: 'GET',
      url: `${this.apiHost}/${endpoint}`,
      params,
      headers: { 'x-apisports-key': this.apiKey },
    };
    try {
      const response = await axios.request(options);
      return response.data.response;
    } catch (error) {
      console.error(`[FootballApiService] Error fetching '${endpoint}':`, error);
      throw new Error(`Failed to fetch data from ${endpoint}.`);
    }
  }

  async getCompetitions(params: { country?: string; type?: string; fetchAll?: boolean }): Promise<any[]> {
    // This logic is moved from your /api/leagues route
    const apiParams: any = { current: 'true' };
    if (params.country) apiParams.country = params.country;
    if (params.type) apiParams.type = params.type;

    let allLeagues = await this.request('leagues', apiParams);
    
    // ... add your filtering logic for popular leagues here if needed ...

    return allLeagues; // The transformation can happen in the API route or component
  }

  async getFixtures(params: { competitionId?: string; date?: string; teamId?: string }): Promise<any[]> {
    // This combines logic from your /api/fixtures and /api/upcoming-matches routes
    const apiParams: any = {};
    const season = new Date().getFullYear().toString();

    if (params.competitionId) apiParams.league = params.competitionId;
    if (params.date) apiParams.date = params.date;
    if (params.teamId) {
        apiParams.team = params.teamId;
        apiParams.last = 10; // Example: get last 10 matches for a team
    } else {
        // Default global fetch logic
        apiParams.season = season;
        const today = format(new Date(), 'yyyy-MM-dd');
        apiParams.from = today;
        apiParams.to = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    }
    
    return this.request('fixtures', apiParams);
  }

  async getMatchDetails(matchId: string): Promise<any | null> {
    // This logic is from your /api/match-details route.
    // Combining multiple requests for full detail.
    const [fixture, events, stats, h2h, prediction] = await Promise.all([
        this.request('fixtures', { id: matchId }),
        this.request('fixtures/events', { fixture: matchId }),
        this.request('fixtures/statistics', { fixture: matchId }),
        this.request('fixtures/headtohead', { h2h: `...` }), // h2h needs team IDs
        this.request('predictions', { fixture: matchId })
    ]);
    // Structure and return the combined data
    return { fixture: fixture[0], events, statistics: stats, /* ...etc */ };
  }

  async getTeamDetails(teamId: string): Promise<any | null> {
      // Logic from your /lib/data/team.ts
      return await this.request('teams', { id: teamId });
  }

  async getStandings(params: { competitionId: string; season: string; }): Promise<any | null> {
      return this.request('standings', { league: params.competitionId, season: params.season });
  }
}