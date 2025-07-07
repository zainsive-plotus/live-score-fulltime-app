// src/services/sportsApi/allsportsApiService.ts
// This file centralizes common API-Football related types for consistency across the application.

// --- Core API-Football Types ---

/**
 * Represents a single team in an API-Football fixture or team response.
 */
export interface ApiSportsTeam {
  id: number;
  name: string;
  logo: string;
  winner?: boolean | null; // Indicates if this team won a specific fixture
}

/**
 * Represents fixture status.
 */
export interface ApiSportsFixtureStatus {
  long: string;
  short: string;
  elapsed: number | null;
}

/**
 * Represents basic league information.
 */
export interface ApiSportsLeague {
  id: number;
  name: string;
  type: string; // 'league' or 'cup'
  logo: string;
  season?: number; // Added for context, often present in fixture/standing responses
}

/**
 * Represents the score for a team at half-time, full-time, etc.
 */
export interface ApiSportsGoals {
  home: number | null;
  away: number | null;
}

/**
 * Represents a single API-Football fixture (match).
 */
export interface ApiSportsFixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string; // ISO 8601 date string
    timestamp: number;
    periods: { first: number | null; second: number | null };
    venue: { id: number; name: string; city: string };
    status: ApiSportsFixtureStatus;
  };
  league: ApiSportsLeague;
  teams: {
    home: ApiSportsTeam;
    away: ApiSportsTeam;
  };
  goals: ApiSportsGoals; // Full-time goals
  score: {
    halftime: ApiSportsGoals;
    fulltime: ApiSportsGoals;
    extratime: ApiSportsGoals | null;
    penalty: ApiSportsGoals | null;
  };
  events?: any[]; // Optional: events can be fetched separately
  statistics?: any[]; // Optional: statistics can be fetched separately
  lineups?: any[]; // Optional: lineups can be fetched separately
}

/**
 * Represents a single team's entry in a league standing.
 */
export interface ApiSportsTeamStanding {
  rank: number;
  team: ApiSportsTeam;
  points: number;
  goalsDiff: number;
  group: string;
  form: string; // e.g., "WWDLW"
  status: string; // e.g., "same", "up", "down"
  description: string | null; // e.g., "Promotion - Champions League (Group Stage)"
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  update: string; // Date string
}

/**
 * Represents a league's standings structure (can have multiple groups/stages).
 */
export interface ApiSportsStandings {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    standings: ApiSportsTeamStanding[][]; // Array of arrays because a league can have multiple groups (e.g., Champions League)
  };
}

/**
 * Represents a simplified odds structure for display.
 */
export interface CleanOdds {
  home: string | null;
  draw: string | null;
  away: string | null;
  handicap?: string | null; // For Asian Handicap
  over?: string | null; // For Over/Under
  under?: string | null; // For Over/Under
}

/**
 * Represents a football player.
 */
export interface ApiSportsPlayer {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  birth: {
    date: string;
    place: string;
    country: string;
  };
  nationality: string;
  height: string;
  weight: string;
  injured: boolean;
  photo: string;
}

/**
 * Represents player statistics for a specific team/fixture.
 */
export interface ApiSportsPlayerStats {
  player: ApiSportsPlayer;
  statistics: {
    team: ApiSportsTeam;
    league: ApiSportsLeague;
    games: {
      appearences: number | null;
      lineups: number | null;
      minutes: number | null;
      number: number | null;
      position: string;
      rating: string | null;
      captain: boolean;
    };
    substitutes: {
      in: number | null;
      out: number | null;
      bench: number | null;
    };
    goals: {
      total: number | null;
      conceded: number | null;
      assists: number | null;
      saves: number | null;
    };
    passes: {
      total: number | null;
      key: number | null;
      accuracy: string | null;
    };
    tackles: {
      total: number | null;
      blocks: number | null;
      interceptions: number | null;
    };
    duels: {
      total: number | null;
      won: number | null;
    };
    dribbles: {
      attempts: number | null;
      success: number | null;
      past: number | null;
    };
    fouls: {
      drawn: number | null;
      committed: number | null;
    };
    cards: {
      yellow: number;
      red: number;
    };
    penalty: {
      won: number | null;
      commited: number | null;
      scored: number | null;
      missed: number | null;
      saved: number | null;
    };
  }[];
}

// --- Country type used in /api/countries ---
export interface Country {
  name: string;
  code: string | null; // ISO 3166-1 alpha-2 code
  flagUrl: string;
}
