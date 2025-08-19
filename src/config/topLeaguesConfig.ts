// ===== src/config/topLeaguesConfig.ts =====

export interface TopLeagueConfig {
  name: string;
  leagueId: string;
  logo: string;
  priority: number;
}

// NOTE: This list is based on the AllSportsAPI provider IDs.
// The priority system determines the display order on the Live Scores page.
// Lower priority number = higher on the page.
export const topLeaguesConfig: TopLeagueConfig[] = [
  // Tier 1: Global Elite & Major Competitions (Priority 1-10)
  {
    name: "Premier League",
    leagueId: "39",
    logo: "https://media.api-sports.io/football/leagues/39.png",
    priority: 1,
  },
  {
    name: "La Liga",
    leagueId: "140",
    logo: "https://media.api-sports.io/football/leagues/140.png",
    priority: 2,
  },
  {
    name: "Serie A",
    leagueId: "135",
    logo: "https://media.api-sports.io/football/leagues/135.png",
    priority: 3,
  },
  {
    name: "Bundesliga",
    leagueId: "78",
    logo: "https://media.api-sports.io/football/leagues/78.png",
    priority: 4,
  },
  {
    name: "Ligue 1",
    leagueId: "61",
    logo: "https://media.api-sports.io/football/leagues/61.png",
    priority: 5,
  },
  {
    name: "UEFA Champions League",
    leagueId: "2",
    logo: "https://media.api-sports.io/football/leagues/2.png",
    priority: 6,
  },
  {
    name: "UEFA Europa League",
    leagueId: "3",
    logo: "https://media.api-sports.io/football/leagues/3.png",
    priority: 7,
  },
  {
    name: "FIFA World Cup",
    leagueId: "1",
    logo: "https://media.api-sports.io/football/leagues/1.png",
    priority: 8,
  },
  {
    name: "UEFA European Championship",
    leagueId: "4",
    logo: "https://media.api-sports.io/football/leagues/4.png",
    priority: 9,
  },
  {
    name: "Copa Libertadores",
    leagueId: "13",
    logo: "https://media.api-sports.io/football/leagues/13.png",
    priority: 10,
  },

  // Tier 2: Strong International & Regional Powerhouses (Priority 11-30)
  {
    name: "Süper Lig",
    leagueId: "203",
    logo: "https://media.api-sports.io/football/leagues/203.png",
    priority: 11,
  }, // Elevated Priority for TR
  {
    name: "Brasileirão Série A",
    leagueId: "71",
    logo: "https://media.api-sports.io/football/leagues/71.png",
    priority: 12,
  },
  {
    name: "Saudi Pro League",
    leagueId: "307",
    logo: "https://media.api-sports.io/football/leagues/307.png",
    priority: 13,
  },
  {
    name: "Primeira Liga",
    leagueId: "94",
    logo: "https://media.api-sports.io/football/leagues/94.png",
    priority: 14,
  },
  {
    name: "Eredivisie",
    leagueId: "88",
    logo: "https://media.api-sports.io/football/leagues/88.png",
    priority: 15,
  },
  {
    name: "Argentine Primera División",
    leagueId: "128",
    logo: "https://media.api-sports.io/football/leagues/128.png",
    priority: 16,
  },
  {
    name: "MLS",
    leagueId: "253",
    logo: "https://media.api-sports.io/football/leagues/253.png",
    priority: 17,
  },
  {
    name: "Liga MX",
    leagueId: "262",
    logo: "https://media.api-sports.io/football/leagues/262.png",
    priority: 18,
  },
  {
    name: "UEFA Europa Conference League",
    leagueId: "848",
    logo: "https://media.api-sports.io/football/leagues/848.png",
    priority: 19,
  },
  {
    name: "Copa America",
    leagueId: "9",
    logo: "https://media.api-sports.io/football/leagues/9.png",
    priority: 20,
  },
  {
    name: "Africa Cup of Nations",
    leagueId: "6",
    logo: "https://media.api-sports.io/football/leagues/6.png",
    priority: 21,
  },

  // Tier 3: The Deep English Pyramid (Priority 31-40)
  {
    name: "EFL Championship",
    leagueId: "40",
    logo: "https://media.api-sports.io/football/leagues/40.png",
    priority: 31,
  },
  {
    name: "FA Cup",
    leagueId: "45",
    logo: "https://media.api-sports.io/football/leagues/45.png",
    priority: 32,
  },
  {
    name: "EFL Cup",
    leagueId: "48",
    logo: "https://media.api-sports.io/football/leagues/48.png",
    priority: 33,
  },
  {
    name: "EFL League One",
    leagueId: "41",
    logo: "https://media.api-sports.io/football/leagues/41.png",
    priority: 34,
  },
  {
    name: "EFL League Two",
    leagueId: "42",
    logo: "https://media.api-sports.io/football/leagues/42.png",
    priority: 35,
  },
  {
    name: "National League",
    leagueId: "43",
    logo: "https://media.api-sports.io/football/leagues/43.png",
    priority: 36,
  },

  // Tier 4: Important European Top Divisions (Priority 41-60)
  {
    name: "Scottish Premiership",
    leagueId: "179",
    logo: "https://media.api-sports.io/football/leagues/179.png",
    priority: 41,
  },
  {
    name: "Belgian Pro League",
    leagueId: "144",
    logo: "https://media.api-sports.io/football/leagues/144.png",
    priority: 42,
  },
  {
    name: "Austrian Bundesliga",
    leagueId: "218",
    logo: "https://media.api-sports.io/football/leagues/218.png",
    priority: 43,
  },
  {
    name: "Swiss Super League",
    leagueId: "207",
    logo: "https://media.api-sports.io/football/leagues/207.png",
    priority: 44,
  },
  {
    name: "Greek Super League",
    leagueId: "197",
    logo: "https://media.api-sports.io/football/leagues/197.png",
    priority: 45,
  },
  {
    name: "Croatian Football League (HNL)",
    leagueId: "210",
    logo: "https://media.api-sports.io/football/leagues/210.png",
    priority: 46,
  },
  {
    name: "Danish Superliga",
    leagueId: "119",
    logo: "https://media.api-sports.io/football/leagues/119.png",
    priority: 47,
  },
  {
    name: "Serbian SuperLiga",
    leagueId: "286",
    logo: "https://media.api-sports.io/football/leagues/286.png",
    priority: 48,
  },
  {
    name: "Polish Ekstraklasa",
    leagueId: "106",
    logo: "https://media.api-sports.io/football/leagues/106.png",
    priority: 49,
  },
  {
    name: "Czech First League",
    leagueId: "345",
    logo: "https://media.api-sports.io/football/leagues/345.png",
    priority: 50,
  },
  {
    name: "Norwegian Eliteserien",
    leagueId: "103",
    logo: "https://media.api-sports.io/football/leagues/103.png",
    priority: 51,
  },
  {
    name: "Swedish Allsvenskan",
    leagueId: "113",
    logo: "https://media.api-sports.io/football/leagues/113.png",
    priority: 52,
  },
  {
    name: "Russian Premier League",
    leagueId: "235",
    logo: "https://media.api-sports.io/football/leagues/235.png",
    priority: 53,
  },
  {
    name: "Ukrainian Premier League",
    leagueId: "234",
    logo: "https://media.api-sports.io/football/leagues/234.png",
    priority: 54,
  },
  {
    name: "Romanian Liga I",
    leagueId: "283",
    logo: "https://media.api-sports.io/football/leagues/283.png",
    priority: 55,
  },

  // Tier 5 & 6: Key Americas, Asian, African & Oceanian Leagues (Priority 61-90)
  {
    name: "AFC Champions League",
    leagueId: "18",
    logo: "https://media.api-sports.io/football/leagues/18.png",
    priority: 61,
  },
  {
    name: "J1 League",
    leagueId: "98",
    logo: "https://media.api-sports.io/football/leagues/98.png",
    priority: 62,
  },
  {
    name: "K League 1",
    leagueId: "292",
    logo: "https://media.api-sports.io/football/leagues/292.png",
    priority: 63,
  },
  {
    name: "A-League Men",
    leagueId: "188",
    logo: "https://media.api-sports.io/football/leagues/188.png",
    priority: 64,
  },
  {
    name: "Categoría Primera A",
    leagueId: "239",
    logo: "https://media.api-sports.io/football/leagues/239.png",
    priority: 65,
  },
  {
    name: "Egyptian Premier League",
    leagueId: "233",
    logo: "https://media.api-sports.io/football/leagues/233.png",
    priority: 66,
  },
  {
    name: "South African Premier Division",
    leagueId: "288",
    logo: "https://media.api-sports.io/football/leagues/288.png",
    priority: 67,
  },

  // Tier 7: Major Second Divisions (Priority 91-100)
  {
    name: "1. Lig",
    leagueId: "204",
    logo: "https://media.api-sports.io/football/leagues/204.png",
    priority: 91,
  }, // Turkey 1. Lig
  {
    name: "La Liga 2",
    leagueId: "141",
    logo: "https://media.api-sports.io/football/leagues/141.png",
    priority: 92,
  },
  {
    name: "2. Bundesliga",
    leagueId: "79",
    logo: "https://media.api-sports.io/football/leagues/79.png",
    priority: 93,
  },
  {
    name: "Serie B",
    leagueId: "136",
    logo: "https://media.api-sports.io/football/leagues/136.png",
    priority: 94,
  },
  {
    name: "Ligue 2",
    leagueId: "62",
    logo: "https://media.api-sports.io/football/leagues/62.png",
    priority: 95,
  },
];

/**
 * A pre-computed map for high-performance priority lookups.
 * Instead of searching the array every time, we can get a priority in O(1) time.
 */
export const leagueIdToPriorityMap = new Map(
  topLeaguesConfig.map((l) => [l.leagueId, l.priority])
);
