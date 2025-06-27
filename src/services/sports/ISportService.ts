// This interface defines the "contract" that any sports data provider must follow.
export interface ISportService {
  // A competition can be a league, a tournament, a cup, etc.
  getCompetitions(params: { country?: string; type?: string; fetchAll?: boolean }): Promise<any[]>;

  // Fixtures are matches, games, races, etc.
  getFixtures(params: { competitionId?: string; date?: string; season?: string; live?: boolean; teamId?: string }): Promise<any[]>;

  getMatchDetails(matchId: string): Promise<any | null>;
  
  getTeamDetails(teamId: string): Promise<any | null>;

  getStandings(params: { competitionId: string; season: string }): Promise<any | null>;
  
  // You can add more methods as needed, like getPlayers, getTopScorers, etc.
}